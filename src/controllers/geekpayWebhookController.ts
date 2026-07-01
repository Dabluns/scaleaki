import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../config/logger';
import prisma from '../config/database';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';

/**
 * Webhook handler do GeekPay (pay.geekacademy.site).
 *
 * CONTRATO v1.0 (2026-07-01) — fonte da verdade: docs/SCALEAKI-INTEGRATION.md
 *
 * URL:        POST /webhooks/scaleaki
 * Signature:  HMAC-SHA256(secret, `<X-GeekPay-Timestamp>.<raw_body>`)
 * Header:     X-GeekPay-Signature: sha256=<hex>
 * Anti-replay: rejeita se |now - timestamp| > 5min
 * Idempotency: (gateway, external_id) é UNIQUE no GeekPay; upserts em
 *              Payment.caktoPaymentId e Subscription.userId garantem no-op
 *              em reentrega.
 *
 * Eventos:
 *   payment.paid            -> ativa assinatura
 *   payment.refunded        -> desativa
 *   payment.chargeback      -> desativa + flag
 *   subscription.cancelled  -> desativa
 *   subscription.past_due   -> marca suspended (dunning cuida)
 *
 * Schema payload (resumo):
 *   { event, timestamp, data: {
 *       id, external_id, gateway, method, amount_cents, fee_cents, net_cents,
 *       status, product, product_slug,
 *       customer: { name, email, cpf, phone },
 *       paid_at, created_at, started_at?, cancelled_at?, next_billing_at?
 *   }}
 */

const PLAN_BY_SLUG: Record<string, 'mensal' | 'trimestral' | 'anual'> = {
  'scaleaki-mensal': 'mensal',
  'scaleaki-trimestral': 'trimestral',
  'scaleaki-anual': 'anual',
};

const PLAN_DURATIONS: Record<string, number> = {
  mensal: 30,
  trimestral: 90,
  anual: 365,
};

interface GeekPayCustomer {
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
}

interface GeekPayData {
  id?: string;
  external_id?: string;
  gateway?: string;
  method?: string;
  amount_cents?: number;
  fee_cents?: number;
  net_cents?: number;
  status?: string;
  product?: string;
  product_slug?: string;
  customer?: GeekPayCustomer;
  paid_at?: string;
  created_at?: string;
  started_at?: string;
  cancelled_at?: string;
  next_billing_at?: string;
}

interface GeekPayPayload {
  event?: string;
  timestamp?: string;
  data?: GeekPayData;
}

interface ParsedEvent {
  eventType: string;
  productSlug?: string;
  plan?: 'mensal' | 'trimestral' | 'anual';
  externalId?: string;
  gateway?: string;
  customerEmail?: string;
  customerName?: string;
  amountCents?: number;
  paidAt?: Date;
  raw: GeekPayData;
}

