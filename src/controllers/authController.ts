import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { AuthRequest } from '../middlewares/authMiddleware';
import logger from '../config/logger';
import prisma from '../config/database';
import { getClientIp } from '../utils/getClientIp';

export async function register(req: Request, res: Response) {
  try {
    // O projeto é um SaaS pago, logo a fricção de confirmar e-mail foi removida
    const autoConfirm = true;
    const payload = await authService.register(req.body, autoConfirm);
    logger.info('User registered successfully', { userId: payload.user.id, email: payload.user.email, autoConfirm });

    // Se for auto-confirmado, setar cookie de autenticação
    if (autoConfirm) {
      res.cookie('auth_token', payload.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 dias
      });
    } else {
      // Não retornar token se email não estiver confirmado
      const { token, ...payloadWithoutToken } = payload;
      return res.status(201).json({
        success: true,
        message: 'Conta criada com sucesso! Verifique seu email para confirmar sua conta.',
        data: payloadWithoutToken
      });
    }

    return res.status(201).json({
      success: true,
      data: payload
    });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('Registration failed', { error: message, email: req.body?.email });

    // Prisma unique constraint (P2002)
    const code = (err as any)?.code;
    if (code === 'P2002' || /unique constraint/i.test(message)) {
      return res.status(400).json({ success: false, error: 'Este email já está em uso.' });
    }

    // Validação de senha do service
    if (/Senha fraca/i.test(message)) {
      return res.status(400).json({ success: false, error: message });
    }

    return res.status(400).json({ success: false, error: 'Erro no cadastro. Verifique os dados fornecidos.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const clientIp = getClientIp(req);
    const payload = await authService.login(req.body, clientIp);
    logger.info('User logged in successfully', { userId: payload.user.id, email: payload.user.email, ip: clientIp });
    // Setar o cookie auth_token
    res.cookie('auth_token', payload.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 dias
    });
    return res.status(200).json({
      success: true,
      data: payload
    });
  } catch (err: any) {
    const clientIp = getClientIp(req);
    logger.warn('Login failed', { error: err.message, email: req.body?.email, ip: clientIp });

    // Se o erro for relacionado ao IP bloqueado, retornar mensagem específica
    if (err.message && err.message.includes('Login bloqueado')) {
      return res.status(403).json({ success: false, error: err.message });
    }

    // Sempre retornar mensagem genérica para evitar enumeração de usuários
    return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
  }
}

// Para refresh token, aqui está um stub (ajuste conforme estratégia de refresh token escolhida)
export async function refresh(req: Request, res: Response) {
  return res.status(501).json({
    success: false,
    error: 'Funcionalidade não implementada.'
  });
}

// Para logout, aqui está um stub (ajuste conforme estratégia de blacklist ou expiração de token)
export async function logout(req: AuthRequest, res: Response) {
  logger.info('User logged out', { userId: req.user?.userId });

  // Limpar o cookie auth_token
  res.clearCookie('auth_token', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  return res.status(200).json({
    success: true,
    message: 'Logout realizado com sucesso.'
  });
}

export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({
      success: false,
      error: 'Não autenticado.'
    });

    // Buscar usuário no banco (sem senha) usando singleton
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      logger.warn('User not found in database', { userId: req.user.userId });
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado.'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (err: any) {
    logger.error('Error fetching user data', { error: err.message, userId: req.user?.userId });
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor.'
    });
  }
}

export async function confirmEmail(req: Request, res: Response) {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, error: 'Token inválido.' });
  }
  const user = await prisma.user.findFirst({
    where: {
      emailConfirmationToken: token,
      emailConfirmationExpires: { gte: new Date() },
      emailConfirmed: false,
    },
  });
  if (!user) {
    return res.status(400).json({ success: false, error: 'Token inválido ou expirado.' });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailConfirmed: true,
      emailConfirmationToken: null,
      emailConfirmationExpires: null,
    },
  });
  return res.json({ success: true, message: 'E-mail confirmado com sucesso!' });
}

const resendAttempts: Record<string, { count: number; lastReset: number }> = {};

export async function resendConfirmation(req: Request, res: Response) {
  const { email } = req.body;
  const ip = req.ip;
  const key = `${email}:${ip}`;
  const now = Date.now();
  if (!resendAttempts[key] || now - resendAttempts[key].lastReset > 60 * 60 * 1000) {
    resendAttempts[key] = { count: 0, lastReset: now };
  }
  if (resendAttempts[key].count >= 5) {
    return res.status(429).json({ success: false, error: 'Limite de tentativas de reenvio atingido. Tente novamente mais tarde.' });
  }
  resendAttempts[key].count++;
  if (!email) return res.status(400).json({ success: false, error: 'E-mail é obrigatório.' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
  if (user.emailConfirmed) return res.status(400).json({ success: false, error: 'E-mail já confirmado.' });
  const crypto = require('crypto');
  const emailConfirmationToken = crypto.randomBytes(32).toString('hex');
  const emailConfirmationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await prisma.user.update({
    where: { id: user.id },
    data: { emailConfirmationToken, emailConfirmationExpires },
  });
  const { sendEmail } = require('../utils/email');
  const confirmUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/confirm?token=${emailConfirmationToken}`;
  await sendEmail(
    user.email,
    'Confirme seu cadastro',
    `<p>Olá, ${user.name}!</p><p>Para ativar sua conta, clique no link abaixo:</p><p><a href="${confirmUrl}">${confirmUrl}</a></p><p>Este link expira em 1 hora.</p>`
  );
  // Log de auditoria do usuário (não como admin)
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: 'system',
        adminEmail: 'system@local',
        action: 'resend_confirmation',
        targetUserId: user.id,
        targetUserEmail: user.email,
        details: `Reenvio de confirmação solicitado pelo próprio usuário do IP ${ip}`,
      },
    });
  } catch { }
  return res.json({ success: true, message: 'E-mail de confirmação reenviado.' });
} 