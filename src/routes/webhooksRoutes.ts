import { Router, json, raw } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateOwnership } from '../middlewares/ownershipMiddleware';
import { sanitizeInput, validateUUID } from '../middlewares/inputSanitizationMiddleware';
import { securityLogger } from '../middlewares/securityLoggingMiddleware';
import { userRateLimiter } from '../middlewares/redisRateLimit';
import * as webhooksController from '../controllers/webhooksController';
import * as geekpayWebhookController from '../controllers/geekpayWebhookController';

const router = Router();

// Endpoint inbound público para receber eventos externos (usa raw body para verificação de assinatura)
router.post('/inbound', raw({ type: '*/*', limit: '1mb' }), webhooksController.inboundHandler);

// Webhook específico do GeekPay (pay.geekacademy.site → SCALEAKI)
// Provider-agnostic naming: se um dia trocar de gateway, o path permanece.
// IMPORTANTE: raw body middleware para validação HMAC. Não pode estar ANTES do express.json global
// porque ele já foi consumido — mas como /webhooks/* está no escopo global do app,
// usamos o rawBody capturado pelo express.json verify (em server.ts).
router.post('/scaleaki', geekpayWebhookController.handleGeekPayWebhook);

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

