import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';
import logger from '../config/logger';

export async function enable2FA(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    let speakeasy: any;
    let qrcode: any;
    try {
      // Carregar dinamicamente dependências opcionais
      speakeasy = require('speakeasy');
      qrcode = require('qrcode');
    } catch {
      return res.status(501).json({ success: false, error: '2FA não disponível: dependências ausentes.' });
    }
    const secret = speakeasy.generateSecret({ length: 20, name: 'Scaleaki (2FA)' });
    const otpauth = secret.otpauth_url || '';
    const qr = await qrcode.toDataURL(otpauth);

    await prisma.userProfile.upsert({
      where: { userId: req.user.userId },
      update: { twoFactorEnabled: false, twoFactorSecret: secret.base32 },
      create: { userId: req.user.userId, twoFactorEnabled: false, twoFactorSecret: secret.base32 },
    });

    return res.json({ success: true, data: { otpauth, qr } });
  } catch (error: any) {
    logger.error('enable2FA error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function verify2FA(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ success: false, error: 'Token é obrigatório' });

    const profile = await prisma.userProfile.findUnique({ where: { userId: req.user.userId } });
    if (!profile?.twoFactorSecret) return res.status(400).json({ success: false, error: '2FA não iniciado' });

    let speakeasy: any;
    try {
      speakeasy = require('speakeasy');
    } catch {
      return res.status(501).json({ success: false, error: '2FA não disponível: dependências ausentes.' });
    }
    const ok = speakeasy.totp.verify({ secret: profile.twoFactorSecret, encoding: 'base32', token, window: 1 });
    if (!ok) return res.status(400).json({ success: false, error: 'Token inválido' });

    await prisma.userProfile.update({ where: { userId: req.user.userId }, data: { twoFactorEnabled: true } });
    return res.json({ success: true });
  } catch (error: any) {
    logger.error('verify2FA error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function disable2FA(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    await prisma.userProfile.update({ where: { userId: req.user.userId }, data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: null } });
    return res.json({ success: true });
  } catch (error: any) {
    logger.error('disable2FA error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function generateBackupCodes(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const codes = Array.from({ length: 10 }).map(() => Math.random().toString(36).slice(2, 10));
    await prisma.userProfile.update({ where: { userId: req.user.userId }, data: { twoFactorBackupCodes: JSON.stringify(codes) } });
    return res.json({ success: true, data: { codes } });
  } catch (error: any) {
    logger.error('generateBackupCodes error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getSessions(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const client: any = prisma as any;
    if (!client.userSession) {
      return res.json({ success: true, data: [] });
    }
    const sessions = await client.userSession.findMany({ where: { userId: req.user.userId }, orderBy: { lastActive: 'desc' } });
    return res.json({ success: true, data: sessions });
  } catch (error: any) {
    logger.error('getSessions error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function revokeSession(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { id } = req.params;
    const client: any = prisma as any;
    if (!client.userSession) return res.json({ success: true });
    await client.userSession.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    logger.error('revokeSession error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function revokeAllOtherSessions(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const currentSessionId = (req as any).sessionId as string | undefined;
    const client: any = prisma as any;
    if (!client.userSession) return res.json({ success: true });
    await client.userSession.deleteMany({ where: { userId: req.user.userId, ...(currentSessionId && { NOT: { id: currentSessionId } }) } as any });
    return res.json({ success: true });
  } catch (error: any) {
    logger.error('revokeAllOtherSessions error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getSecurityLog(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const client: any = prisma as any;
    if (!client.securityLog) return res.json({ success: true, data: [] });
    const logs = await client.securityLog.findMany({ where: { userId: req.user.userId }, orderBy: { createdAt: 'desc' }, take: 50 });
    return res.json({ success: true, data: logs });
  } catch (error: any) {
    logger.error('getSecurityLog error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

