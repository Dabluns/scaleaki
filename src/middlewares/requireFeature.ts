import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { hasPaidAccess } from '../utils/access';
import { FeatureKey, resolveFeatureAccess } from '../config/featureAccess';

/**
 * Gateia rota por feature do Freemium.
 * - Free sem acesso à feature → 403 feature_locked + texto de upsell.
 * - Free com acesso limitado → segue, e injeta req.featureLimit pro controller paginar/cortar.
 * - Pago/admin → segue sem limite.
 */
export function requireFeature(feature: FeatureKey) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const auth = (req as any).user;
    if (!auth?.userId) return res.status(401).json({ error: 'unauthenticated' });

    if (auth.role === 'admin') {
      (req as any).featureLimit = null;
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: { subscription: true },
    });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const paid = hasPaidAccess(user as any);
    const access = resolveFeatureAccess(feature, paid);

    if (!access.allowed) {
      return res.status(403).json({ error: 'feature_locked', feature, message: access.upsell });
    }

    (req as any).featureLimit = access.limit; // null = ilimitado
    next();
  };
}
