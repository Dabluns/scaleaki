import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../config/logger';
import prisma from '../config/database';
import { PaymentStatus, SubscriptionStatus, PaymentMethod, UserPlan } from '@prisma/client';

/**
 * Comparação de segredo em tempo constante (anti timing-attack).
 * Retorna false se algum lado faltar ou tamanhos divergirem.
 */
function secretsMatch(received?: string, expected?: string): boolean {
  if (!received || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

interface CaktoCustomer {
  name: string;
  email: string;
  phone?: string;
  birthDate?: string | null;
  docNumber?: string;
  docType?: string;
}

interface CaktoSubscription {
  id: string;
  status: string;
  current_period: number;
  recurrence_period: number;
  amount: string;
  paymentMethod: string;
  next_payment_date?: string | null;
  canceledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CaktoPix {
  qrCode: string;
  expirationDate: string;
}

interface CaktoPicPay {
  qrCode: string;
  paymentURL: string;
  expirationDate: string;
}

interface CaktoBoleto {
  barcode: string;
  boletoUrl: string;
  expirationDate: string;
}

interface CaktoCard {
  holderName: string;
  lastDigits: string;
  brand: string | null;
}

interface CaktoWebhookEvent {
  secret: string;
  event: string;
  data: {
    id?: string;
    refId?: string;
    customer?: CaktoCustomer;
    status?: string;
    amount?: number;
    baseAmount?: number;
    paymentMethod?: string;
    paymentMethodName?: string;
    paidAt?: string | null;
    createdAt?: string;
    product?: {
      id: string;
      name: string;
      type: 'unique' | 'subscription';
    };
    subscription?: CaktoSubscription;
    // Campos específicos por método de pagamento
    pix?: CaktoPix;
    picpay?: CaktoPicPay;
    boleto?: CaktoBoleto;
    card?: CaktoCard;
    // Dados de abandono de checkout
    offer?: {
      id: string;
      name: string;
      price: number;
    };
    customerName?: string;
    customerEmail?: string;
    customerCellphone?: string;
    checkoutUrl?: string;
    [key: string]: any;
  };
}

/**
 * Handler para webhooks da Cakto
 */
export async function handleWebhook(req: Request, res: Response) {
  try {
    const event: CaktoWebhookEvent = req.body;
    const webhookSecret = process.env.CAKTO_WEBHOOK_SECRET || '';

    // Fail-closed: sem secret configurado no servidor, NUNCA processar.
    // Evita liberação/revogação de acesso por evento forjado se a env sumir.
    if (!webhookSecret) {
      logger.error('CAKTO_WEBHOOK_SECRET não configurado — rejeitando webhook', {
        ip: req.ip,
      });
      return res.status(503).json({ error: 'Webhook not configured' });
    }

    // Validar secret do webhook (vem no body, não no header) em tempo constante
    if (!secretsMatch(event.secret, webhookSecret)) {
      logger.warn('Invalid or missing webhook secret from Cakto', {
        hasSecret: Boolean(event.secret),
        ip: req.ip,
      });
      return res.status(401).json({ error: 'Invalid secret' });
    }

    logger.info('Cakto webhook received', {
      event: event.event,
      dataId: event.data?.id,
      refId: event.data?.refId,
      customerEmail: event.data?.customer?.email,
    });

    // Processar diferentes tipos de eventos
    switch (event.event) {
      // Eventos de geração de métodos de pagamento
      case 'boleto_gerado':
        await handleBoletoGerado(event);
        break;
      case 'pix_gerado':
        await handlePixGerado(event);
        break;
      case 'picpay_gerado':
        await handlePicpayGerado(event);
        break;

      // Eventos de status de pagamento
      case 'purchase_approved':
        await handlePurchaseApproved(event);
        break;
      case 'purchase_refused':
        await handlePurchaseRefused(event);
        break;

      // Eventos de assinatura
      case 'subscription_canceled':
        await handleSubscriptionCanceled(event);
        break;
      case 'subscription_renewed':
        await handleSubscriptionRenewed(event);
        break;
      case 'subscription_renewal_refused':
        await handleSubscriptionRenewalRefused(event);
        break;

      // Eventos de reembolso e chargeback
      case 'refund':
        await handleRefund(event);
        break;
      case 'chargeback':
        await handleChargeback(event);
        break;

      // Eventos de checkout
      case 'checkout_abandonment':
        await handleCheckoutAbandonment(event);
        break;

      default:
        logger.warn('Unknown webhook event type', {
          event: event.event,
        });
    }

    // Sempre retornar 200 para a Cakto
    return res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('Error processing Cakto webhook', {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });

    // Retornar 200 mesmo em caso de erro para evitar retentativas
    return res.status(200).json({ received: true, error: 'Processing failed' });
  }
}

/**
 * Handler para compra aprovada (purchase_approved)
 * Lida com pagamentos únicos e primeira compra de assinatura
 */
async function handlePurchaseApproved(event: CaktoWebhookEvent) {
  try {
    const paymentId = event.data.id;
    const refId = event.data.refId;
    const customerEmail = event.data.customer?.email;
    const productType = event.data.product?.type;
    const subscription = event.data.subscription;
    const paymentMethod = event.data.paymentMethod;

    // Validações obrigatórias
    if (!customerEmail) {
      logger.warn('Customer email missing in webhook', {
        paymentId,
        refId,
      });
      return;
    }

    if (!event.data.amount) {
      logger.warn('Amount missing in webhook', {
        paymentId,
        refId,
        customerEmail,
      });
      return;
    }

    if (!paymentMethod) {
      logger.warn('Payment method missing in webhook', {
        paymentId,
        refId,
        customerEmail,
      });
      return;
    }

    const amount = Math.round(event.data.amount * 100); // Converter para centavos
    const paidAt = event.data.paidAt ? new Date(event.data.paidAt) : new Date();

    // Buscar usuário pelo email (let no lugar de const)
    let user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      logger.info('User not found, auto-creating account for direct checkout', {
        email: customerEmail,
        paymentId,
      });

      const crypto = require('crypto');
      const bcrypt = require('bcryptjs');
      const tempPassword = crypto.randomBytes(6).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const customerName = event.data.customer?.name || customerEmail.split('@')[0];

      user = await prisma.user.create({
        data: {
          email: customerEmail,
          name: customerName,
          password: hashedPassword,
          role: 'user',
          plan: 'mensal',
          isActive: true,
          emailConfirmed: true,
        }
      });

      // ── Enviar acesso ao cliente — GARANTIR ENTREGA (retry 3x + alerta admin) ──
      const { sendEmail } = require('../utils/email');
      const appUrl = process.env.FRONTEND_URL || 'https://app.scaleaki.site';
      const welcomeHtml = `<div style="font-family: sans-serif; max-width: 600px;">
              <h2>Acesso Liberado! 🚀</h2>
              <p>Olá, <strong>${customerName}</strong>!</p>
              <p>O seu pagamento foi confirmado com sucesso e nós criamos sua conta no <strong>Scaleaki</strong> automaticamente.</p>
              <p>Estes são os seus dados de acesso gerados provisoriamente:</p>
              <ul style="background: #f4f4f4; padding: 20px; list-style-type: none; border-radius: 8px;">
                <li><strong>E-mail: </strong> ${customerEmail}</li>
                <li><strong>Senha: </strong> ${tempPassword}</li>
              </ul>
              <br/>
              <a href="${appUrl}" style="background-color: #22c55e; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Fazer Login no Painel</a>
              <p style="font-size: 12px; color: #666; margin-top: 20px;">Por motivos de segurança, recomendamos que você altere sua senha nas configurações assim que acessar.</p>
            </div>`;

      let emailOk = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await sendEmail(customerEmail, 'Bem-vindo ao Scaleaki! Seu acesso foi liberado.', welcomeHtml);
          emailOk = true;
          logger.info('E-mail de acesso enviado ao comprador', { email: customerEmail, attempt });
          break;
        } catch (err) {
          logger.error(`Falha ao enviar e-mail de acesso (tentativa ${attempt}/3)`, {
            email: customerEmail,
            error: err instanceof Error ? err.message : String(err),
          });
          if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }

      // Se as 3 tentativas falharam, alerta o admin p/ entregar acesso manualmente
      if (!emailOk) {
        try {
          const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'andreyfreitadsd@gmail.com';
          await sendEmail(
            adminEmail,
            `🚨 FALHA no e-mail de acesso — entregar manual: ${customerEmail}`,
            `<div style="font-family: sans-serif; max-width: 600px;">
                <h2>🚨 Comprador sem e-mail de acesso</h2>
                <p>O e-mail de acesso para <strong>${customerEmail}</strong> FALHOU após 3 tentativas. Entregue manualmente:</p>
                <ul style="background: #f4f4f4; padding: 20px; border-radius: 8px;">
                  <li><strong>E-mail:</strong> ${customerEmail}</li>
                  <li><strong>Senha provisória:</strong> ${tempPassword}</li>
                  <li><strong>Login:</strong> ${appUrl}</li>
                  <li><strong>Payment ID:</strong> ${paymentId}</li>
                </ul>
              </div>`
          );
          logger.warn('Alerta admin enviado: email de acesso ao cliente falhou', { customerEmail, adminEmail });
        } catch (e2) {
          logger.error('CRÍTICO: e-mail cliente E alerta admin falharam — comprador sem acesso entregue', {
            email: customerEmail,
            paymentId,
            error: e2 instanceof Error ? e2.message : String(e2),
          });
        }
      }
    }

    // Buscar pagamento pendente pelo email do usuário
    let payment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        status: PaymentStatus.pending,
        caktoPaymentId: null,
      },
      orderBy: { createdAt: 'desc' },
      include: { subscription: true },
    });

    // Extrair informações específicas do método de pagamento
    const paymentMethodInfo = extractPaymentMethodInfo(event.data);
    const expiresAt = paymentMethodInfo.expiresAt;

    // Se não encontrou pagamento pendente, criar um novo
    if (!payment) {
      // Buscar assinatura existente se for tipo subscription
      let subscriptionRecord = null;
      if (productType === 'subscription' && subscription) {
        subscriptionRecord = await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            OR: [
              { caktoSubscriptionId: subscription.id },
              { caktoCustomerId: customerEmail },
            ],
          },
        });
      }

      // Criar novo pagamento
      payment = await prisma.payment.create({
        data: {
          userId: user.id,
          subscriptionId: subscriptionRecord?.id || null,
          amount: amount,
          currency: 'BRL',
          status: PaymentStatus.paid,
          paymentMethod: mapPaymentMethod(paymentMethod),
          description: `Pagamento ${productType === 'subscription' ? 'Assinatura' : 'Único'} - ${event.data.product?.name || 'Produto'}`,
          paidAt: paidAt,
          expiresAt: expiresAt,
          caktoPaymentId: paymentId,
          caktoTransactionId: refId,
          metadata: JSON.stringify(paymentMethodInfo.metadata),
          webhookData: JSON.stringify(event.data),
        },
        include: { subscription: true },
      });
    } else {
      // Atualizar pagamento existente
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          caktoPaymentId: paymentId,
          caktoTransactionId: refId,
          status: PaymentStatus.paid,
          paidAt: paidAt,
          expiresAt: expiresAt,
          metadata: JSON.stringify(paymentMethodInfo.metadata),
          webhookData: JSON.stringify(event.data),
        },
        include: { subscription: true },
      });
    }

    // Se for assinatura, criar ou atualizar assinatura
    if (productType === 'subscription' && subscription) {
      const plan = await determinePlanFromAmount(amount);

      const subscriptionRecord = await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          caktoSubscriptionId: subscription.id,
          caktoCustomerId: customerEmail,
          plan: plan,
          status: subscription.status === 'active' ? SubscriptionStatus.active : SubscriptionStatus.trial,
          amount: Math.round(parseFloat(subscription.amount) * 100),
          currency: 'BRL',
          startDate: new Date(subscription.createdAt),
          endDate: subscription.next_payment_date ? new Date(subscription.next_payment_date) : null,
          isRecurring: true,
          autoRenew: subscription.status === 'active',
          metadata: JSON.stringify({
            caktoData: subscription,
            activatedAt: new Date().toISOString(),
          }),
        },
        update: {
          caktoSubscriptionId: subscription.id,
          caktoCustomerId: customerEmail,
          status: subscription.status === 'active' ? SubscriptionStatus.active : SubscriptionStatus.trial,
          amount: Math.round(parseFloat(subscription.amount) * 100),
          endDate: subscription.next_payment_date ? new Date(subscription.next_payment_date) : null,
          autoRenew: subscription.status === 'active',
          metadata: JSON.stringify({
            caktoData: subscription,
            updatedAt: new Date().toISOString(),
          }),
        },
      });

      // Atualizar plano do usuário
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: subscriptionRecord.plan },
      });

      // Atualizar payment com subscriptionId
      await prisma.payment.update({
        where: { id: payment.id },
        data: { subscriptionId: subscriptionRecord.id },
      });
    }

    logger.info('Purchase approved and processed', {
      paymentId: payment.id,
      caktoPaymentId: paymentId,
      userId: user.id,
      productType,
      hasSubscription: !!subscription,
    });
  } catch (error: any) {
    logger.error('Error handling purchase_approved webhook', {
      error: error.message,
      event: event.event,
      dataId: event.data?.id,
    });
    throw error;
  }
}

