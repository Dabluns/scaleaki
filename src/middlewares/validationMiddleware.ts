import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import validator from 'validator';

const registerSchema = Joi.object({
  email: Joi.string().email().required().max(255).trim().lowercase(),
  password: Joi.string().min(8).max(128).required(),
  name: Joi.string().min(2).max(100).required().trim(),
  plan: Joi.string().valid('mensal', 'trimestral', 'anual').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().max(255).trim().lowercase(),
  password: Joi.string().min(1).max(128).required()
});

export function validateRegister(req: Request, res: Response, next: NextFunction) {
  // Sanitização extra
  if (req.body.email) req.body.email = validator.normalizeEmail(req.body.email) || req.body.email;
  if (req.body.name) req.body.name = validator.trim(req.body.name);
  if (req.body.password) req.body.password = validator.trim(req.body.password);

  const { error, value } = registerSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true // Remove campos não permitidos
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors
    });
  }

  req.body = value; // Usa apenas os dados validados e sanitizados
  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  // Sanitização extra
  if (req.body.email) req.body.email = validator.normalizeEmail(req.body.email) || req.body.email;
  if (req.body.password) req.body.password = validator.trim(req.body.password);

  const { error, value } = loginSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true // Remove campos não permitidos
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors
    });
  }

  req.body = value; // Usa apenas os dados validados e sanitizados
  next();
} 