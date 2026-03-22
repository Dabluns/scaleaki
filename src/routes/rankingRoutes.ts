import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import {
  getRankingOfertas,
  getRankingNichos,
  getRankingPlataformas
} from '../controllers/rankingController';

const router = Router();

// Todas as rotas de ranking requerem autenticação
router.use(authenticateJWT);

// Ranking de ofertas - disponível para todos os usuários autenticados
router.get('/ofertas', getRankingOfertas);

// Ranking de nichos - disponível para admin e usuários premium
router.get('/nichos', authorizeRoles(['admin', 'premium', 'enterprise']), getRankingNichos);

// Ranking de plataformas - disponível para admin e usuários premium
router.get('/plataformas', authorizeRoles(['admin', 'premium', 'enterprise']), getRankingPlataformas);

export default router; 