import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { AuthRequest } from './authMiddleware';

// Rate limiting configurável por endpoint — Admins são isentos
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: any;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || 'Muitas requisições. Tente novamente em alguns minutos.',
    keyGenerator: options.keyGenerator || ((req: Request) => {
      const authReq = req as AuthRequest;
      if (authReq.user?.userId) return String(authReq.user.userId);
      return req.ip || 'unknown';
    }),
    skip: (req: Request) => {
      // Admins são isentos de rate limiting
      const authReq = req as AuthRequest;
      return authReq.user?.role === 'admin';
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limiters específicos por endpoint
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login por 15 minutos
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: '15 minutes'
  }
});

export const dashboardRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 requisições por minuto para dashboard
  message: {
    error: 'Muitas requisições do dashboard. Tente novamente em 1 minuto.',
    retryAfter: '1 minute'
  }
});

export const ofertasRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 50, // 50 requisições por minuto para ofertas
  message: {
    error: 'Muitas requisições de ofertas. Tente novamente em 1 minuto.',
    retryAfter: '1 minute'
  }
});

export const adminRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto para admin
  message: {
    error: 'Muitas requisições administrativas. Tente novamente em 1 minuto.',
    retryAfter: '1 minute'
  }
});

export const publicRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // 20 requisições por minuto para endpoints públicos
  message: {
    error: 'Muitas requisições públicas. Tente novamente em 1 minuto.',
    retryAfter: '1 minute'
  }
});

// Rate limiter para uploads e operações pesadas
export const heavyOperationRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // 10 operações pesadas por 5 minutos
  message: {
    error: 'Muitas operações pesadas. Tente novamente em 5 minutos.',
    retryAfter: '5 minutes'
  }
});

// Rate limiter para buscas
export const searchRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 25, // 25 buscas por minuto
  message: {
    error: 'Muitas buscas. Tente novamente em 1 minuto.',
    retryAfter: '1 minute'
  }
}); 