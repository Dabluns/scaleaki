import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { requireFeature } from '../middlewares/requireFeature';
import { ofertasRateLimiter } from '../middlewares/rateLimitMiddleware';
import * as adspyController from '../controllers/adspyController';
import type { FeatureKey } from '../config/featureAccess';

const router = Router();

const PLATFORM_FEATURE: Record<string, FeatureKey> = {
  youtube: 'adspy_youtube',
  tiktok: 'adspy_tiktok',
};

function gateByPlatform(req: any, res: any, next: any) {
  const feature = PLATFORM_FEATURE[req.params.platform];
  if (!feature) return res.status(400).json({ error: 'invalid_platform' });
  return requireFeature(feature)(req, res, next);
}

router.get('/:platform', authenticateJWT, gateByPlatform, ofertasRateLimiter, adspyController.listAds);
router.get('/:platform/:id', authenticateJWT, gateByPlatform, ofertasRateLimiter, adspyController.getAd);

export default router;
