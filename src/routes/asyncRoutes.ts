import { Router } from 'express';
import * as asyncController from '../controllers/asyncController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { heavyOperationRateLimiter } from '../middlewares/rateLimitMiddleware';

const router = Router();

// Rotas protegidas (apenas usuários autenticados)
router.use(authenticateJWT);

// Rotas para tarefas assíncronas
router.post('/tasks', heavyOperationRateLimiter, asyncController.addAsyncTask);
router.get('/tasks/:taskId', asyncController.getTaskStatus);
router.get('/stats', asyncController.getProcessorStats);

// Rotas específicas para operações assíncronas
router.post('/reports', heavyOperationRateLimiter, asyncController.generateReport);
router.post('/export', heavyOperationRateLimiter, asyncController.exportData);

export default router; 