function parseEvent(body: any): ParsedEvent {
  const p: GeekPayPayload = body || {};
  const data: GeekPayData = p.data || {};
  const productSlug = data.product_slug;
  const plan = productSlug ? PLAN_BY_SLUG[productSlug] : undefined;
  return {
    eventType: (p.event || '').toLowerCase(),
    productSlug,
    plan,
    externalId: data.external_id || data.id,
    gateway: data.gateway,
    customerEmail: data.customer?.email,
    customerName: data.customer?.name,
    amountCents: typeof data.amount_cents === 'number' ? data.amount_cents : undefined,
    paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
    raw: data,
  };
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function handleGeekPayWebhook(req: Request, res: Response) {
  try {
    const secret = process.env.GEEKPAY_WEBHOOK_SECRET || '';
    const tsHeader = 'x-geekpay-timestamp';
    const sigHeader = 'x-geekpay-signature';
    const deliveryHeader = 'x-geekpay-delivery';
    const eventHeader = 'x-geekpay-event';

    const signature = (req.headers[sigHeader] as string) || '';
    const timestamp = (req.headers[tsHeader] as string) || '';
    const delivery = (req.headers[deliveryHeader] as string) || '';
    const eventHeaderVal = (req.headers[eventHeader] as string) || '';

    // rawBody capturado pelo express.json verify em server.ts
    const rawBody: Buffer | undefined = (req as any).rawBody;
    const bodyString = rawBody ? rawBody.toString('utf8') : '';

    // ── Validação de signature ────────────────────────────────────────────────
    if (!secret) {
      logger.warn('[GeekPay] GEEKPAY_WEBHOOK_SECRET nao configurado — rejeitando (nunca aceita sem secret em prod)');
      return res.status(401).json({ error: 'Webhook secret not configured' });
    }

    if (!signature || !timestamp) {
      logger.warn('[GeekPay] webhook sem headers de signature/timestamp', { sig: !!signature, ts: !!timestamp });
      return res.status(401).json({ error: 'Missing signature or timestamp' });
    }

    // Anti-replay: rejeita se timestamp > 5min de now (clock skew tolerance)
    const tsMs = Date.parse(timestamp);
    if (Number.isNaN(tsMs)) {
      logger.warn('[GeekPay] timestamp invalido', { timestamp });
      return res.status(401).json({ error: 'Invalid timestamp' });
    }
    const ageMs = Math.abs(Date.now() - tsMs);
    if (ageMs > 5 * 60 * 1000) {
      logger.warn('[GeekPay] timestamp fora da janela de 5min', { age_ms: ageMs });
      return res.status(401).json({ error: 'Timestamp out of window' });
    }

    // HMAC-SHA256(secret, `<ts>.<raw_body>`)
    const expected = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${bodyString}`)
      .digest('hex');

    const sigValue = signature.startsWith('sha256=') ? signature : 'sha256=' + signature;
    if (!safeEqual(sigValue, expected)) {
      // Log só prefixo pra nao vazar em logs
      logger.warn('[GeekPay] signature invalida', {
        sig_prefix: sigValue.slice(0, 12),
        expected_prefix: expected.slice(0, 12),
        body_size: bodyString.length,
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // ── Parse ─────────────────────────────────────────────────────────────────
    let parsed: ParsedEvent;
    try {
      parsed = parseEvent(req.body);
    } catch (parseErr: any) {
      logger.error('[GeekPay] erro parseando body', { error: parseErr.message });
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    logger.info('[GeekPay] webhook received', {
      event: parsed.eventType || eventHeaderVal,
      delivery: delivery ? delivery.slice(0, 8) : 'none',
      productSlug: parsed.productSlug,
      plan: parsed.plan,
      gateway: parsed.gateway,
      externalId: parsed.externalId,
      email: parsed.customerEmail,
      amount_cents: parsed.amountCents,
      body_size: bodyString.length,
    });

    // ── Processa evento ──────────────────────────────────────────────────────
    // Idempotência garantida pelos upserts em Payment.caktoPaymentId (UNIQUE)
    // e Subscription.userId (UNIQUE). Reentrega = no-op.
    try {
      switch (parsed.eventType) {
        case 'payment.paid':
        case 'subscription.created':
        case 'subscription.renewed':
          await activateSubscription(parsed);
          break;
        case 'payment.refunded':
        case 'subscription.cancelled':
          await deactivateSubscription(parsed, parsed.eventType);
          break;
        case 'payment.chargeback':
          await handleChargeback(parsed);
          break;
        case 'subscription.past_due':
          await markPastDue(parsed);
          break;
        default:
          logger.info(`[GeekPay] evento nao tratado: ${parsed.eventType}`);
      }
    } catch (processErr: any) {
      logger.error('[GeekPay] erro processando evento', {
        error: processErr.message,
        code: processErr.code,
        meta: processErr.meta ? JSON.stringify(processErr.meta).slice(0, 300) : null,
        stack: processErr.stack?.split('\n').slice(0, 3).join(' | '),
        event: parsed.eventType,
        externalId: parsed.externalId,
      });
      // 200 com error no body: GeekPay marca success (não retenta)
      return res.status(200).json({ received: true, error: 'Processing failed' });
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    logger.error('[GeekPay] erro fatal no handler', { error: err.message, stack: err.stack });
    return res.status(200).json({ received: true, error: 'Internal error' });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function findUserByParsed(parsed: ParsedEvent): Promise<{ id: string } | null> {
  if (parsed.customerEmail) {
    const u = await prisma.user.findUnique({
      where: { email: parsed.customerEmail },
      select: { id: true },
    });
    if (u) return u;
  }
  if (parsed.externalId) {
    // Reusa cakto* como generic external_ref (tech debt — não migrado)
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
      where: {
        OR: [
          { caktoPaymentId: parsed.externalId },
          { caktoTransactionId: parsed.externalId },
        ],
      },
      select: { userId: true },
    });
    if (pay) return { id: pay.userId };
  }
  return null;
}

async function activateSubscription(parsed: ParsedEvent) {
  if (!parsed.plan) {
    logger.warn('[GeekPay] plan nao resolvido do product_slug', { productSlug: parsed.productSlug, externalId: parsed.externalId });
    return;
  }

  const user = await findUserByParsed(parsed);
  if (!user) {
    logger.warn('[GeekPay] user nao encontrado pra ativar', {
      email: parsed.customerEmail,
      externalId: parsed.externalId,
    });
    return;
  }

  const expiresAt = new Date(Date.now() + (PLAN_DURATIONS[parsed.plan] || 30) * 86400000);
  const amountReais = parsed.amountCents ? parsed.amountCents / 100 : 0;

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: parsed.plan as any,
      status: SubscriptionStatus.active,
      amount: amountReais,
      currency: 'BRL',
      startDate: parsed.paidAt || new Date(),
      endDate: expiresAt,
      isRecurring: true,
      autoRenew: true,
      // Reusa campos cakto* como external_ref generico (tech debt)
      caktoSubscriptionId: parsed.externalId,
      caktoCustomerId: parsed.customerEmail,
      metadata: JSON.stringify({
        gateway: parsed.gateway || 'geekpay',
        productSlug: parsed.productSlug,
        activatedAt: new Date().toISOString(),
      }),
    },
    update: {
      plan: parsed.plan as any,
      status: SubscriptionStatus.active,
      amount: amountReais,
      endDate: expiresAt,
      autoRenew: true,
      caktoSubscriptionId: parsed.externalId,
      caktoCustomerId: parsed.customerEmail,
      metadata: JSON.stringify({
        gateway: parsed.gateway || 'geekpay',
        productSlug: parsed.productSlug,
        updatedAt: new Date().toISOString(),
      }),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: parsed.plan as any, isActive: true, emailConfirmed: true },
  });

  if (parsed.amountCents && parsed.amountCents > 0) {
    await prisma.payment.upsert({
      where: { caktoPaymentId: parsed.externalId || `geekpay_${Date.now()}` },
      create: {
        userId: user.id,
        amount: amountReais,
        currency: 'BRL',
        status: PaymentStatus.paid,
        description: `Assinatura ${parsed.plan} via GeekPay (${parsed.gateway || 'gateway'})`,
        paidAt: parsed.paidAt,
        caktoPaymentId: parsed.externalId,
        webhookData: JSON.stringify({ gateway: parsed.gateway, event: parsed.eventType, productSlug: parsed.productSlug }),
        metadata: JSON.stringify({ gateway: parsed.gateway || 'geekpay', productSlug: parsed.productSlug }),
      },
      update: {
        status: PaymentStatus.paid,
        paidAt: parsed.paidAt,
        webhookData: JSON.stringify({ gateway: parsed.gateway, event: parsed.eventType, productSlug: parsed.productSlug }),
        metadata: JSON.stringify({ gateway: parsed.gateway || 'geekpay', productSlug: parsed.productSlug }),
      },
    });
  }

  logger.info('[GeekPay] subscription ativada', {
    userId: user.id,
    plan: parsed.plan,
    productSlug: parsed.productSlug,
    externalId: parsed.externalId,
  });
}

async function deactivateSubscription(parsed: ParsedEvent, reason = 'cancelled') {
  const user = await findUserByParsed(parsed);
  if (!user) {
    logger.warn('[GeekPay] user nao encontrado pra desativar', { email: parsed.customerEmail });
    return;
  }
  await prisma.subscription.updateMany({
    where: { userId: user.id },
    data: { status: SubscriptionStatus.cancelled, autoRenew: false, cancelledAt: new Date() },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { plan: 'free', isActive: false },
  });
  logger.info('[GeekPay] subscription desativada', { userId: user.id, reason });
}

async function handleChargeback(parsed: ParsedEvent) {
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

async function markPastDue(parsed: ParsedEvent) {
  const user = await findUserByParsed(parsed);
  if (!user) return;
  // Mantem acesso (status active) mas marca flag past_due no metadata
  // (SubscriptionStatus enum não tem 'past_due' — usamos 'suspended' que
  // semanticamente = "acesso retido mas recuperável", equivalente funcional)
  await prisma.subscription.updateMany({
    where: { userId: user.id },
    data: {
      status: SubscriptionStatus.suspended,
      metadata: JSON.stringify({
        gateway: parsed.gateway,
        pastDueAt: new Date().toISOString(),
        lastEvent: parsed.eventType,
      }),
    },
  });
  logger.info('[GeekPay] subscription past_due -> suspended', { userId: user.id, externalId: parsed.externalId });
}