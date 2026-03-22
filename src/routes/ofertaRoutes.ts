import { Router } from 'express';
import * as ofertaController from '../controllers/ofertaController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { 
  ofertasRateLimiter, 
  dashboardRateLimiter, 
  searchRateLimiter,
  heavyOperationRateLimiter 
} from '../middlewares/rateLimitMiddleware';
import { userRateLimiter } from '../middlewares/redisRateLimit';

const router = Router();

// Rotas públicas com rate limiting específico
router.get('/', ofertasRateLimiter, ofertaController.getAllOfertas);
router.get('/nicho/:nichoId', ofertasRateLimiter, ofertaController.getOfertasByNicho);

// Endpoint agregado para dashboard com rate limiting específico
router.get('/dashboard/data', dashboardRateLimiter, ofertaController.getDashboardData);

// Recomendações personalizadas (autenticado)
router.get('/recommendations', authenticateJWT, userRateLimiter, ofertaController.getRecommendations);

// Registrar visualização de oferta (autenticado)
router.post('/:ofertaId/view', authenticateJWT, userRateLimiter, ofertaController.registerOfertaView);

// Novas rotas expandidas (antes das rotas com parâmetros)
router.get('/plataforma/:plataforma', ofertasRateLimiter, ofertaController.getOfertasByPlataforma);
router.get('/tipo/:tipo', ofertasRateLimiter, ofertaController.getOfertasByTipo);
router.get('/status/:status', ofertasRateLimiter, ofertaController.getOfertasByStatus);
router.get('/metricas', searchRateLimiter, ofertaController.getOfertasComMetricas);
router.get('/destaque', ofertasRateLimiter, ofertaController.getOfertasDestaque);
router.get('/estatisticas', ofertasRateLimiter, ofertaController.getEstatisticasOfertas);
router.get('/reels', ofertasRateLimiter, ofertaController.getOfertasComVSL);

// Rota com parâmetro ID (deve ser a última)
router.get('/:id', ofertasRateLimiter, ofertaController.getOfertaById);

// Rotas protegidas (apenas admin) com rate limiting para operações pesadas
router.post('/', authenticateJWT, authorizeRoles(['admin']), heavyOperationRateLimiter, ofertaController.createOferta);
router.put('/:id', authenticateJWT, authorizeRoles(['admin']), heavyOperationRateLimiter, ofertaController.updateOferta);
router.delete('/:id', authenticateJWT, authorizeRoles(['admin']), heavyOperationRateLimiter, ofertaController.deleteOferta);
router.patch('/:id/deactivate', authenticateJWT, authorizeRoles(['admin']), heavyOperationRateLimiter, ofertaController.deactivateOferta);
router.patch('/:id/metricas', authenticateJWT, authorizeRoles(['admin']), heavyOperationRateLimiter, ofertaController.updateMetricasOferta);

export default router; 