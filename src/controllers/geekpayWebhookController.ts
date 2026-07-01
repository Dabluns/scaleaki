import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../config/logger';
import prisma from '../config/database';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';

/**
 * Webhook handler do GeekPay (gateway proprio do Geek, substituiu o Cakto).
 *
 * IMPORTANTE: schema do payload e event names sao chutes baseados em
 * padroes de gateways comuns (Mercado Pago, Asaas, PagSeguro). Ajustar
 * conforme doc oficial do GeekPay quando disponivel.
 *
 * Envs:
 *   GEEKPAY_WEBHOOK_SECRET      - HMAC-SHA256 secret pra validar signature
 *   GEEKPAY_SIGNATURE_HEADER    - header (default: x-geekpay-signature)
 *   GEEKPAY_API_URL             - URL base do GeekPay (default: https://pay.geekacademy.site)
 *
 * Schema esperado (assumido):
 *   { event: 'paid' | 'refunded' | 'chargeback' | 'canceled',
 *     data: {
 *       id?: string,
 *       external_id?: string,
 *       customer?: { email, name },
 *       plan?: 'mensal' | 'trimestral' | 'anual',
 *       amount?: number, // em centavos
 *       paid_at?: string
 *     }
 *   }
 *
 * Se GeekPay mandar schema diferente, ajuste o parser na funcao parseEvent.
 */

interface GeekPayEvent {
  event?: string;
  type?: string;
  status?: string;
  data?: {
    id?: string;
    external_id?: string;
    refId?: string;
    customer?: { email?: string; name?: string };
    plan?: 'mensal' | 'trimestral' | 'anual' | string;
    amount?: number;
    paid_at?: string;
    paidAt?: string;
  };
  // Fallback top-level
  external_id?: string;
  customer?: { email?: string; name?: string };
  email?: string;
  plan?: string;
  amount?: number;
}

