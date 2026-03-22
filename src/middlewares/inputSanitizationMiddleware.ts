import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

/**
 * Sanitiza strings removendo caracteres perigosos
 */
function sanitizeString(input: any): any {
  if (typeof input === 'string') {
    // Remover caracteres de controle e scripts
    return input
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .trim();
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeString);
  }
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    Object.keys(input).forEach(key => {
      sanitized[key] = sanitizeString(input[key]);
    });
    return sanitized;
  }
  return input;
}

/**
 * Valida e sanitiza entrada de dados
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  try {
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeString(req.body);
    }

    // Sanitizar query params
    if (req.query && typeof req.query === 'object') {
      const sanitizedQuery: any = {};
      Object.keys(req.query).forEach(key => {
        sanitizedQuery[key] = sanitizeString(req.query[key]);
      });
      req.query = sanitizedQuery;
    }

    // Sanitizar params
    if (req.params && typeof req.params === 'object') {
      const sanitizedParams: any = {};
      Object.keys(req.params).forEach(key => {
        sanitizedParams[key] = sanitizeString(req.params[key]);
      });
      req.params = sanitizedParams;
    }

    next();
  } catch (error) {
    logger.error('Erro ao sanitizar entrada', {
      error: error instanceof Error ? error.message : String(error)
    });
    return res.status(400).json({ success: false, error: 'Dados inválidos' });
  }
}

/**
 * Valida que IDs são UUIDs válidos
 */
export function validateUUID(field: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    const id = req.params[field] || req.body[field] || req.query[field];
    
    if (id && !uuidRegex.test(id)) {
      logger.warn('Tentativa de usar ID inválido', {
        field,
        id,
        path: req.path,
        ip: req.ip
      });
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    next();
  };
}

