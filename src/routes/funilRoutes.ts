import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { requireFeature } from '../middlewares/requireFeature';
import { heavyOperationRateLimiter, ofertasRateLimiter } from '../middlewares/rateLimitMiddleware';
import * as funilController from '../controllers/funilController';

const router = Router();

// Estáticas antes das dinâmicas
router.post('/', authenticateJWT, requireFeature('trafego_funil'), heavyOperationRateLimiter, funilController.extractFunnel);
router.get('/', authenticateJWT, requireFeature('trafego_funil'), ofertasRateLimiter, funilController.listFunnels);
router.get('/:id', authenticateJWT, requireFeature('trafego_funil'), ofertasRateLimiter, funilController.getFunnel);

export default router;