/**
 * Handler para cancelamento de assinatura (subscription_canceled)
 */
async function handleSubscriptionCanceled(event: CaktoWebhookEvent) {
  try {
    const subscription = event.data.subscription;

    if (!subscription) {
      logger.warn('Subscription data missing in webhook', {
        dataId: event.data?.id,
      });
      return;
    }

    const subscriptionId = subscription.id;
    const customerEmail = event.data.customer?.email;

    // Buscar assinatura pelo ID da Cakto ou email do cliente
    const subscriptionRecord = await prisma.subscription.findFirst({
      where: {
        OR: [
          { caktoSubscriptionId: subscriptionId },
          { caktoCustomerId: customerEmail },
        ],
      },
      include: { user: true },
    });

    if (!subscriptionRecord) {
      logger.warn('Subscription not found for cancel webhook', {
        caktoSubscriptionId: subscriptionId,
        customerEmail,
      });
      return;
    }

    // Atualizar assinatura
    await prisma.subscription.update({
      where: { id: subscriptionRecord.id },
      data: {
        status: SubscriptionStatus.cancelled,
        cancelledAt: subscription.canceledAt ? new Date(subscription.canceledAt) : new Date(),
        autoRenew: false,
        metadata: JSON.stringify({
          ...(subscriptionRecord.metadata ? JSON.parse(subscriptionRecord.metadata) : {}),
          caktoData: subscription,
          canceledAt: new Date().toISOString(),
        }),
      },
    });

    // Rebaixar plano do usuário para free
    await prisma.user.update({
      where: { id: subscriptionRecord.userId },
      data: { plan: 'free' },
    });

    logger.info('Subscription cancelled from webhook', {
      subscriptionId: subscriptionRecord.id,
      caktoSubscriptionId: subscriptionId,
      userId: subscriptionRecord.userId,
    });
  } catch (error: any) {
    logger.error('Error handling subscription_canceled webhook', {
      error: error.message,
      event: event.event,
      dataId: event.data?.id,
    });
    throw error;
  }
}

