import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import {
  getRelatorioNichos,
  getRelatorioPlataformas,
  getRelatorioTendencias,
  getRelatorioGeral
} from '../controllers/relatorioController';

const router = Router();

// Todas as rotas de relatórios requerem autenticação
router.use(authenticateJWT);

// Relatório geral - disponível para todos os usuários autenticados
router.get('/geral', getRelatorioGeral);

// Relatórios específicos - disponíveis para admin e usuários premium
router.get('/nichos', authorizeRoles(['admin', 'premium', 'enterprise']), getRelatorioNichos);
router.get('/plataformas', authorizeRoles(['admin', 'premium', 'enterprise']), getRelatorioPlataformas);
router.get('/tendencias', authorizeRoles(['admin', 'premium', 'enterprise']), getRelatorioTendencias);

export default router; 