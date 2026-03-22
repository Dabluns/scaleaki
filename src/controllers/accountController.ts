import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';
import logger from '../config/logger';

export async function requestAccountDeletion(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    // Nesta versão, marcamos no profile bio um marcador simples (placeholder de soft delete)
    await prisma.user.update({ where: { id: req.user.userId }, data: { isActive: false } });
    return res.json({ success: true });
  } catch (error: any) {
    logger.error('requestAccountDeletion error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function cancelAccountDeletion(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    await prisma.user.update({ where: { id: req.user.userId }, data: { isActive: true } });
    return res.json({ success: true });
  } catch (error: any) {
    logger.error('cancelAccountDeletion error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

