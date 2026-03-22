import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, RegisterInput, LoginInput, AuthPayload, UserPlan, UserRole } from '../types/user';
import authConfig from '../config/auth';
import prisma from '../config/database';
import { queueConfirmationEmail } from './emailQueue';
import crypto from 'crypto';
import logger from '../config/logger';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, authConfig.SALT_ROUNDS);
}

export function validatePasswordStrength(password: string): boolean {
  // Pelo menos 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return regex.test(password) && password.length >= authConfig.PASSWORD_MIN_LENGTH;
}

export async function register(data: RegisterInput, autoConfirm: boolean = false): Promise<AuthPayload> {
  const startTime = Date.now();

  try {
    if (!validatePasswordStrength(data.password)) {
      throw new Error(`Senha fraca. Use pelo menos ${authConfig.PASSWORD_MIN_LENGTH} caracteres, incluindo maiúsculas, minúsculas, números e símbolos.`);
    }

    const hashedPassword = await hashPassword(data.password);
    const emailConfirmationToken = crypto.randomBytes(32).toString('hex');
    const emailConfirmationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        plan: data.plan || 'mensal',
        role: 'user',
        isActive: true,
        emailConfirmed: autoConfirm, // Confirmar automaticamente se for checkout
        emailConfirmationToken: autoConfirm ? null : emailConfirmationToken,
        emailConfirmationExpires: autoConfirm ? null : emailConfirmationExpires,
      },
    });

    // Enviar e-mail de confirmação via queue apenas se não for auto-confirmado
    if (!autoConfirm) {
      queueConfirmationEmail(user.email, user.name, emailConfirmationToken)
        .then(() => {
          logger.info('Confirmation email queued successfully', { userId: user.id, email: user.email });
        })
        .catch((error) => {
          logger.error('Failed to queue confirmation email', {
            userId: user.id,
            email: user.email,
            error: error instanceof Error ? error.message : String(error)
          });
        });
    } else {
      logger.info('User registered with auto-confirmation (checkout)', { userId: user.id, email: user.email });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      authConfig.JWT_SECRET,
      { expiresIn: authConfig.JWT_EXPIRES_IN } as SignOptions
    );

    const { password, ...userWithoutPassword } = user;

    const executionTime = Date.now() - startTime;
    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      autoConfirm,
      executionTime
    });

    return {
      token,
      user: userWithoutPassword as Omit<User, "password">,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('User registration failed', {
      email: data.email,
      error: error instanceof Error ? error.message : String(error),
      executionTime
    });
    throw error;
  }
}

export async function login(data: LoginInput, clientIp?: string): Promise<AuthPayload> {
  const startTime = Date.now();

  try {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new Error('Credenciais inválidas.');

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new Error('Credenciais inválidas.');

    // O projeto é pago, logo o bloqueio por e-mail não confirmado foi removido
    // if (!user.emailConfirmed) throw new Error('E-mail não confirmado. Verifique sua caixa de entrada.');

    // Verificar IP do primeiro login
    if (clientIp) {
      // Se já existe um IP registrado e é diferente do atual, bloquear
      if (user.firstLoginIp && user.firstLoginIp !== clientIp) {
        logger.warn('Login bloqueado: IP diferente do primeiro login', {
          userId: user.id,
          email: user.email,
          firstLoginIp: user.firstLoginIp,
          attemptedIp: clientIp
        });
        throw new Error('Login bloqueado: Este usuário só pode fazer login do IP original. Entre em contato com o suporte se precisar alterar o IP autorizado.');
      }

      // Se não existe IP registrado, armazenar o IP do primeiro login
      if (!user.firstLoginIp) {
        await prisma.user.update({
          where: { id: user.id },
          data: { firstLoginIp: clientIp },
        });
        logger.info('IP do primeiro login registrado', {
          userId: user.id,
          email: user.email,
          firstLoginIp: clientIp
        });
      }
    }

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      authConfig.JWT_SECRET,
      { expiresIn: authConfig.JWT_EXPIRES_IN } as SignOptions
    );

    const { password, ...userWithoutPassword } = user;

    const executionTime = Date.now() - startTime;
    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      ip: clientIp,
      executionTime
    });

    return {
      token,
      user: userWithoutPassword as Omit<User, "password">,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('User login failed', {
      email: data.email,
      ip: clientIp,
      error: error instanceof Error ? error.message : String(error),
      executionTime
    });
    throw error;
  }
}

export function checkPasswordExpiration(updatedAt: Date): boolean {
  // Exemplo: expira a cada 90 dias
  const expirationDays = 90;
  const now = new Date();
  const diff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  return diff > expirationDays;
} 