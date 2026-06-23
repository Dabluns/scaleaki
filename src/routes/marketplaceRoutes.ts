import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { requireFeature } from '../middlewares/requireFeature';
import { ofertasRateLimiter } from '../middlewares/rateLimitMiddleware';
import * as marketplaceController from '../controllers/marketplaceController';
import type { FeatureKey } from '../config/featureAccess';

const router = Router();

/**
 * Rotas dos 5 marketplaces. Cada origem mapeia 1:1 numa FeatureKey, então
 * resolvemos o middleware de feature a partir de req.params.source.
 */
const SOURCE_FEATURE: Record<string, FeatureKey> = {
  dropshipping: 'marketplace_dropshipping',
  mercadolivre: 'marketplace_mercadolivre',
  aliexpress: 'marketplace_aliexpress',
  shopee: 'marketplace_shopee',
  shein: 'marketplace_shein',
};

/** Aplica requireFeature dinamicamente conforme a origem da URL. */
function gateBySource(req: any, res: any, next: any) {
  const feature = SOURCE_FEATURE[req.params.source];
  if (!feature) return res.status(400).json({ error: 'invalid_source' });
  return requireFeature(feature)(req, res, next);
}

router.get('/:source', authenticateJWT, gateBySource, ofertasRateLimiter, marketplaceController.listProducts);
router.get('/:source/meta/categories', authenticateJWT, gateBySource, ofertasRateLimiter, marketplaceController.listCategories);
router.get('/:source/:id', authenticateJWT, gateBySource, ofertasRateLimiter, marketplaceController.getProduct);

export default router;
