import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthRequest } from './authMiddleware';
import logger from '../config/logger';

// Mapa em memória para bloqueio temporário por usuário
const userLoginAttempts = new Map<string, { count: number, blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_MINUTES = 15;

// Função para limpar cache de tentativas (útil para desenvolvimento)
export const clearLoginAttempts = () => {
  userLoginAttempts.clear();
  console.log('Cache de tentativas de login limpo');
};

// Rate limiting mais restritivo para login - prevenção de força bruta
export const loginRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Em desenvolvimento, desabilitar rate limiting para facilitar testes
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const email = req.body?.email || 'unknown';
  const now = Date.now();
  const userKey = email.toLowerCase();
  const entry = userLoginAttempts.get(userKey);

  if (entry && entry.blockedUntil > now) {
    logger.warn('Usuário temporariamente bloqueado por múltiplas tentativas de login', { email, ip: req.ip });
    return res.status(429).json({
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      retryAfter: '15 minutes'
    });
  }

  // Chamar o rate limiter original
  originalLoginRateLimiter(req, res, (err) => {
    if (err) return; // Já respondeu com 429
    // Se login falhar, incrementar contador
    res.on('finish', () => {
      if (res.statusCode === 401) {
        const now = Date.now();
        const entry = userLoginAttempts.get(userKey) || { count: 0, blockedUntil: 0 };
        entry.count += 1;
        if (entry.count >= MAX_ATTEMPTS) {
          entry.blockedUntil = now + BLOCK_MINUTES * 60 * 1000;
          logger.error('Bloqueio temporário ativado para usuário após múltiplas tentativas de login', { email, ip: req.ip });
        }
        userLoginAttempts.set(userKey, entry);
      } else if (res.statusCode === 200) {
        // Resetar contador em caso de sucesso
        userLoginAttempts.delete(userKey);
      }
    });
    next();
  });
};

// Guardar o rate limiter original para uso interno
const originalLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas de login por IP em 15 minutos
  keyGenerator: (req: Request) => {
    // Combinar IP + email para rate limiting mais específico
    const email = req.body?.email || 'unknown';
    return `${req.ip}:${email}`;
  },
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Rate limiting para registro - menos restritivo que login
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Apenas 3 registros por IP por hora
  keyGenerator: (req: Request) => req.ip || 'unknown',
  message: {
    error: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting padrão para outras operações autenticadas
export const authOperationsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 operações por usuário/IP em 15 minutos
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    return authReq.user?.userId ? String(authReq.user.userId) : req.ip || 'unknown';
  },
  message: {
    error: 'Muitas operações. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
}); 