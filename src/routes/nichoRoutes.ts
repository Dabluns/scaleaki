import { Router } from 'express';
import * as nichoController from '../controllers/nichoController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';

const router = Router();

// Rotas públicas
router.get('/', nichoController.getAllNichos);
router.get('/populares', nichoController.getNichosPopulares);
router.get('/:id', nichoController.getNichoById);
router.get('/slug/:slug', nichoController.getNichoBySlug);

// Rotas protegidas (apenas admin)
router.post('/', authenticateJWT, authorizeRoles(['admin']), nichoController.createNicho);
router.put('/:id', authenticateJWT, authorizeRoles(['admin']), nichoController.updateNicho);
router.delete('/:id', authenticateJWT, authorizeRoles(['admin']), nichoController.deleteNicho);
router.patch('/:id/deactivate', authenticateJWT, authorizeRoles(['admin']), nichoController.deactivateNicho);

export default router; 