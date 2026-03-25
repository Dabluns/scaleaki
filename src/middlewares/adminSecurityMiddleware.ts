import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import logger from '../config/logger';
import prisma from '../config/database';

/**
 * Rate limiting mais rigoroso para ações administrativas
 */
export const adminActionRateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 ações admin por 15 minutos
  message: 'Muitas ações administrativas. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * Middleware para validar que o admin está ativo e autorizado
 */
export async function validateAdminAccess(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Acesso negado: requer permissões de administrador' });
    }

    // Verificar se o admin/moderator ainda está ativo no banco
    const admin = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isActive: true, role: true, emailConfirmed: true }
    });

    if (!admin) {
      logger.warn('Tentativa de acesso admin com usuário inexistente', {
        userId: req.user.userId,
        ip: req.ip
      });
      return res.status(401).json({ success: false, error: 'Usuário não encontrado' });
    }

    if (!admin.isActive) {
      logger.warn('Tentativa de acesso admin com conta inativa', {
        userId: req.user.userId,
        ip: req.ip
      });
      return res.status(403).json({ success: false, error: 'Conta inativa' });
    }

    if (!['admin', 'moderator'].includes(admin.role)) {
      logger.warn('Tentativa de acesso admin sem permissão', {
        userId: req.user.userId,
        role: admin.role,
        ip: req.ip
      });
      return res.status(403).json({ success: false, error: 'Acesso negado: requer permissões de administrador' });
    }

    if (!admin.emailConfirmed) {
      logger.warn('Tentativa de acesso admin com email não confirmado', {
        userId: req.user.userId,
        ip: req.ip
      });
      return res.status(403).json({ success: false, error: 'Email não confirmado' });
    }

    // Log de ação administrativa
    logger.info('Ação administrativa executada', {
      userId: req.user.userId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    logger.error('Erro ao validar acesso admin', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });
    return res.status(500).json({ success: false, error: 'Erro ao validar acesso' });
  }
}

/**
 * Middleware para logging de todas as ações administrativas críticas
 */
export function logAdminAction(action: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    const originalSend = res.json;
    res.json = function (body: any) {
      const duration = Date.now() - startTime;

      logger.info('Ação administrativa crítica', {
        action,
        userId: req.user?.userId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString()
      });

      res.json = originalSend;
      return originalSend.call(this, body);
    };

    next();
  };
}

