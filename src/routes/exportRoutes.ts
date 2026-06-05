import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateOwnership } from '../middlewares/ownershipMiddleware';
import { sanitizeInput, validateUUID } from '../middlewares/inputSanitizationMiddleware';
import { securityLogger } from '../middlewares/securityLoggingMiddleware';
import { userRateLimiter } from '../middlewares/redisRateLimit';
import { requirePaid } from '../middlewares/requirePaid';
import * as exportController from '../controllers/exportController';

const router = Router();

router.use(authenticateJWT);
router.use(validateOwnership('export'));
router.use(sanitizeInput);
router.use(userRateLimiter);

router.post('/data', requirePaid, securityLogger('data_export_request'), exportController.requestExport);
router.get('/requests', exportController.listRequests);
router.get('/requests/:id', validateUUID('id'), exportController.getRequest);
router.get('/download/:id', requirePaid, validateUUID('id'), securityLogger('data_export_download'), exportController.downloadFile);

export default router;

