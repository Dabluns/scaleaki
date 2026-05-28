import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { ofertasRateLimiter, heavyOperationRateLimiter } from '../middlewares/rateLimitMiddleware';
import * as fbAdsController from '../controllers/fbAdsController';

const router = Router();

// ─── IMPORTANTE: Rotas estáticas SEMPRE antes de rotas com parâmetros (/:id) ──

// ─── Listagem e busca ─────────────────────────────────────────────────────────
router.get('/', authenticateJWT, ofertasRateLimiter, fbAdsController.listAnuncios);
router.post('/search', authenticateJWT, heavyOperationRateLimiter, fbAdsController.liveSearch);

// ─── Rotas de admin (estáticas) ───────────────────────────────────────────────
router.post('/sync', authenticateJWT, authorizeRoles(['admin']), heavyOperationRateLimiter, fbAdsController.syncAds);
router.post('/sync-extension', authenticateJWT, authorizeRoles(['admin']), fbAdsController.syncExtension);
router.post('/recalc-escala', authenticateJWT, authorizeRoles(['admin']), fbAdsController.recalcEscalaAll);
router.post('/backfill-checkouts', authenticateJWT, authorizeRoles(['admin']), fbAdsController.backfillCheckouts);

// ─── Rotas dinâmicas (/:id) — devem vir POR ÚLTIMO ───────────────────────────
router.get('/:id', authenticateJWT, ofertasRateLimiter, fbAdsController.getAnuncio);
router.post('/:id/scan-funil', authenticateJWT, heavyOperationRateLimiter, fbAdsController.triggerFunnelScan);
router.patch('/:id/escala', authenticateJWT, authorizeRoles(['admin']), fbAdsController.updateEscala);
router.patch('/:id/toggle', authenticateJWT, authorizeRoles(['admin']), fbAdsController.toggleAnuncio);
router.post('/:id/enrich-page', authenticateJWT, authorizeRoles(['admin']), fbAdsController.triggerPageEnrich);

export default router;
