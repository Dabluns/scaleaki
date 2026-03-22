import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
jest.mock('../../config/database', () => require('../__mocks__/prisma').default);

import prisma from '../../config/database';
import authRoutes from '../../routes/authRoutes';
import paymentRoutes from '../../routes/paymentRoutes';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-secret-key-with-32-chars-minimum!!';
process.env.ALLOW_AUTO_CONFIRM = 'true';
process.env.FRONTEND_URL = 'http://localhost:3001';

jest.mock('../../middlewares/redisRateLimit', () => {
  const pass = (_req: any, _res: any, next: any) => next();
  return {
    authRateLimiter: pass,
    registerRateLimiter: pass,
    userRateLimiter: pass,
    ofertasRateLimiter: pass,
    dashboardRateLimiter: pass,
    searchRateLimiter: pass,
    heavyOperationRateLimiter: pass,
  };
});

jest.mock('../../middlewares/validationMiddleware', () => ({
  validateRegister: (_req: any, _res: any, next: any) => next(),
  validateLogin: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../middlewares/authMiddleware', () => ({
  authenticateJWT: (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', role: 'user' };
    next();
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../services/cacheService', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  delPattern: jest.fn(),
}));

jest.mock('../../services/caktoService', () => ({
  createCheckout: jest.fn().mockResolvedValue({
    checkoutId: 'chk_123',
    checkoutUrl: 'https://pay.cakto.com/checkout',
  }),
  default: {
    createCheckout: jest.fn().mockResolvedValue({
      checkoutId: 'chk_123',
      checkoutUrl: 'https://pay.cakto.com/checkout',
    }),
  },
}));

const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);
app.use('/payments', paymentRoutes);

describe('Fluxos de autenticação e pagamentos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('realiza cadastro com auto-confirmação', async () => {
    const now = new Date();
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'teste@example.com',
      name: 'Usuário Teste',
      plan: 'free',
      role: 'user',
      password: 'hashed-password',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      emailConfirmed: true,
      firstLoginIp: null,
    });

    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'Usuário Teste',
        email: 'teste@example.com',
        password: 'SenhaFort3!',
        autoConfirm: true,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('teste@example.com');
    expect(mockPrisma.user.create).toHaveBeenCalled();
  });

  it('permite login para usuário confirmado', async () => {
    const now = new Date();
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'teste@example.com',
      name: 'Usuário Teste',
      password: 'hashed-password',
      role: 'user',
      plan: 'free',
      isActive: true,
      emailConfirmed: true,
      firstLoginIp: null,
      lastLoginAt: null,
    });
    mockPrisma.user.update
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'teste@example.com',
        password: 'SenhaFort3!',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('teste@example.com');
    expect(mockPrisma.user.findUnique).toHaveBeenCalled();
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
  });

  it('impede nova assinatura quando usuário já possui plano ativo', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'teste@example.com',
      name: 'Usuário Teste',
    });
    mockPrisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      status: 'active',
    });

    const response = await request(app)
      .post('/payments/subscription')
      .send({
        plan: 'basic',
        paymentMethod: 'credit_card',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/já possui uma assinatura ativa/i);
    expect(mockPrisma.subscription.findUnique).toHaveBeenCalled();
  });
});