/**
 * Handler para renovação de assinatura (subscription_renewed)
 */
async function handleSubscriptionRenewed(event: CaktoWebhookEvent) {
  try {
    const paymentId = event.data.id;
    const refId = event.data.refId;
    const customerEmail = event.data.customer?.email;
    const subscription = event.data.subscription;
    const paymentMethod = event.data.paymentMethod;

    // Validações obrigatórias
    if (!subscription || !customerEmail) {
      logger.warn('Subscription or customer email missing in webhook', {
        paymentId,
        refId,
      });
      return;
    }

    if (!event.data.amount) {
      logger.warn('Amount missing in webhook', {
        paymentId,
        refId,
        customerEmail,
      });
      return;
    }

    if (!paymentMethod) {
      logger.warn('Payment method missing in webhook', {
        paymentId,
        refId,
        customerEmail,
      });
      return;
    }

    const amount = Math.round(event.data.amount * 100); // Converter para centavos
    const paidAt = event.data.paidAt ? new Date(event.data.paidAt) : new Date();

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      logger.warn('User not found for renewal webhook', {
        email: customerEmail,
        paymentId,
      });
      return;
    }

    // Buscar assinatura
    const subscriptionRecord = await prisma.subscription.findFirst({
      where: {
        OR: [
          { caktoSubscriptionId: subscription.id },
          { caktoCustomerId: customerEmail },
        ],
      },
    });

    if (!subscriptionRecord) {
      logger.warn('Subscription not found for renewal webhook', {
        caktoSubscriptionId: subscription.id,
        customerEmail,
      });
      return;
    }

    // Extrair informações específicas do método de pagamento
    const paymentMethodInfo = extractPaymentMethodInfo(event.data);
    const expiresAt = paymentMethodInfo.expiresAt;

    // Criar novo pagamento para a renovação
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        subscriptionId: subscriptionRecord.id,
        amount: amount,
        currency: 'BRL',
        status: PaymentStatus.paid,
        paymentMethod: mapPaymentMethod(paymentMethod),
        description: `Renovação de assinatura - ${event.data.product?.name || 'Produto'}`,
        paidAt: paidAt,
        expiresAt: expiresAt,
        caktoPaymentId: paymentId,
        caktoTransactionId: refId,
        metadata: JSON.stringify(paymentMethodInfo.metadata),
        webhookData: JSON.stringify(event.data),
      },
    });

    // Atualizar assinatura com nova data de vencimento
    await prisma.subscription.update({
      where: { id: subscriptionRecord.id },
      data: {
        status: subscription.status === 'active' ? SubscriptionStatus.active : SubscriptionStatus.trial,
        endDate: subscription.next_payment_date ? new Date(subscription.next_payment_date) : null,
        autoRenew: subscription.status === 'active',
        metadata: JSON.stringify({
          ...(subscriptionRecord.metadata ? JSON.parse(subscriptionRecord.metadata) : {}),
          caktoData: subscription,
          renewedAt: new Date().toISOString(),
        }),
      },
    });

    // Garantir que o plano do usuário está correto
    if (subscription.status === 'active' && user.plan !== subscriptionRecord.plan) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: subscriptionRecord.plan },
      });
    }

    logger.info('Subscription renewed from webhook', {
      paymentId: payment.id,
      subscriptionId: subscriptionRecord.id,
      caktoSubscriptionId: subscription.id,
      userId: user.id,
    });
  } catch (error: any) {
    logger.error('Error handling subscription_renewed webhook', {
      error: error.message,
      event: event.event,
      dataId: event.data?.id,
    });
    throw error;
  }
}

