import express from 'express';
import * as adminController from '../controllers/adminController';
import { validateUpdateUser } from '../middlewares/adminValidationMiddleware';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { validateAdminAccess, logAdminAction } from '../middlewares/adminSecurityMiddleware';
import { securityLogger } from '../middlewares/securityLoggingMiddleware';
import { sanitizeInput, validateUUID } from '../middlewares/inputSanitizationMiddleware';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting rigoroso para rotas admin
const ADMIN_RATE_LIMIT_WINDOW_MINUTES = Number(process.env.ADMIN_RATE_LIMIT_WINDOW_MINUTES || 15);
const ADMIN_RATE_LIMIT_MAX = Number(process.env.ADMIN_RATE_LIMIT_MAX || 20);

const adminRateLimiter = rateLimit({
  windowMs: ADMIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: ADMIN_RATE_LIMIT_MAX,
  message: { error: `Muitas requisições administrativas. Tente novamente em ${ADMIN_RATE_LIMIT_WINDOW_MINUTES} minutos.` },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Não aplicar rate limit em health checks
    return req.path === '/health';
  }
});

// Middleware de autenticação e autorização para todas as rotas admin
router.use(authenticateJWT);
router.use(validateAdminAccess);
router.use(authorizeRoles(['admin']));
router.use(adminRateLimiter);
router.use(sanitizeInput);
router.use(securityLogger('admin_action'));

// Usuários (admin gerencia usuários)
router.get('/users', logAdminAction('list_users'), adminController.getUsers);
router.put('/users/:id', validateUUID('id'), validateUpdateUser, logAdminAction('update_user'), adminController.updateUser);
router.delete('/users/:id', validateUUID('id'), logAdminAction('delete_user'), adminController.deleteUser);

// Admins
router.post('/admins', logAdminAction('create_admin'), adminController.createAdmin);

// Storage Cleanup
import * as cleanupController from '../controllers/cleanupController';
router.post('/cleanup', logAdminAction('cleanup_storage'), cleanupController.runCleanup);

export default router; 