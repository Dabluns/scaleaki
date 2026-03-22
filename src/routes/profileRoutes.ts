import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { userRateLimiter } from '../middlewares/redisRateLimit';
import { validateOwnership } from '../middlewares/ownershipMiddleware';
import { sanitizeInput } from '../middlewares/inputSanitizationMiddleware';
import { securityLogger } from '../middlewares/securityLoggingMiddleware';
import * as profileController from '../controllers/profileController';

const router = Router();

router.use(authenticateJWT);
router.use(validateOwnership('profile'));
router.use(sanitizeInput);
router.use(userRateLimiter);

router.get('/', profileController.getProfile);
router.put('/', securityLogger('profile_update', ['password', 'email']), profileController.updateProfile);
router.get('/activity-stats', profileController.getUserActivityStats);

export default router;


