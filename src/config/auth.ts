import dotenv from 'dotenv';
dotenv.config();
import { Secret } from 'jsonwebtoken';

// Validação obrigatória do JWT_SECRET
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET é obrigatório. Configure esta variável de ambiente.');
}

if (process.env.JWT_SECRET === 'default_secret' || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres e não pode ser o valor padrão.');
}

export const authConfig = {
  JWT_SECRET: process.env.JWT_SECRET as Secret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SALT_ROUNDS: 12,
  PASSWORD_MIN_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutos
};

export default authConfig; 