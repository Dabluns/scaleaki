import { Router } from 'express';
import * as favoritoController from '../controllers/favoritoController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateOwnership } from '../middlewares/ownershipMiddleware';
import { sanitizeInput, validateUUID } from '../middlewares/inputSanitizationMiddleware';
import { userRateLimiter } from '../middlewares/redisRateLimit';

const router = Router();

// Todas as rotas de favoritos requerem autenticação
router.use(authenticateJWT);
router.use(validateOwnership('favorito'));
router.use(sanitizeInput);
router.use(userRateLimiter);

// Adicionar oferta aos favoritos
router.post('/', favoritoController.addFavorito);

// Remover oferta dos favoritos
router.delete('/:ofertaId', validateUUID('ofertaId'), favoritoController.removeFavorito);

// Listar favoritos do usuário
router.get('/', favoritoController.getFavoritos);

// Verificar se oferta é favorita
router.get('/check/:ofertaId', validateUUID('ofertaId'), favoritoController.checkFavorito);

// Contar favoritos do usuário
router.get('/count', favoritoController.countFavoritos);

export default router; 