function secretsMatch(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function parseEvent(raw: any): { eventType: string; externalId?: string; customerEmail?: string; plan?: string; amount?: number; paidAt?: Date } {
  const ev: GeekPayEvent = raw || {};
  const eventType = (ev.event || ev.type || ev.status || '').toLowerCase();

  const customerEmail = ev.data?.customer?.email || ev.customer?.email || ev.email;
  const externalId = ev.data?.external_id || ev.data?.id || ev.data?.refId || ev.external_id;
  const plan = ev.data?.plan || ev.plan;
  const amount = ev.data?.amount || ev.amount;
  const paidAtRaw = ev.data?.paid_at || ev.data?.paidAt;

  return {
    eventType,
    externalId,
    customerEmail,
    plan,
    amount,
    paidAt: paidAtRaw ? new Date(paidAtRaw) : new Date(),
  };
}

export async function handleGeekPayWebhook(req: Request, res: Response) {
  try {
    const secret = process.env.GEEKPAY_WEBHOOK_SECRET || '';
    const sigHeader = (process.env.GEEKPAY_SIGNATURE_HEADER || 'x-geekpay-signature').toLowerCase();
    const signature = (req.headers[sigHeader] as string) || '';

    if (secret) {
      if (!signature) {
        logger.warn('[GeekPay] webhook sem signature header', { header: sigHeader });
        return res.status(401).json({ error: 'Missing signature' });
      }
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(rawBody);
      const expected = hmac.digest('hex');
      const sigValue = signature.startsWith('sha256=') ? signature.slice(7) : signature;
      if (!secretsMatch(sigValue, expected)) {
        logger.warn('[GeekPay] webhook signature invalida');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else {
      // Sem secret configurado: log warning e aceita (dev only).
      logger.warn('[GeekPay] GEEKPAY_WEBHOOK_SECRET nao configurado — webhook aceito sem verificar signature');
    }

    const parsed = parseEvent(req.body);
    logger.info('[GeekPay] webhook received', {
      event: parsed.eventType,
      externalId: parsed.externalId,
      email: parsed.customerEmail,
      plan: parsed.plan,
    });

    switch (parsed.eventType) {
      case 'paid':
      case 'payment.approved':
      case 'purchase_approved':
      case 'subscription.created':
      case 'subscription.renewed':
        await activateSubscription(parsed);
        break;
      case 'refunded':
      case 'payment.refunded':
      case 'canceled':
      case 'subscription.canceled':
        await deactivateSubscription(parsed);
        break;
      case 'chargeback':
        await handleChargeback(parsed);
        break;
      case 'refused':
      case 'payment.failed':
        await markPaymentFailed(parsed);
        break;
      default:
        logger.info(`[GeekPay] evento nao tratado: ${parsed.eventType}`);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    logger.error('[GeekPay] erro processando webhook', { error: err.message, stack: err.stack });
    // 200 pra evitar retentativas (padrao de webhooks)
    return res.status(200).json({ received: true, error: 'Processing failed' });
  }
}

async function findUserByParsed(parsed: { customerEmail?: string; externalId?: string }): Promise<{ id: string } | null> {
  if (parsed.customerEmail) {
    const u = await prisma.user.findUnique({ where: { email: parsed.customerEmail }, select: { id: true } });
    if (u) return u;
  }
  if (parsed.externalId) {
    // Reusa caktoSubscriptionId/caktoCustomerId como generic external_ref (tech debt)
    const sub = await prisma.subscription.findFirst({
      where: {
        OR: [
          { caktoSubscriptionId: parsed.externalId },
          { caktoCustomerId: parsed.externalId },
        ],
      },
      select: { userId: true },
    });
    if (sub) return { id: sub.userId };
    const pay = await prisma.payment.findFirst({
      where: { OR: [{ caktoPaymentId: parsed.externalId }, { caktoTransactionId: parsed.externalId }] },
      select: { userId: true },
    });
    if (pay) return { id: pay.userId };
  }
  return null;
}

const PLAN_DURATIONS: Record<string, number> = { mensal: 30, trimestral: 90, anual: 365 };

function resolvePlan(plan?: string): 'mensal' | 'trimestral' | 'anual' {
  if (plan === 'mensal' || plan === 'trimestral' || plan === 'anual') return plan;
  return 'mensal';
}

async function activateSubscription(parsed: ReturnType<typeof parseEvent>) {
  const user = await findUserByParsed(parsed);
  if (!user) {
    logger.warn('[GeekPay] user nao encontrado pra ativar', parsed);
    return;
  }
  const plan = resolvePlan(parsed.plan);
  const expiresAt = new Date(Date.now() + (PLAN_DURATIONS[plan] || 30) * 86400000);
  const amount = parsed.amount || 0;

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: plan as any,
      status: SubscriptionStatus.active,
      amount,
      currency: 'BRL',
      startDate: parsed.paidAt || new Date(),
      endDate: expiresAt,
      isRecurring: true,
      autoRenew: true,
      // Reusa campos cakto* como external_ref generico (tech debt)
      caktoSubscriptionId: parsed.externalId,
      caktoCustomerId: parsed.customerEmail,
      metadata: JSON.stringify({
        gateway: 'geekpay',
        activatedAt: new Date().toISOString(),
      }),
    },
    update: {
      plan: plan as any,
      status: SubscriptionStatus.active,
      amount,
      endDate: expiresAt,
      autoRenew: true,
      caktoSubscriptionId: parsed.externalId,
      caktoCustomerId: parsed.customerEmail,
      metadata: JSON.stringify({
        gateway: 'geekpay',
        updatedAt: new Date().toISOString(),
      }),
    },
  });

  // Atualiza plano do user
  await prisma.user.update({
    where: { id: user.id },
    data: { plan: plan as any, isActive: true, emailConfirmed: true },
  });

  // Cria/atualiza payment record
  if (amount > 0) {
    await prisma.payment.upsert({
      where: { caktoPaymentId: parsed.externalId || `geekpay_${Date.now()}` },
      create: {
        userId: user.id,
        amount,
        currency: 'BRL',
        status: PaymentStatus.paid,
        description: `Assinatura ${plan} via GeekPay`,
        paidAt: parsed.paidAt,
        caktoPaymentId: parsed.externalId,
        webhookData: JSON.stringify({ gateway: 'geekpay', event: parsed.eventType }),
        metadata: JSON.stringify({ gateway: 'geekpay' }),
      },
      update: {
        status: PaymentStatus.paid,
        paidAt: parsed.paidAt,
        webhookData: JSON.stringify({ gateway: 'geekpay', event: parsed.eventType }),
        metadata: JSON.stringify({ gateway: 'geekpay' }),
      },
    });
  }

  logger.info('[GeekPay] subscription ativada', { userId: user.id, plan, externalId: parsed.externalId });
}

async function deactivateSubscription(parsed: ReturnType<typeof parseEvent>) {
  const user = await findUserByParsed(parsed);
  if (!user) return;
  await prisma.subscription.updateMany({
    where: { userId: user.id },
    data: { status: SubscriptionStatus.cancelled, autoRenew: false, cancelledAt: new Date() },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { plan: 'free', isActive: false },
  });
  logger.info('[GeekPay] subscription cancelada', { userId: user.id, reason: parsed.eventType });
}

async function handleChargeback(parsed: ReturnType<typeof parseEvent>) {
  const user = await findUserByParsed(parsed);
  if (!user) return;
  await prisma.subscription.updateMany({
    where: { userId: user.id },
    data: { status: SubscriptionStatus.cancelled, autoRenew: false, cancelledAt: new Date() },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { plan: 'free', isActive: false },
  });
  logger.warn('[GeekPay] CHARGEBACK registrado', { userId: user.id, externalId: parsed.externalId });
}

async function markPaymentFailed(parsed: ReturnType<typeof parseEvent>) {
  const user = await findUserByParsed(parsed);
  if (!user) return;
  await prisma.payment.updateMany({
    where: { userId: user.id, status: PaymentStatus.pending },
    data: { status: PaymentStatus.failed, webhookData: JSON.stringify({ gateway: 'geekpay', event: parsed.eventType }) },
  });
  logger.info('[GeekPay] payment marcado como failed', { userId: user.id });
}
