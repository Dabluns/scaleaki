import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';
import logger from '../config/logger';
import { hasPaidAccess, resolveTier } from '../utils/access';
import { countViewsToday, DAILY_FREE_LIMIT } from '../utils/dailyViews';
import { buildAccessMap } from '../config/featureAccess';

/** Status de acesso/entitlement do usuário — consumido pelo frontend (paywall/contador/CTA). */
export async function getAccess(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Não autenticado.' });
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { subscription: true },
    });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const paid = hasPaidAccess(user as any);
    const tier = resolveTier(user as any);
    const used = paid ? 0 : await countViewsToday(req.user.userId);

    return res.json({
      tier,
      plan: user.plan,
      paid,
      dailyViewsUsed: used,
      dailyViewsLimit: paid ? null : DAILY_FREE_LIMIT,
      subscriptionEndDate: user.subscription?.endDate ?? null,
      features: buildAccessMap(tier),
    });
  } catch (error: any) {
    logger.error('[Account] Erro ao buscar acesso:', error);
    return res.status(500).json({ error: 'Erro ao buscar acesso.' });
  }
}

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

