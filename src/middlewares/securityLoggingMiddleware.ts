import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import logger from '../config/logger';

/**
 * Middleware para logging de ações de segurança críticas
 */
export function securityLogger(action: string, sensitiveFields: string[] = []) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Capturar resposta original
    const originalSend = res.json;
    res.json = function (body: any) {
      const duration = Date.now() - startTime;
      
      // Preparar dados para log (remover campos sensíveis)
      const logData: any = {
        action,
        userId: req.user?.userId,
        role: req.user?.role,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString()
      };

      // Adicionar query params (sem campos sensíveis)
      if (Object.keys(req.query).length > 0) {
        const safeQuery: any = {};
        Object.keys(req.query).forEach(key => {
          if (!sensitiveFields.includes(key)) {
            safeQuery[key] = req.query[key];
          }
        });
        if (Object.keys(safeQuery).length > 0) {
          logData.query = safeQuery;
        }
      }

      // Log baseado no status code
      if (res.statusCode >= 400) {
        logger.warn('Ação de segurança com erro', logData);
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        logger.info('Ação de segurança executada', logData);
      }

      // Restaurar função original e chamar
      res.json = originalSend;
      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Middleware para logging de tentativas de acesso não autorizado
 */
export function unauthorizedAccessLogger(req: AuthRequest, res: Response, reason: string) {
  logger.warn('Tentativa de acesso não autorizado', {
    reason,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    role: req.user?.role,
    timestamp: new Date().toISOString()
  });
}

