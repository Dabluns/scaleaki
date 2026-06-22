import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { resolveTier } from '../utils/access';
import { FeatureKey, resolveFeatureAccess } from '../config/featureAccess';

const UPGRADE_URL = process.env.SCALEAKI_PLUS_UPGRADE_URL || '/upgrade';

/**
 * Gateia rota por feature/tier.
 * - Abaixo do tier mínimo e sem amostra → 403 feature_locked + requiredTier + upgradeUrl.
 * - Com amostra → segue, injeta req.featureLimit pro controller cortar.
 * - Tier suficiente/admin → segue sem limite.
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

    const tier = resolveTier(user as any);
    const access = resolveFeatureAccess(feature, tier);

    if (!access.allowed) {
      return res.status(403).json({
        error: 'feature_locked',
        feature,
        requiredTier: access.requiredTier,
        upgradeUrl: UPGRADE_URL,
        message: access.upsell,
      });
    }

    (req as any).featureLimit = access.limit; // null = ilimitado
    (req as any).userTier = tier;
    next();
  };
}
