import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { requirePaid } from '../middlewares/requirePaid';
import { ofertasRateLimiter } from '../middlewares/rateLimitMiddleware';
import * as scaleflixController from '../controllers/scaleflixController';

const router = Router();

// Leitura: membros pagos
router.get('/', authenticateJWT, requirePaid, ofertasRateLimiter, scaleflixController.listVideos);

// Escrita: admin (estáticas antes da dinâmica de leitura por id)
router.post('/', authenticateJWT, authorizeRoles(['admin']), scaleflixController.createVideo);

router.get('/:id', authenticateJWT, requirePaid, ofertasRateLimiter, scaleflixController.getVideo);
router.patch('/:id', authenticateJWT, authorizeRoles(['admin']), scaleflixController.updateVideo);
router.delete('/:id', authenticateJWT, authorizeRoles(['admin']), scaleflixController.deleteVideo);

export default router;