/**
 * Handler para renovação recusada (subscription_renewal_refused) — DUNNING.
 * Cartão recusado na recorrência. NÃO revoga acesso (grace period): a Cakto
 * retenta o cartão automaticamente. Só avisa o cliente p/ atualizar o cartão.
 * Se a Cakto esgotar as tentativas → dispara subscription_canceled → free.
 */
async function handleSubscriptionRenewalRefused(event: CaktoWebhookEvent) {
  try {
    const customerEmail = event.data.customer?.email;
    const subscription = event.data.subscription;

    if (!customerEmail) {
      logger.warn('Customer email missing in subscription_renewal_refused webhook', {
        dataId: event.data?.id,
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) {
      logger.warn('User not found for renewal_refused webhook', { email: customerEmail });
      return;
    }

    // Registrar tentativa de dunning na assinatura (sem mudar plano = grace period)
    const subscriptionRecord = await prisma.subscription.findFirst({
      where: {
        OR: [
          ...(subscription?.id ? [{ caktoSubscriptionId: subscription.id }] : []),
          { caktoCustomerId: customerEmail },
          { userId: user.id },
        ],
      },
    });

    let dunningCount = 1;
    if (subscriptionRecord) {
      const meta = subscriptionRecord.metadata ? JSON.parse(subscriptionRecord.metadata) : {};
      dunningCount = (meta.dunningAttempts || 0) + 1;
      await prisma.subscription.update({
        where: { id: subscriptionRecord.id },
        data: {
          metadata: JSON.stringify({
            ...meta,
            dunningAttempts: dunningCount,
            lastDunningAt: new Date().toISOString(),
            caktoData: subscription || meta.caktoData,
          }),
        },
      });
    }

    // Email de dunning — pedir atualização do cartão
    try {
      const { sendEmail } = require('../utils/email');
      const updateUrl = process.env.DUNNING_UPDATE_URL || 'https://pay.cakto.com.br/xh83thw_917445';
      const whats = process.env.SUPPORT_WHATSAPP || '5521959476313';
      await sendEmail(
        customerEmail,
        '⚠️ Pagamento recusado — atualize seu cartão para manter o acesso',
        `<div style="font-family: sans-serif; max-width: 600px;">
            <h2>Seu pagamento foi recusado 💳</h2>
            <p>Olá, <strong>${user.name}</strong>!</p>
            <p>A cobrança da renovação da sua assinatura <strong>Scaleaki</strong> foi recusada pelo seu banco/cartão.</p>
            <p><strong>Seu acesso continua ativo por enquanto</strong> — vamos tentar cobrar novamente nos próximos dias. Para não perder o acesso, atualize seu cartão agora:</p>
            <a href="${updateUrl}" style="background-color: #22c55e; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 12px 0;">Atualizar pagamento</a>
            <p style="font-size: 13px; color: #666;">Se já atualizou ou pagou, ignore este e-mail.</p>
            <p style="font-size: 13px; color: #666;">Precisa de ajuda? Fale com a gente no WhatsApp: <a href="https://api.whatsapp.com/send/?phone=${whats}">+55 21 95947-6313</a></p>
          </div>`
      );
    } catch (err) {
      logger.error('Falha ao enviar e-mail de dunning (renewal_refused)', err);
    }

    logger.info('Subscription renewal refused — dunning email sent', {
      userId: user.id,
      email: customerEmail,
      dunningAttempt: dunningCount,
    });
  } catch (error: any) {
    logger.error('Error handling subscription_renewal_refused webhook', {
      error: error.message,
      event: event.event,
      dataId: event.data?.id,
    });
    // Não relança — não quebra o webhook
  }
}

/**
 * Mapeia método de pagamento da Cakto para o enum do sistema
 */
function mapPaymentMethod(caktoMethod: string): PaymentMethod {
  const methodMap: Record<string, PaymentMethod> = {
    'pix': PaymentMethod.pix,
    'picpay': PaymentMethod.pix, // PicPay é tratado como PIX no sistema
    'credit_card': PaymentMethod.credit_card,
    'debit_card': PaymentMethod.debit_card,
    'boleto': PaymentMethod.boleto,
  };

  return methodMap[caktoMethod.toLowerCase()] || PaymentMethod.credit_card;
}

/**
 * Extrai informações específicas do método de pagamento do webhook
 */
function extractPaymentMethodInfo(data: CaktoWebhookEvent['data']): {
  expiresAt: Date | null;
  metadata: Record<string, any>;
} {
  const paymentMethod = data.paymentMethod?.toLowerCase();
  let expiresAt: Date | null = null;
  const metadata: Record<string, any> = {};

  switch (paymentMethod) {
    case 'pix':
      if (data.pix) {
        metadata.pix = {
          qrCode: data.pix.qrCode,
          expirationDate: data.pix.expirationDate,
        };
        if (data.pix.expirationDate) {
          expiresAt = new Date(data.pix.expirationDate);
        }
      }
      break;

    case 'picpay':
      if (data.picpay) {
        metadata.picpay = {
          qrCode: data.picpay.qrCode,
          paymentURL: data.picpay.paymentURL,
          expirationDate: data.picpay.expirationDate,
        };
        if (data.picpay.expirationDate) {
          expiresAt = new Date(data.picpay.expirationDate);
        }
      }
      break;

    case 'boleto':
      if (data.boleto) {
        metadata.boleto = {
          barcode: data.boleto.barcode,
          boletoUrl: data.boleto.boletoUrl,
          expirationDate: data.boleto.expirationDate,
        };
        if (data.boleto.expirationDate) {
          expiresAt = new Date(data.boleto.expirationDate);
        }
      }
      break;

    case 'credit_card':
    case 'debit_card':
      if (data.card) {
        metadata.card = {
          holderName: data.card.holderName,
          lastDigits: data.card.lastDigits,
          brand: data.card.brand,
        };
      }
      // Cartão não tem data de expiração (pagamento imediato)
      break;
  }

  return { expiresAt, metadata };
}

/**
 * Handler para abandono de checkout (checkout_abandonment)
 * Registra quando um cliente entra no checkout, preenche dados e sai sem completar
 */
async function handleCheckoutAbandonment(event: CaktoWebhookEvent) {
  try {
    const data = event.data;
    const customerEmail = data.customerEmail;
    const customerName = data.customerName;
    const customerCellphone = data.customerCellphone;
    const checkoutUrl = data.checkoutUrl;
    const offer = data.offer;
    const product = data.product;
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();

    // Log detalhado do abandono
    logger.info('Checkout abandonment detected', {
      customerEmail,
      customerName,
      customerCellphone,
      checkoutUrl,
      offerId: offer?.id,
      offerName: offer?.name,
      offerPrice: offer?.price,
      productId: product?.id,
      productName: product?.name,
      productType: product?.type,
      createdAt,
    });

    // Buscar usuário pelo email (se existir)
    let user = null;
    if (customerEmail) {
      user = await prisma.user.findUnique({
        where: { email: customerEmail },
        select: { id: true, email: true, name: true },
      });
    }

    // TODO: Se necessário no futuro, criar uma tabela CheckoutAbandonment para armazenar esses dados
    // Por enquanto, apenas logamos as informações para análise
    // Exemplo de estrutura futura:
    // await prisma.checkoutAbandonment.create({
    //   data: {
    //     userId: user?.id || null,
    //     customerEmail,
    //     customerName,
    //     customerCellphone,
    //     checkoutUrl,
    //     offerId: offer?.id,
    //     offerName: offer?.name,
    //     offerPrice: offer?.price,
    //     productId: product?.id,
    //     productName: product?.name,
    //     productType: product?.type,
    //     metadata: JSON.stringify(event.data),
    //   },
    // });

    // Log adicional se o usuário já existe no sistema
    if (user) {
      logger.info('Checkout abandonment from existing user', {
        userId: user.id,
        userEmail: user.email,
        checkoutUrl,
      });
    } else {
      logger.info('Checkout abandonment from new prospect', {
        customerEmail,
        customerName,
        checkoutUrl,
      });
    }
  } catch (error: any) {
    logger.error('Error handling checkout_abandonment webhook', {
      error: error.message,
      event: event.event,
      data: event.data,
    });
    // Não lançar erro para não quebrar o webhook
  }
}

/**
 * Handler para boleto gerado (boleto_gerado)
 * Quando um boleto é gerado, atualizamos o pagamento com as informações do boleto
 */
async function handleBoletoGerado(event: CaktoWebhookEvent) {
  try {
    const paymentId = event.data.id;
    const refId = event.data.refId;
    const customerEmail = event.data.customer?.email;
    const boleto = event.data.boleto;

    if (!customerEmail) {
      logger.warn('Customer email missing in boleto_gerado webhook', {
        paymentId,
        refId,
      });
      return;
    }

    if (!boleto) {
      logger.warn('Boleto data missing in webhook', {
        paymentId,
        refId,
        customerEmail,
      });
      return;
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      logger.warn('User not found for boleto_gerado webhook', {
        email: customerEmail,
        paymentId,
      });
      return;
    }

    // Buscar pagamento pendente
    let payment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        OR: [
          { caktoPaymentId: paymentId },
          { caktoTransactionId: refId },
          { status: PaymentStatus.pending },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (payment) {
      // Atualizar pagamento com informações do boleto
      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
      metadata.boleto = {
        barcode: boleto.barcode,
        boletoUrl: boleto.boletoUrl,
        expirationDate: boleto.expirationDate,
      };

      const expiresAt = boleto.expirationDate ? new Date(boleto.expirationDate) : null;

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          caktoPaymentId: paymentId,
          caktoTransactionId: refId,
          expiresAt: expiresAt,
          metadata: JSON.stringify(metadata),
          webhookData: JSON.stringify(event.data),
        },
      });

      logger.info('Boleto generated and payment updated', {
        paymentId: payment.id,
        caktoPaymentId: paymentId,
        userId: user.id,
        expiresAt,
      });
    } else {
      logger.warn('Payment not found for boleto_gerado webhook', {
        email: customerEmail,
        paymentId,
        refId,
      });
    }
  } catch (error: any) {
    logger.error('Error handling boleto_gerado webhook', {
      error: error.message,
      event: event.event,
      dataId: event.data?.id,
    });
  }
}

