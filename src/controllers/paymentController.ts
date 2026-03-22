import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import logger from '../config/logger';
import prisma from '../config/database';
import { UserPlan, PaymentStatus, SubscriptionStatus, PaymentMethod } from '@prisma/client';
import caktoService from '../services/caktoService';
import { getBillingHealth as fetchBillingHealth } from '../services/billingService';

// Mapeamento de planos para valores (em centavos)
const PLAN_PRICES: Record<UserPlan, number> = {
  mensal: 9700, // R$ 97,00 - Plano Mensal
  trimestral: 27100, // R$ 271,00 - Plano Trimestral
  anual: 97400, // R$ 974,00 - Plano Anual
};

/**
 * Cria uma nova assinatura para o usuário
 * NOTA: O checkout será processado via webhook da Cakto
 * Este endpoint apenas cria um registro pendente no banco
 */
export async function createSubscription(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { plan, paymentMethod } = req.body;

    // Validar plano
    if (!plan || !['mensal', 'trimestral', 'anual'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Plano inválido. Escolha entre: mensal, trimestral, anual',
      });
    }

    // Método de pagamento é opcional - será selecionado na página da Cakto
    // Se fornecido, validar; caso contrário, será definido pelo webhook da Cakto
    const validPaymentMethods = ['credit_card', 'debit_card', 'pix', 'boleto'];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Método de pagamento inválido',
      });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    // Buscar assinatura existente
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    // Verificar se já existe assinatura ativa
    if (existingSubscription && existingSubscription.status === SubscriptionStatus.active) {
      return res.status(400).json({
        success: false,
        error: 'Usuário já possui uma assinatura ativa',
      });
    }

    const amount = PLAN_PRICES[plan as UserPlan];

    // Criar assinatura pendente no banco de dados
    // O webhook da Cakto atualizará o status quando o pagamento for processado
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: plan as UserPlan,
        status: SubscriptionStatus.trial, // Status inicial - será atualizado pelo webhook
        amount: amount,
        currency: 'BRL',
        startDate: new Date(),
        isRecurring: true,
        autoRenew: true,
        metadata: JSON.stringify({
          ...(paymentMethod && { paymentMethod }),
          createdAt: new Date().toISOString(),
          waitingForWebhook: true,
        }),
      },
      update: {
        plan: plan as UserPlan,
        status: SubscriptionStatus.trial, // Status inicial - será atualizado pelo webhook
        amount: amount,
        autoRenew: true,
        cancelledAt: null,
        metadata: JSON.stringify({
          ...(paymentMethod && { paymentMethod }),
          updatedAt: new Date().toISOString(),
          waitingForWebhook: true,
        }),
      },
    });

    // Criar registro de pagamento pendente associado à assinatura
    const payment = await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: amount,
        currency: 'BRL',
        status: PaymentStatus.pending, // Será atualizado pelo webhook
        paymentMethod: (paymentMethod as PaymentMethod) || PaymentMethod.credit_card, // Valor padrão, será atualizado pelo webhook
        description: `Assinatura ${plan} - ${user.name}`,
        metadata: JSON.stringify({
          plan,
          ...(paymentMethod && { paymentMethod }),
          waitingForWebhook: true,
        }),
      },
    });

    // Determinar período de recorrência baseado no plano
    let recurrencePeriod = 1; // Mensal por padrão
    if (plan === 'trimestral') {
      recurrencePeriod = 3; // Trimestral
    } else if (plan === 'anual') {
      recurrencePeriod = 12; // Anual
    }

    // Criar checkout na Cakto e obter URL
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard?payment=pending`;
    const checkout = await caktoService.createCheckout({
      amount: amount / 100, // Converter de centavos para reais
      customerEmail: user.email,
      customerName: user.name,
      productName: `Assinatura ${plan}`,
      productType: 'subscription',
      ...(paymentMethod && { paymentMethod }), // Opcional - será selecionado na página da Cakto
      recurrencePeriod: recurrencePeriod,
      returnUrl: returnUrl,
    });

    // Salvar checkoutId no metadata do pagamento
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: JSON.stringify({
          plan,
          paymentMethod,
          waitingForWebhook: true,
          caktoCheckoutId: checkout.checkoutId,
          caktoCheckoutUrl: checkout.checkoutUrl,
        }),
      },
    });

    logger.info('Subscription pending created, redirecting to Cakto checkout', {
      userId,
      subscriptionId: subscription.id,
      paymentId: payment.id,
      plan,
      amount,
      checkoutId: checkout.checkoutId,
    });

    return res.status(201).json({
      success: true,
      message: 'Redirecionando para o checkout da Cakto...',
      data: {
        checkoutUrl: checkout.checkoutUrl,
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          amount: subscription.amount / 100, // Converter de centavos para reais
          startDate: subscription.startDate,
        },
        payment: {
          id: payment.id,
          amount: payment.amount / 100,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
        },
      },
    });
  } catch (error: any) {
    logger.error('Failed to create subscription', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar assinatura',
    });
  }
}

/**
 * Cria um pagamento único (não recorrente)
 * NOTA: O checkout será processado via webhook da Cakto
 * Este endpoint apenas cria um registro pendente no banco
 */
export async function createPayment(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { amount, description, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valor inválido',
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Descrição é obrigatória',
      });
    }

    const validPaymentMethods = ['credit_card', 'debit_card', 'pix', 'boleto'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Método de pagamento inválido',
      });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    // Buscar assinatura existente (se houver)
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    // Criar registro de pagamento pendente no banco
    // O webhook da Cakto atualizará o status quando o pagamento for processado
    const payment = await prisma.payment.create({
      data: {
        userId,
        subscriptionId: existingSubscription?.id || null,
        amount: Math.round(amount * 100), // Converter para centavos
        currency: 'BRL',
        status: PaymentStatus.pending, // Será atualizado pelo webhook
        paymentMethod: paymentMethod as PaymentMethod,
        description,
        metadata: JSON.stringify({
          paymentMethod,
          createdAt: new Date().toISOString(),
          waitingForWebhook: true,
        }),
      },
    });

    logger.info('Payment pending created (waiting for webhook)', {
      userId,
      paymentId: payment.id,
      amount: payment.amount,
      paymentMethod,
    });

    return res.status(201).json({
      success: true,
      message: 'Pagamento criado. Aguardando confirmação via webhook.',
      data: {
        payment: {
          id: payment.id,
          amount: payment.amount / 100, // Converter de centavos para reais
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          description: payment.description,
          createdAt: payment.createdAt,
        },
        note: 'O status será atualizado automaticamente quando o pagamento for processado pela Cakto.',
      },
    });
  } catch (error: any) {
    logger.error('Failed to create payment', {
      error: error.message,
      userId: req.user?.userId,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar pagamento',
    });
  }
}

/**
 * Busca assinatura do usuário
 */
export async function getSubscription(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Assinatura não encontrada',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          amount: subscription.amount / 100, // Converter de centavos
          currency: subscription.currency,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          trialEndDate: subscription.trialEndDate,
          cancelledAt: subscription.cancelledAt,
          isRecurring: subscription.isRecurring,
          autoRenew: subscription.autoRenew,
        },
        recentPayments: subscription.payments.map((p: any) => ({
          id: p.id,
          amount: p.amount / 100,
          status: p.status,
          paymentMethod: p.paymentMethod,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error: any) {
    logger.error('Failed to get subscription', {
      error: error.message,
      userId: req.user?.userId,
    });

    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar assinatura',
    });
  }
}

/**
 * Lista pagamentos do usuário
 */
export async function getPayments(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { limit = 20, offset = 0 } = req.query;

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    return res.status(200).json({
      success: true,
      data: {
        payments: payments.map((p: any) => ({
          id: p.id,
          amount: p.amount / 100, // Converter de centavos
          status: p.status,
          paymentMethod: p.paymentMethod,
          description: p.description,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })),
        total: payments.length,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get payments', {
      error: error.message,
      userId: req.user?.userId,
    });

    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar pagamentos',
    });
  }
}

/**
 * Cancela assinatura do usuário
 */
export async function cancelSubscription(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Assinatura não encontrada',
      });
    }

    if (subscription.status === SubscriptionStatus.cancelled) {
      return res.status(400).json({
        success: false,
        error: 'Assinatura já está cancelada',
      });
    }

    // NOTA: O cancelamento será processado via webhook da Cakto
    // Apenas atualizamos o status no banco localmente
    // O webhook confirmará o cancelamento quando processado pela Cakto

    // Atualizar no banco
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.cancelled,
        cancelledAt: new Date(),
        autoRenew: false,
      },
    });

    // Rebaixar plano do usuário para mensal (plano básico)
    await prisma.user.update({
      where: { id: userId },
      data: { plan: 'mensal' },
    });

    logger.info('Subscription cancelled', {
      userId,
      subscriptionId: subscription.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        subscription: {
          id: updated.id,
          status: updated.status,
          cancelledAt: updated.cancelledAt,
        },
      },
    });
  } catch (error: any) {
    logger.error('Failed to cancel subscription', {
      error: error.message,
      userId: req.user?.userId,
    });

    return res.status(500).json({
      success: false,
      error: 'Erro ao cancelar assinatura',
    });
  }
}

/**
 * Busca informações de um pagamento específico
 */
export async function getPayment(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { paymentId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Pagamento não encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          amount: payment.amount / 100,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          description: payment.description,
          paidAt: payment.paidAt,
          expiresAt: payment.expiresAt,
          createdAt: payment.createdAt,
          caktoPaymentId: payment.caktoPaymentId,
          caktoTransactionId: payment.caktoTransactionId,
        },
      },
    });
  } catch (error: any) {
    logger.error('Failed to get payment', {
      error: error.message,
      userId: req.user?.userId,
      paymentId: req.params.paymentId,
    });

    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar pagamento',
    });
  }
}

export async function getBillingHealth(_req: AuthRequest, res: Response) {
  try {
    const snapshot = await fetchBillingHealth();
    return res.json({ success: true, data: snapshot });
  } catch (error: any) {
    logger.error('Failed to fetch billing health', {
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      error: 'Erro ao consultar saúde do billing',
    });
  }
}

