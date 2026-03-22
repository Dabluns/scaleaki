import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateOwnership } from '../middlewares/ownershipMiddleware';
import { sanitizeInput, validateUUID } from '../middlewares/inputSanitizationMiddleware';
import { securityLogger } from '../middlewares/securityLoggingMiddleware';
import { userRateLimiter } from '../middlewares/redisRateLimit';
import * as keysController from '../controllers/keysController';

const router = Router();

router.use(authenticateJWT);
router.use(validateOwnership('apikey'));
router.use(sanitizeInput);
router.use(userRateLimiter);

router.get('/', keysController.listKeys);
router.post('/', securityLogger('apikey_create'), keysController.createKey);
router.put('/:id', validateUUID('id'), securityLogger('apikey_update'), keysController.updateKeyName);
router.delete('/:id', validateUUID('id'), securityLogger('apikey_revoke'), keysController.revokeKey);
router.get('/:id/usage', validateUUID('id'), keysController.getKeyUsage);

export default router;

