import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Schema para atualização de usuário pelo admin
const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim(),
  role: Joi.string().valid('admin', 'moderator', 'user'),
  plan: Joi.string().valid('mensal', 'trimestral', 'anual'),
  isActive: Joi.boolean()
}).min(1); // Pelo menos um campo deve ser fornecido

// Schema para parâmetros de paginação
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).max(1000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'email', 'name', 'role', 'plan').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().max(100).trim().allow(''),
  role: Joi.string().valid('admin', 'moderator', 'user'),
  isActive: Joi.boolean(),
  plan: Joi.string().valid('mensal', 'trimestral', 'anual'),
  createdAtFrom: Joi.date().iso(),
  createdAtTo: Joi.date().iso().min(Joi.ref('createdAtFrom'))
});

// Schema para parâmetros de gráficos
const chartParamsSchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30)
});

// Schema para parâmetros de exportação
const exportParamsSchema = Joi.object({
  format: Joi.string().valid('csv', 'json').default('csv'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  includeFields: Joi.array().items(Joi.string())
});

// Middleware para validar atualização de usuário
export function validateUpdateUser(req: Request, res: Response, next: NextFunction) {
  const { error, value } = updateUserSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      error: 'Dados inválidos para atualização de usuário',
      details: errors
    });
  }

  req.body = value;
  next();
}

// Middleware para validar parâmetros de paginação
export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const { error, value } = paginationSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      error: 'Parâmetros de paginação inválidos',
      details: errors
    });
  }

  // Substituir req.query pelos valores validados e convertidos
  req.query = value;
  next();
}

// Middleware para validar parâmetros de gráficos
export function validateChartParams(req: Request, res: Response, next: NextFunction) {
  const { error, value } = chartParamsSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      error: 'Parâmetros de gráfico inválidos',
      details: errors
    });
  }

  req.query = value;
  next();
}

// Middleware para validar parâmetros de exportação
export function validateExportParams(req: Request, res: Response, next: NextFunction) {
  const { error, value } = exportParamsSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      error: 'Parâmetros de exportação inválidos',
      details: errors
    });
  }

  req.query = value;
  next();
}

// Middleware para validar ID de usuário
export function validateUserId(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return res.status(400).json({
      error: 'ID de usuário inválido',
      details: ['ID deve ser uma string não vazia']
    });
  }

  // Validação básica de formato UUID (opcional)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      error: 'ID de usuário inválido',
      details: ['ID deve ser um UUID válido']
    });
  }

  next();
}

// Middleware combinado para endpoints que precisam de paginação
export const paginationMiddleware = [validatePagination];

// Middleware combinado para atualização de usuário
export const updateUserMiddleware = [validateUserId, validateUpdateUser];

// Middleware combinado para gráficos
export const chartMiddleware = [validateChartParams];

// Middleware combinado para exportação
export const exportMiddleware = [validateExportParams]; 