/**
 * Handler para PIX gerado (pix_gerado)
 * Quando um PIX é gerado, atualizamos o pagamento com as informações do PIX
 */
async function handlePixGerado(event: CaktoWebhookEvent) {
  try {
    const paymentId = event.data.id;
    const refId = event.data.refId;
    const customerEmail = event.data.customer?.email;
    const pix = event.data.pix;

    if (!customerEmail) {
      logger.warn('Customer email missing in pix_gerado webhook', {
        paymentId,
        refId,
      });
      return;
    }

    if (!pix) {
      logger.warn('PIX data missing in webhook', {
        paymentId,
        refId,
        customerEmail,
      });
      return;
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      logger.warn('User not found for pix_gerado webhook', {
        email: customerEmail,
        paymentId,
      });
      return;
    }

    // Buscar pagamento pendente
    let payment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        OR: [
          { caktoPaymentId: paymentId },
          { caktoTransactionId: refId },
          { status: PaymentStatus.pending },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (payment) {
      // Atualizar pagamento com informações do PIX
      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
      metadata.pix = {
        qrCode: pix.qrCode,
        expirationDate: pix.expirationDate,
      };

      const expiresAt = pix.expirationDate ? new Date(pix.expirationDate) : null;

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          caktoPaymentId: paymentId,
          caktoTransactionId: refId,
          expiresAt: expiresAt,
          metadata: JSON.stringify(metadata),
          webhookData: JSON.stringify(event.data),
        },
      });

      logger.info('PIX generated and payment updated', {
        paymentId: payment.id,
        caktoPaymentId: paymentId,
        userId: user.id,
        expiresAt,
      });
    } else {
      logger.warn('Payment not found for pix_gerado webhook', {
        email: customerEmail,
        paymentId,
        refId,
      });
    }
  } catch (error: any) {
    logger.error('Error handling pix_gerado webhook', {
      error: error.message,
      event: event.event,
      dataId: event.data?.id,
    });
  }
}

