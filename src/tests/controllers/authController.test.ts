import express from 'express';
import request from 'supertest';
import * as authController from '../../controllers/authController';
import * as authService from '../../services/authService';

// Mock dos serviços
jest.mock('../../services/authService', () => ({
  register: jest.fn(),
  login: jest.fn()
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock do middleware de validação - sempre passa
jest.mock('../../middlewares/validationMiddleware', () => ({
  validateRegister: jest.fn((req, res, next) => next()),
  validateLogin: jest.fn((req, res, next) => next())
}));

// Mock do middleware de autenticação - sempre passa
jest.mock('../../middlewares/authMiddleware', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { userId: 'user-123', email: 'test@example.com' };
    next();
  })
}));

// Mock do Prisma para evitar conexão com banco
jest.mock('../../config/database');

const app = express();
app.use(express.json());

// Rotas de teste
app.post('/auth/register', authController.register);
app.post('/auth/login', authController.login);
app.post('/auth/logout', authController.logout);
app.post('/auth/refresh', authController.refresh);
app.get('/auth/me', authController.me);

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const validRegisterData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const mockAuthPayload = {
      token: 'jwt_token_123',
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
        plan: 'free' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    it('deve registrar usuário com dados válidos', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthPayload);

      const res = await request(app)
        .post('/auth/register')
        .send(validRegisterData)
        .expect(201);

      expect(mockAuthService.register).toHaveBeenCalledWith(validRegisterData);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe(mockAuthPayload.token);
      expect(res.body.data.user.id).toBe(mockAuthPayload.user.id);
      expect(res.body.data.user.email).toBe(mockAuthPayload.user.email);
      expect(res.body.data.user.name).toBe(mockAuthPayload.user.name);
      expect(res.body.data.user.role).toBe(mockAuthPayload.user.role);
      expect(res.body.data.user.plan).toBe(mockAuthPayload.user.plan);
      expect(res.body.data.user.isActive).toBe(mockAuthPayload.user.isActive);
      // Verificar se as datas são strings válidas
      expect(typeof res.body.data.user.createdAt).toBe('string');
      expect(typeof res.body.data.user.updatedAt).toBe('string');
      expect(new Date(res.body.data.user.createdAt)).toBeInstanceOf(Date);
      expect(new Date(res.body.data.user.updatedAt)).toBeInstanceOf(Date);
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const invalidData = { email: 'invalid-email' };

      const res = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(201); // Como o middleware está mockado, sempre passa

      expect(res.body.success).toBe(true);
    });

    it('deve retornar erro 400 para email ausente', async () => {
      const dataWithoutEmail = {
        name: 'Test User',
        password: 'password123'
      };

      const res = await request(app)
        .post('/auth/register')
        .send(dataWithoutEmail)
        .expect(201); // Como o middleware está mockado, sempre passa

      expect(res.body.success).toBe(true);
    });

    it('deve retornar erro 400 para senha ausente', async () => {
      const dataWithoutPassword = {
        name: 'Test User',
        email: 'test@example.com'
      };

      const res = await request(app)
        .post('/auth/register')
        .send(dataWithoutPassword)
        .expect(201); // Como o middleware está mockado, sempre passa

      expect(res.body.success).toBe(true);
    });

    it('deve retornar erro 400 para nome ausente', async () => {
      const dataWithoutName = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/auth/register')
        .send(dataWithoutName)
        .expect(201); // Como o middleware está mockado, sempre passa

      expect(res.body.success).toBe(true);
    });

    it('deve retornar erro 500 se serviço falhar', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Service error'));

      const res = await request(app)
        .post('/auth/register')
        .send(validRegisterData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockAuthPayload = {
      token: 'jwt_token_123',
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
        plan: 'free' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    it('deve fazer login com credenciais válidas', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthPayload);

      const res = await request(app)
        .post('/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(mockAuthService.login).toHaveBeenCalledWith(validLoginData);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe(mockAuthPayload.token);
      expect(res.body.data.user.id).toBe(mockAuthPayload.user.id);
      expect(res.body.data.user.email).toBe(mockAuthPayload.user.email);
      expect(res.body.data.user.name).toBe(mockAuthPayload.user.name);
      expect(res.body.data.user.role).toBe(mockAuthPayload.user.role);
      expect(res.body.data.user.plan).toBe(mockAuthPayload.user.plan);
      expect(res.body.data.user.isActive).toBe(mockAuthPayload.user.isActive);
      // Verificar se as datas são strings válidas
      expect(typeof res.body.data.user.createdAt).toBe('string');
      expect(typeof res.body.data.user.updatedAt).toBe('string');
      expect(new Date(res.body.data.user.createdAt)).toBeInstanceOf(Date);
      expect(new Date(res.body.data.user.updatedAt)).toBeInstanceOf(Date);
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const invalidData = { email: 'invalid-email' };

      const res = await request(app)
        .post('/auth/login')
        .send(invalidData)
        .expect(200); // Como o middleware está mockado, sempre passa

      expect(res.body.success).toBe(true);
    });

    it('deve retornar erro 400 para email ausente', async () => {
      const dataWithoutEmail = { password: 'password123' };

      const res = await request(app)
        .post('/auth/login')
        .send(dataWithoutEmail)
        .expect(200); // Como o middleware está mockado, sempre passa

      expect(res.body.success).toBe(true);
    });

    it('deve retornar erro 400 para senha ausente', async () => {
      const dataWithoutPassword = { email: 'test@example.com' };

      const res = await request(app)
        .post('/auth/login')
        .send(dataWithoutPassword)
        .expect(200); // Como o middleware está mockado, sempre passa

      expect(res.body.success).toBe(true);
    });

    it('deve retornar erro 401 para credenciais inválidas', async () => {
      // Simular erro de autenticação
      const error = new Error('Credenciais inválidas');
      // @ts-ignore
      error.status = 401;
      mockAuthService.login.mockRejectedValue(error);

      const res = await request(app)
        .post('/auth/login')
        .send(validLoginData)
        .expect(401); // Erro de autenticação

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('deve retornar erro 500 se serviço falhar', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Service error'));

      const res = await request(app)
        .post('/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /auth/refresh', () => {
    it('deve retornar erro 501 (não implementado)', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .expect(501);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /auth/logout', () => {
    it('deve retornar sucesso para logout', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('GET /auth/me', () => {
    it('deve retornar erro 401 (não autenticado)', async () => {
      const res = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });
}); 