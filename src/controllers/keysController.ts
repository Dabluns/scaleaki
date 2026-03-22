import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';
import crypto from 'crypto';
import logger from '../config/logger';

function hashKey(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function listKeys(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const keys = await prisma.apiKey.findMany({ where: { userId: req.user.userId } });
    return res.json({ success: true, data: keys });
  } catch (error: any) {
    logger.error('listKeys error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createKey(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { name } = req.body || {};
    const raw = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = raw.slice(0, 16);
    const keyHash = hashKey(raw);
    const k = await prisma.apiKey.create({ data: { userId: req.user.userId, name: name || 'Minha chave', key: keyHash, keyPrefix } });
    return res.json({ success: true, data: { id: k.id, name: k.name, key: raw, keyPrefix: k.keyPrefix } });
  } catch (error: any) {
    logger.error('createKey error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateKeyName(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { id } = req.params;
    const { name } = req.body || {};
    const k = await prisma.apiKey.update({ where: { id }, data: { name } });
    return res.json({ success: true, data: k });
  } catch (error: any) {
    logger.error('updateKeyName error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function revokeKey(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { id } = req.params;
    await prisma.apiKey.update({ where: { id }, data: { isActive: false } });
    return res.json({ success: true });
  } catch (error: any) {
    logger.error('revokeKey error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getKeyUsage(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { id } = req.params;
    // Placeholder: sem coleta real de métricas ainda
    return res.json({ success: true, data: { id, usageCount: 0, lastUsed: null } });
  } catch (error: any) {
    logger.error('getKeyUsage error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