/**
 * Handler para PicPay gerado (picpay_gerado)
 * Quando um PicPay é gerado, atualizamos o pagamento com as informações do PicPay
 */
async function handlePicpayGerado(event: CaktoWebhookEvent) {
  try {
    const paymentId = event.data.id;
    const refId = event.data.refId;
    const customerEmail = event.data.customer?.email;
    const picpay = event.data.picpay;

    if (!customerEmail) {
      logger.warn('Customer email missing in picpay_gerado webhook', {
        paymentId,
        refId,
      });
      return;
    }

    if (!picpay) {
      logger.warn('PicPay data missing in webhook', {
        paymentId,
        refId,
        customerEmail,
      });
      return;
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      logger.warn('User not found for picpay_gerado webhook', {
        email: customerEmail,
        paymentId,
      });
      return;
    }

    // Buscar pagamento pendente
    let payment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        OR: [
          { caktoPaymentId: paymentId },
          { caktoTransactionId: refId },
          { status: PaymentStatus.pending },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (payment) {
      // Atualizar pagamento com informações do PicPay
      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
      metadata.picpay = {
        qrCode: picpay.qrCode,
        paymentURL: picpay.paymentURL,
        expirationDate: picpay.expirationDate,
      };

      const expiresAt = picpay.expirationDate ? new Date(picpay.expirationDate) : null;

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          caktoPaymentId: paymentId,
          caktoTransactionId: refId,
          expiresAt: expiresAt,
          metadata: JSON.stringify(metadata),
          webhookData: JSON.stringify(event.data),
        },
      });

      logger.info('PicPay generated and payment updated', {
        paymentId: payment.id,
        caktoPaymentId: paymentId,
        userId: user.id,
        expiresAt,
      });
    } else {
      logger.warn('Payment not found for picpay_gerado webhook', {
        email: customerEmail,
        paymentId,
        refId,
      });
    }
  } catch (error: any) {
    logger.error('Error handling picpay_gerado webhook', {
      error: error.message,
      event: event.event,
      dataId: event.data?.id,
    });
  }
}

