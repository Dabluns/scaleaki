import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';
import { AuthRequest } from '../middlewares/authMiddleware';
import { queueNotificationEmail } from '../services/emailQueue';

export async function subscribePush(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { subscription } = req.body || {};
    if (!subscription) return res.status(400).json({ success: false, error: 'Subscription é obrigatória' });

    const updated = await prisma.userSettings.upsert({
      where: { userId: req.user.userId },
      update: { pushEnabled: true, pushSubscription: JSON.stringify(subscription) },
      create: { userId: req.user.userId, pushEnabled: true, pushSubscription: JSON.stringify(subscription) },
    });

    return res.json({ success: true, data: { pushEnabled: updated.pushEnabled } });
  } catch (error: any) {
    logger.error('subscribePush error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function unsubscribePush(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });

    const updated = await prisma.userSettings.upsert({
      where: { userId: req.user.userId },
      update: { pushEnabled: false, pushSubscription: null },
      create: { userId: req.user.userId, pushEnabled: false, pushSubscription: null },
    });

    return res.json({ success: true, data: { pushEnabled: updated.pushEnabled } });
  } catch (error: any) {
    logger.error('unsubscribePush error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function sendTestNotification(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });

    await queueNotificationEmail(user.email, 'Notificação de teste', 'Esta é uma notificação de teste.');

    return res.json({ success: true, message: 'Notificação de teste enviada (email).' });
  } catch (error: any) {
    logger.error('sendTestNotification error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
