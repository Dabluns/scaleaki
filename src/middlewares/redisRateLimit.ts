import { Request, Response, NextFunction } from 'express';
import cacheService from '../services/cacheService';
import logger from '../config/logger';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export function createRedisRateLimiter(config: RateLimitConfig) {
  // Fallback simples em memória por processo quando Redis não estiver conectado
  const localCounters = new Map<string, { count: number; resetAt: number }>();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Admins são isentos de rate limiting
      const authReq = req as any;
      if (authReq.user?.role === 'admin') {
        return next();
      }

      const key = config.keyGenerator ? config.keyGenerator(req) : req.ip || 'unknown';
      const nowSec = Math.floor(Date.now() / 1000);
      const windowSec = Math.floor(config.windowMs / 1000);

      let currentCount = 0;

      // Preferir Redis quando disponível
      const usedRedis = await cacheService.healthCheck();
      if (usedRedis) {
        const rateLimitKey = `rate_limit:${key}`;
        currentCount = await cacheService.increment(rateLimitKey, windowSec);
      } else {
        const entry = localCounters.get(key);
        if (!entry || entry.resetAt <= nowSec) {
          localCounters.set(key, { count: 1, resetAt: nowSec + windowSec });
          currentCount = 1;
        } else {
          entry.count += 1;
          currentCount = entry.count;
        }
      }

      const remaining = Math.max(0, config.max - currentCount);
      const resetTime = usedRedis ? (nowSec + windowSec) : (localCounters.get(key)?.resetAt || (nowSec + windowSec));

      res.set({
        'X-RateLimit-Limit': config.max.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString(),
      });

      if (currentCount > config.max) {
        logger.warn('Rate limit exceeded', {
          key,
          currentCount,
          max: config.max,
          windowMs: config.windowMs,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          backend: usedRedis ? 'redis' : 'memory',
        });

        return res.status(429).json({
          error: 'Too Many Requests',
          message: config.message || 'Muitas requisições. Tente novamente mais tarde.',
          retryAfter: Math.ceil(config.windowMs / 1000),
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limiting error', {
        error: error instanceof Error ? error.message : String(error),
        ip: req.ip,
      });
      next();
    }
  };
}

// Rate limiters específicos para diferentes endpoints
export const authRateLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por janela
  message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
  keyGenerator: (req) => `auth:${req.ip}`,
});

export const registerRateLimiter = createRedisRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por hora
  message: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
  keyGenerator: (req) => `register:${req.ip}`,
});

export const userRateLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por usuário
  message: 'Muitas requisições. Tente novamente em 15 minutos.',
  keyGenerator: (req) => {
    // Para usuários autenticados, usar userId; para não autenticados, usar IP
    const authReq = req as any;
    if (authReq.user?.userId) {
      return `user:${authReq.user.userId}`;
    }
    return `ip:${req.ip || 'unknown'}`;
  },
});

export const adminRateLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requisições por admin
  message: 'Muitas requisições administrativas. Tente novamente em 15 minutos.',
  keyGenerator: (req) => {
    const authReq = req as any;
    if (authReq.user?.userId) {
      return `admin:${authReq.user.userId}`;
    }
    return `ip:${req.ip || 'unknown'}`;
  },
});

export const queryRateLimiter = createRedisRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 consultas por minuto
  message: 'Muitas consultas. Tente novamente em 1 minuto.',
  keyGenerator: (req) => {
    const authReq = req as any;
    if (authReq.user?.userId) {
      return `query:${authReq.user.userId}`;
    }
    return `ip:${req.ip || 'unknown'}`;
  },
});

// Rate limiter dinâmico baseado no plano do usuário
export function createPlanBasedRateLimiter() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as any;
      if (!authReq.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Buscar plano do usuário (com cache)
      const userKey = `user:${authReq.user.userId}`;
      let userPlan = await cacheService.get(userKey);

      if (!userPlan) {
        // Buscar do banco se não estiver em cache
        const prisma = (await import('../config/database')).default;
        const user = await prisma.user.findUnique({
          where: { id: authReq.user.userId },
          select: { plan: true }
        });

        if (user) {
          userPlan = user.plan;
          // Cache por 5 minutos
          await cacheService.set(userKey, userPlan, 300);
        } else {
          userPlan = 'mensal';
        }
      }

      // Definir limites baseados no plano
      const limits = {
        mensal: { windowMs: 60 * 1000, max: 30 }, // 30/min
        trimestral: { windowMs: 60 * 1000, max: 100 }, // 100/min
        anual: { windowMs: 60 * 1000, max: 500 }, // 500/min
      };

      const limit = limits[userPlan as keyof typeof limits] || limits.mensal;

      const rateLimiter = createRedisRateLimiter({
        ...limit,
        message: `Limite do plano ${userPlan} atingido. Tente novamente em ${Math.ceil(limit.windowMs / 1000)} segundos.`,
        keyGenerator: () => `plan:${authReq.user.userId}`,
      });

      return rateLimiter(req, res, next);
    } catch (error) {
      logger.error('Plan-based rate limiting error', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.userId,
      });

      // Em caso de erro, usar limite padrão
      const defaultLimiter = createRedisRateLimiter({
        windowMs: 60 * 1000,
        max: 10,
        keyGenerator: () => `fallback:${(req as any).user?.userId || req.ip}`,
      });

      return defaultLimiter(req, res, next);
    }
  };
}

// Função para limpar rate limits antigos
export async function cleanExpiredRateLimits(): Promise<void> {
  try {
    // Esta função seria chamada periodicamente para limpar rate limits expirados
    // Como o Redis já gerencia TTL automaticamente, não precisamos fazer nada aqui
    logger.debug('Rate limit cleanup completed');
  } catch (error) {
    logger.error('Rate limit cleanup failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
} 