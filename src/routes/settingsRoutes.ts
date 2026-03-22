import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { userRateLimiter } from '../middlewares/redisRateLimit';
import { validateOwnership } from '../middlewares/ownershipMiddleware';
import { sanitizeInput } from '../middlewares/inputSanitizationMiddleware';
import * as settingsController from '../controllers/settingsController';

const router = Router();

router.use(authenticateJWT);
router.use(validateOwnership('settings'));
router.use(sanitizeInput);
router.use(userRateLimiter);

// Buscar todas as configurações do usuário autenticado
router.get('/', settingsController.getSettings);

// Atualizar todas as configurações do usuário autenticado
router.put('/', settingsController.updateSettings);

export default router;


