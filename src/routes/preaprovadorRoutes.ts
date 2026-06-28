import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { requireFeature } from '../middlewares/requireFeature';
import { heavyOperationRateLimiter } from '../middlewares/rateLimitMiddleware';
import * as preaprovadorController from '../controllers/preaprovadorController';

const router = Router();

router.post(
  '/pre-aprovar',
  authenticateJWT,
  requireFeature('criativo_preaprovador'),
  heavyOperationRateLimiter,
  preaprovadorController.preAprovarCriativo
);

router.post(
  '/reescrever',
  authenticateJWT,
  requireFeature('criativo_preaprovador'),
  heavyOperationRateLimiter,
  preaprovadorController.reescreverCriativo
);

export default router;
