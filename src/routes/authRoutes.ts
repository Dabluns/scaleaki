import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRegister, validateLogin } from '../middlewares/validationMiddleware';
import { 
  authRateLimiter, 
  registerRateLimiter, 
  userRateLimiter 
} from '../middlewares/redisRateLimit';

const router = Router();

// Registro e login com rate limiting específico usando Redis
router.post('/register', registerRateLimiter, validateRegister, authController.register);
router.post('/login', authRateLimiter, validateLogin, authController.login);
router.get('/confirm', authController.confirmEmail);
router.post('/resend-confirmation', authRateLimiter, authController.resendConfirmation);

// Refresh token com rate limiting para operações autenticadas
router.post('/refresh', userRateLimiter, authController.refresh);

// Logout e dados do usuário logado (precisa estar autenticado)
router.post('/logout', authenticateJWT, userRateLimiter, authController.logout);
router.get('/me', authenticateJWT, userRateLimiter, authController.me);

// Endpoint para obter token CSRF (após autenticação)
router.get('/csrf-token', authenticateJWT, userRateLimiter, (req: any, res: any) => {
  const { generateCSRFToken } = require('../middlewares/csrfMiddleware');
  try {
    const token = generateCSRFToken(req);
    res.json({ success: true, csrfToken: token });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router; 