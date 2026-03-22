import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import crypto from 'crypto';
import logger from '../config/logger';

// Armazenar tokens CSRF em memória (em produção, use Redis)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

// Limpar tokens expirados a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expiresAt < now) {
      csrfTokens.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Gera um token CSRF para o usuário
 */
export function generateCSRFToken(req: AuthRequest): string {
  if (!req.user) {
    throw new Error('Usuário não autenticado');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hora

  csrfTokens.set(req.user.userId, { token, expiresAt });

  return token;
}

/**
 * Valida token CSRF
 */
export function validateCSRF(req: AuthRequest, res: Response, next: NextFunction) {
  // Apenas validar em métodos que modificam dados
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Rotas públicas não precisam de CSRF
  if (req.path.startsWith('/auth/') || req.path.startsWith('/payments/webhook/')) {
    return next();
  }

  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Não autenticado' });
  }

  const token = req.headers['x-csrf-token'] as string;
  const stored = csrfTokens.get(req.user.userId);

  if (!token || !stored) {
    logger.warn('Tentativa de requisição sem token CSRF', {
      userId: req.user.userId,
      path: req.path,
      ip: req.ip
    });
    return res.status(403).json({ success: false, error: 'Token CSRF não fornecido ou inválido' });
  }

  if (stored.expiresAt < Date.now()) {
    csrfTokens.delete(req.user.userId);
    logger.warn('Tentativa de usar token CSRF expirado', {
      userId: req.user.userId,
      path: req.path,
      ip: req.ip
    });
    return res.status(403).json({ success: false, error: 'Token CSRF expirado' });
  }

  if (token !== stored.token) {
    logger.warn('Tentativa de usar token CSRF inválido', {
      userId: req.user.userId,
      path: req.path,
      ip: req.ip
    });
    return res.status(403).json({ success: false, error: 'Token CSRF inválido' });
  }

  next();
}

/**
 * Middleware para rotas que precisam de CSRF (opcional, pode ser aplicado seletivamente)
 */
export function requireCSRF(req: AuthRequest, res: Response, next: NextFunction) {
  return validateCSRF(req, res, next);
}

