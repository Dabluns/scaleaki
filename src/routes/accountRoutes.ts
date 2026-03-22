import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateOwnership } from '../middlewares/ownershipMiddleware';
import { sanitizeInput } from '../middlewares/inputSanitizationMiddleware';
import { securityLogger } from '../middlewares/securityLoggingMiddleware';
import { userRateLimiter } from '../middlewares/redisRateLimit';
import * as accountController from '../controllers/accountController';

const router = Router();

router.use(authenticateJWT);
router.use(validateOwnership('user'));
router.use(sanitizeInput);
router.use(userRateLimiter);

router.post('/delete', securityLogger('account_deletion_request'), accountController.requestAccountDeletion);
router.post('/delete/cancel', securityLogger('account_deletion_cancel'), accountController.cancelAccountDeletion);

export default router;