/**
 * Handler para compra recusada (purchase_refused)
 * Atualiza o status do pagamento para recusado
 */
async function handlePurchaseRefused(event: CaktoWebhookEvent) {
  try {
    const paymentId = event.data.id;
    const refId = event.data.refId;
    const customerEmail = event.data.customer?.email;

    if (!customerEmail) {
      logger.warn('Customer email missing in purchase_refused webhook', {
        paymentId,
        refId,
      });
      return;
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      logger.warn('User not found for purchase_refused webhook', {
        email: customerEmail,
        paymentId,
      });
      return;
    }

    // Buscar pagamento
    let payment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        OR: [
          { caktoPaymentId: paymentId },
          { caktoTransactionId: refId },
          { status: PaymentStatus.pending },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { subscription: true },
    });

    if (payment) {
      // Atualizar pagamento para recusado
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          caktoPaymentId: paymentId,
          caktoTransactionId: refId,
          status: PaymentStatus.failed,
          webhookData: JSON.stringify(event.data),
        },
      });

      // Se houver assinatura associada, cancelar
      if (payment.subscription) {
        await prisma.subscription.update({
          where: { id: payment.subscription.id },
          data: {
            status: SubscriptionStatus.cancelled,
            cancelledAt: new Date(),
            autoRenew: false,
          },
        });

        // Rebaixar plano do usuário
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: 'free' },
        });
      }

      logger.info('Purchase refused and payment updated', {
        paymentId: payment.id,
        caktoPaymentId: paymentId,
        userId: user.id,
      });
    } else {
      logger.warn('Payment not found for purchase_refused webhook', {
        email: customerEmail,
        paymentId,
        refId,
      });
    }
  } catch (error: any) {
    logger.error('Error handling purchase_refused webhook', {
      error: error.message,
      event: event.event,
      dataId: event.data?.id,
    });
  }
}

