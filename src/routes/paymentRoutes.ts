import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import * as caktoWebhookController from '../controllers/caktoWebhookController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateOwnership } from '../middlewares/ownershipMiddleware';
import { sanitizeInput, validateUUID } from '../middlewares/inputSanitizationMiddleware';
import { securityLogger } from '../middlewares/securityLoggingMiddleware';
import { userRateLimiter } from '../middlewares/redisRateLimit';

const router = Router();

// Rota pública para webhook da Cakto (não requer autenticação, mas valida assinatura)
router.post('/webhook/cakto', caktoWebhookController.handleWebhook);

// Todas as outras rotas requerem autenticação
router.use(authenticateJWT);
router.use(validateOwnership('payment'));
router.use(sanitizeInput);
router.use(userRateLimiter);

// Rotas de assinatura
router.post('/subscription', securityLogger('subscription_create', ['paymentMethod', 'cardNumber']), paymentController.createSubscription);
router.get('/subscription', paymentController.getSubscription);
router.delete('/subscription', securityLogger('subscription_cancel'), paymentController.cancelSubscription);
router.get('/health', paymentController.getBillingHealth);

// Rotas de pagamento
router.post('/payment', securityLogger('payment_create', ['paymentMethod', 'cardNumber']), paymentController.createPayment);
router.get('/payments', paymentController.getPayments);
router.get('/payment/:paymentId', validateUUID('paymentId'), paymentController.getPayment);

export default router;

