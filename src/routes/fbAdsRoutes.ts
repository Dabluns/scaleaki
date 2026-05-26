import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { ofertasRateLimiter, heavyOperationRateLimiter } from '../middlewares/rateLimitMiddleware';
import * as fbAdsController from '../controllers/fbAdsController';

const router = Router();

// ─── Rotas públicas (autenticadas, qualquer usuário) ──────────────────────────
router.get('/', authenticateJWT, ofertasRateLimiter, fbAdsController.listAnuncios);
router.get('/:id', authenticateJWT, ofertasRateLimiter, fbAdsController.getAnuncio);

// ─── Busca ao vivo na biblioteca do Facebook ──────────────────────────────────
router.post('/search', authenticateJWT, heavyOperationRateLimiter, fbAdsController.liveSearch);

// ─── Rotas de ação (autenticadas, qualquer usuário) ───────────────────────────
router.post('/:id/scan-funil', authenticateJWT, heavyOperationRateLimiter, fbAdsController.triggerFunnelScan);

// ─── Rotas de admin ───────────────────────────────────────────────────────────
router.post('/sync', authenticateJWT, authorizeRoles(['admin']), heavyOperationRateLimiter, fbAdsController.syncAds);
router.patch('/:id/escala', authenticateJWT, authorizeRoles(['admin']), fbAdsController.updateEscala);
router.patch('/:id/toggle', authenticateJWT, authorizeRoles(['admin']), fbAdsController.toggleAnuncio);
router.post('/:id/enrich-page', authenticateJWT, authorizeRoles(['admin']), fbAdsController.triggerPageEnrich);

export default router;
