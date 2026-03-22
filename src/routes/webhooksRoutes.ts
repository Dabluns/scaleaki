import { Router, json, raw } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateOwnership } from '../middlewares/ownershipMiddleware';
import { sanitizeInput, validateUUID } from '../middlewares/inputSanitizationMiddleware';
import { securityLogger } from '../middlewares/securityLoggingMiddleware';
import { userRateLimiter } from '../middlewares/redisRateLimit';
import * as webhooksController from '../controllers/webhooksController';

const router = Router();

// Endpoint inbound público para receber eventos externos (usa raw body para verificação de assinatura)
router.post('/inbound', raw({ type: '*/*', limit: '1mb' }), webhooksController.inboundHandler);

router.use(authenticateJWT);
router.use(validateOwnership('webhook'));
router.use(sanitizeInput);
router.use(userRateLimiter);

router.get('/', webhooksController.listWebhooks);
router.post('/', securityLogger('webhook_create'), webhooksController.createWebhook);
router.put('/:id', validateUUID('id'), securityLogger('webhook_update'), webhooksController.updateWebhook);
router.delete('/:id', validateUUID('id'), securityLogger('webhook_delete'), webhooksController.deleteWebhook);
router.post('/:id/test', validateUUID('id'), securityLogger('webhook_test'), webhooksController.testWebhook);
router.get('/:id/logs', validateUUID('id'), webhooksController.getWebhookLogs);

export default router;

