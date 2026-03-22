import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthRequest } from './authMiddleware';

export const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por janela
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    if (authReq.user?.userId) return String(authReq.user.userId);
    return req.ip || 'unknown';
  },
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
}); 