/**
 * Handler para reembolso (refund)
 * Atualiza o status do pagamento para reembolsado
 */
async function handleRefund(event: CaktoWebhookEvent) {
  try {
    const paymentId = event.data.id;
    const refId = event.data.refId;
    const customerEmail = event.data.customer?.email;

    if (!customerEmail) {
      logger.warn('Customer email missing in refund webhook', {
        paymentId,
        refId,
      });
      return;
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      logger.warn('User not found for refund webhook', {
        email: customerEmail,
        paymentId,
      });
      return;
    }

    // Buscar pagamento
    let payment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        OR: [
          { caktoPaymentId: paymentId },
          { caktoTransactionId: refId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { subscription: true },
    });

    if (payment) {
      // Atualizar pagamento para reembolsado
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.refunded,
          webhookData: JSON.stringify(event.data),
        },
      });

      // Se houver assinatura associada, cancelar
      if (payment.subscription) {
        await prisma.subscription.update({
          where: { id: payment.subscription.id },
          data: {
            status: SubscriptionStatus.cancelled,
            cancelledAt: new Date(),
            autoRenew: false,
          },
        });

        // Rebaixar plano do usuário
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: 'free' },
        });
      }

      logger.info('Refund processed and payment updated', {
        paymentId: payment.id,
        caktoPaymentId: paymentId,
        userId: user.id,
      });
    } else {
      logger.warn('Payment not found for refund webhook', {
        email: customerEmail,
        paymentId,
        refId,
      });
    }
  } catch (error: any) {
    logger.error('Error handling refund webhook', {
      error: error.message,
      event: event.event,
      dataId: event.data?.id,
    });
  }
}

/**
 * Handler para chargeback
 * Atualiza o status do pagamento para chargeback
 */
async function handleChargeback(event: CaktoWebhookEvent) {
  try {
    const paymentId = event.data.id;
    const refId = event.data.refId;
    const customerEmail = event.data.customer?.email;

    if (!customerEmail) {
      logger.warn('Customer email missing in chargeback webhook', {
        paymentId,
        refId,
      });
      return;
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      logger.warn('User not found for chargeback webhook', {
        email: customerEmail,
        paymentId,
      });
      return;
    }

    // Buscar pagamento
    let payment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        OR: [
          { caktoPaymentId: paymentId },
          { caktoTransactionId: refId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { subscription: true },
    });

    if (payment) {
      // Atualizar pagamento para chargeback
      // Nota: Se não houver status específico para chargeback, usar refunded
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.refunded, // Usar refunded como fallback
          webhookData: JSON.stringify(event.data),
        },
      });

      // Se houver assinatura associada, cancelar
      if (payment.subscription) {
        await prisma.subscription.update({
          where: { id: payment.subscription.id },
          data: {
            status: SubscriptionStatus.cancelled,
            cancelledAt: new Date(),
            autoRenew: false,
          },
        });

        // Rebaixar plano do usuário
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: 'free' },
        });
      }

      logger.info('Chargeback processed and payment updated', {
        paymentId: payment.id,
        caktoPaymentId: paymentId,
        userId: user.id,
      });
    } else {
      logger.warn('Payment not found for chargeback webhook', {
        email: customerEmail,
        paymentId,
        refId,
      });
    }
  } catch (error: any) {
    logger.error('Error handling chargeback webhook', {
      error: error.message,
      event: event.event,
      dataId: event.data?.id,
    });
  }
}

/**
 * Determina o plano baseado no valor do pagamento
 */
async function determinePlanFromAmount(amountInCents: number): Promise<UserPlan> {
  const amount = amountInCents / 100; // Converter de centavos para reais

  // Valores reais cobrados por plano (em reais) — atualizado 2026-06-08
  // Anual:       R$ 804,00 (1x/ano, headline R$67/mês)
  // Trimestral:  R$ 225,00 (a cada 3 meses, headline R$75/mês)
  // Mensal:      R$ 84,00 (ou R$ 71,00 com desconto 15% t3nf6rm)
  // Faixas sem sobreposição: >=500 anual, >=150 trimestral, resto mensal
  if (amount >= 500.00) {
    return UserPlan.anual; // Anual (R$804)
  } else if (amount >= 150.00) {
    return UserPlan.trimestral; // Trimestral (R$225)
  }

  return UserPlan.mensal; // Mensal (R$84 ou R$71 com desconto)
}
