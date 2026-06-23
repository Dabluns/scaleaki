import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { requirePaid } from '../middlewares/requirePaid';
import { ofertasRateLimiter } from '../middlewares/rateLimitMiddleware';
import * as placaController from '../controllers/placaController';

const router = Router();

// Membro pago
router.post('/', authenticateJWT, requirePaid, placaController.requestPlaca);
router.get('/me', authenticateJWT, requirePaid, ofertasRateLimiter, placaController.myPlacas);

// Admin
router.get('/', authenticateJWT, authorizeRoles(['admin']), placaController.listPlacas);
router.patch('/:id', authenticateJWT, authorizeRoles(['admin']), placaController.updatePlaca);

export default router;
