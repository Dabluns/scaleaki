import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import prisma from '../config/database';
import logger from '../config/logger';

/**
 * Middleware para validar que o usuário só acessa seus próprios recursos
 */
export function validateOwnership(resourceType: 'user' | 'favorito' | 'settings' | 'profile' | 'apikey' | 'webhook' | 'export' | 'subscription' | 'payment') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }

      // Admin pode acessar qualquer recurso
      if (req.user?.role === 'admin') {
        return next();
      }

      // Validar propriedade baseado no tipo de recurso
      switch (resourceType) {
        case 'user': {
          const resourceId = req.params.id || req.params.userId || req.body.userId;
          if (resourceId && resourceId !== userId) {
            logger.warn('Tentativa de acesso não autorizado a recurso de usuário', {
              userId,
              resourceId,
              path: req.path,
              ip: req.ip
            });
            return res.status(403).json({ success: false, error: 'Acesso negado: você só pode acessar seus próprios dados' });
          }
          break;
        }

        case 'favorito': {
          // Favoritos já são filtrados por userId no controller, mas validamos aqui também
          const favoritoId = req.params.id || req.params.favoritoId;
          if (favoritoId) {
            const favorito = await prisma.favorito.findUnique({
              where: { id: favoritoId },
              select: { userId: true }
            });
            if (!favorito || favorito.userId !== userId) {
              logger.warn('Tentativa de acesso não autorizado a favorito', {
                userId,
                favoritoId,
                ip: req.ip
              });
              return res.status(403).json({ success: false, error: 'Acesso negado' });
            }
          }
          break;
        }

        case 'settings':
        case 'profile': {
          // Settings e Profile são sempre do usuário autenticado
          // Não precisam validação adicional pois já são filtrados por userId
          break;
        }

        case 'apikey': {
          const keyId = req.params.id || req.params.keyId;
          if (keyId) {
            const apiKey = await prisma.apiKey.findUnique({
              where: { id: keyId },
              select: { userId: true }
            });
            if (!apiKey || apiKey.userId !== userId) {
              logger.warn('Tentativa de acesso não autorizado a API key', {
                userId,
                keyId,
                ip: req.ip
              });
              return res.status(403).json({ success: false, error: 'Acesso negado' });
            }
          }
          break;
        }

        case 'webhook': {
          const webhookId = req.params.id || req.params.webhookId;
          if (webhookId) {
            const webhook = await prisma.webhook.findUnique({
              where: { id: webhookId },
              select: { userId: true }
            });
            if (!webhook || webhook.userId !== userId) {
              logger.warn('Tentativa de acesso não autorizado a webhook', {
                userId,
                webhookId,
                ip: req.ip
              });
              return res.status(403).json({ success: false, error: 'Acesso negado' });
            }
          }
          break;
        }

        case 'export': {
          // Validação de propriedade para export é feita no controller
          // verificando que userId corresponde ao usuário autenticado
          // Não há modelo específico no Prisma, então apenas validamos
          // que o usuário está autenticado (já validado acima)
          break;
        }

        case 'subscription':
        case 'payment': {
          // Subscriptions e Payments são sempre do usuário autenticado
          // Validamos que o userId no body/params corresponde ao usuário autenticado
          const resourceUserId = req.body.userId || req.params.userId;
          if (resourceUserId && resourceUserId !== userId) {
            logger.warn('Tentativa de acesso não autorizado a recurso de pagamento', {
              userId,
              resourceUserId,
              ip: req.ip
            });
            return res.status(403).json({ success: false, error: 'Acesso negado' });
          }
          break;
        }
      }

      next();
    } catch (error) {
      logger.error('Erro ao validar propriedade de recurso', {
        error: error instanceof Error ? error.message : String(error),
        resourceType,
        path: req.path
      });
      return res.status(500).json({ success: false, error: 'Erro ao validar acesso' });
    }
  };
}

