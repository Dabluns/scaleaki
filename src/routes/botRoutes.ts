import { Router } from 'express';
import * as botController from '../controllers/botController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';

const router = Router();

// Todas as rotas do bot requerem admin
router.post('/start', authenticateJWT, authorizeRoles(['admin']), botController.startBot);
router.post('/stop', authenticateJWT, authorizeRoles(['admin']), botController.stopBot);
router.get('/status', authenticateJWT, authorizeRoles(['admin']), botController.getBotStatus);
router.get('/logs', authenticateJWT, authorizeRoles(['admin']), botController.getBotLogs);

export default router;
