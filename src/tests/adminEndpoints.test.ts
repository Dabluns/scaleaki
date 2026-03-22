import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import * as adminController from '../controllers/adminController';
import authConfig from '../config/auth';

// Mock do processo para testes
process.env.JWT_SECRET = 'test-secret-key-with-minimum-32-characters-for-security';

const app = express();
app.use(express.json());

// Rotas de teste simulando as rotas administrativas
app.get('/admin/dashboard', authenticateJWT, authorizeRoles(['admin']), adminController.getDashboard);
app.get('/admin/users', authenticateJWT, authorizeRoles(['admin']), adminController.getUsers);
app.get('/admin/metrics/users', authenticateJWT, authorizeRoles(['admin']), adminController.getUserMetrics);
app.get('/admin/metrics/queries', authenticateJWT, authorizeRoles(['admin']), adminController.getQueryMetrics);
app.get('/admin/charts/data', authenticateJWT, authorizeRoles(['admin']), adminController.getChartData);
app.get('/admin/alerts', authenticateJWT, authorizeRoles(['admin']), adminController.getSystemAlerts);

// Mock dos serviços administrativos
jest.mock('../services/adminService', () => ({
  getDashboardData: jest.fn().mockResolvedValue({
    userMetrics: {
      totalUsers: 100,
      activeUsers: 85,
      newUsersToday: 5,
      newUsersThisWeek: 25,
      newUsersThisMonth: 80,
      usersByPlan: { free: 60, basic: 25, premium: 10, enterprise: 5 }
    },
    queryMetrics: {
      totalQueries: 1500,
      queriesToday: 150,
      queriesThisWeek: 800,
      queriesThisMonth: 1400,
      queriesByType: { bin: 800, card: 500, phone: 200 },
      queriesByStatus: { success: 1350, error: 100, pending: 50 },
      averageExecutionTime: 250
    },
    revenueMetrics: {
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      revenueByPlan: { basic: 0, premium: 0, enterprise: 0 },
      totalSubscriptions: 0,
      activeSubscriptions: 0
    },
    systemMetrics: {
      uptime: 86400,
      memoryUsage: { used: 50000000, total: 100000000, percentage: 50 },
      cpuUsage: 25,
      errorRate: 2.5,
      requestsPerMinute: 120
    }
  }),
  getUsersList: jest.fn().mockResolvedValue({
    data: [
      {
        id: 'user-1',
        email: 'user1@test.com',
        name: 'User 1',
        role: 'user',
        plan: 'free',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        queryCount: 10
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    }
  }),
  getUserMetrics: jest.fn().mockResolvedValue({
    totalUsers: 100,
    activeUsers: 85,
    newUsersToday: 5,
    newUsersThisWeek: 25,
    newUsersThisMonth: 80,
    usersByPlan: { free: 60, basic: 25, premium: 10, enterprise: 5 }
  }),
  getQueryMetrics: jest.fn().mockResolvedValue({
    totalQueries: 1500,
    queriesToday: 150,
    queriesThisWeek: 800,
    queriesThisMonth: 1400,
    queriesByType: { bin: 800, card: 500, phone: 200 },
    queriesByStatus: { success: 1350, error: 100, pending: 50 },
    averageExecutionTime: 250
  }),
  getChartData: jest.fn().mockResolvedValue({
    users: [{ date: '2024-01-01', value: 5 }],
    queries: [{ date: '2024-01-01', value: 50 }],
    revenue: [{ date: '2024-01-01', value: 0 }]
  }),
  getSystemAlerts: jest.fn().mockResolvedValue([
    {
      id: 'alert-1',
      type: 'warning',
      title: 'Test Alert',
      message: 'This is a test alert',
      createdAt: new Date(),
      isRead: false
    }
  ])
}));

describe('Endpoints Administrativos', () => {
  describe('Autenticação e Autorização', () => {
    it('deve bloquear acesso sem token', async () => {
      const res = await request(app).get('/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('deve bloquear acesso com token inválido', async () => {
      const res = await request(app)
        .get('/admin/dashboard')
        .set('Authorization', 'Bearer token_invalido');
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('deve bloquear acesso de usuário comum (não admin)', async () => {
      const token = jwt.sign(
        { userId: '123', role: 'user' },
        authConfig.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const res = await request(app)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
    });

    it('deve permitir acesso de admin com token válido', async () => {
      const token = jwt.sign(
        { userId: '123', role: 'admin' },
        authConfig.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const res = await request(app)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userMetrics');
      expect(res.body).toHaveProperty('queryMetrics');
    });
  });

  describe('Dashboard', () => {
    it('deve retornar dados completos do dashboard', async () => {
      const token = jwt.sign(
        { userId: 'admin-123', role: 'admin' },
        authConfig.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const res = await request(app)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userMetrics');
      expect(res.body).toHaveProperty('queryMetrics');
      expect(res.body).toHaveProperty('revenueMetrics');
      expect(res.body).toHaveProperty('systemMetrics');
      
      // Verificar estrutura das métricas de usuário
      expect(res.body.userMetrics).toHaveProperty('totalUsers');
      expect(res.body.userMetrics).toHaveProperty('activeUsers');
      expect(res.body.userMetrics).toHaveProperty('usersByPlan');
      
      // Verificar estrutura das métricas de consulta
      expect(res.body.queryMetrics).toHaveProperty('totalQueries');
      expect(res.body.queryMetrics).toHaveProperty('queriesByType');
      expect(res.body.queryMetrics).toHaveProperty('queriesByStatus');
    });
  });

  describe('Gestão de Usuários', () => {
    it('deve listar usuários com paginação', async () => {
      const token = jwt.sign(
        { userId: 'admin-123', role: 'admin' },
        authConfig.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const res = await request(app)
        .get('/admin/users?page=1&limit=20')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('total');
    });
  });

  describe('Métricas', () => {
    it('deve retornar métricas de usuários', async () => {
      const token = jwt.sign(
        { userId: 'admin-123', role: 'admin' },
        authConfig.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const res = await request(app)
        .get('/admin/metrics/users')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('activeUsers');
      expect(res.body).toHaveProperty('usersByPlan');
      expect(typeof res.body.totalUsers).toBe('number');
    });

    it('deve retornar métricas de consultas', async () => {
      const token = jwt.sign(
        { userId: 'admin-123', role: 'admin' },
        authConfig.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const res = await request(app)
        .get('/admin/metrics/queries')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalQueries');
      expect(res.body).toHaveProperty('queriesByType');
      expect(res.body).toHaveProperty('queriesByStatus');
      expect(res.body).toHaveProperty('averageExecutionTime');
    });
  });

  describe('Dados de Gráficos', () => {
    it('deve retornar dados para gráficos', async () => {
      const token = jwt.sign(
        { userId: 'admin-123', role: 'admin' },
        authConfig.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const res = await request(app)
        .get('/admin/charts/data?days=30')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('queries');
      expect(res.body).toHaveProperty('revenue');
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(Array.isArray(res.body.queries)).toBe(true);
    });
  });

  describe('Alertas do Sistema', () => {
    it('deve retornar alertas do sistema', async () => {
      const token = jwt.sign(
        { userId: 'admin-123', role: 'admin' },
        authConfig.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const res = await request(app)
        .get('/admin/alerts')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('type');
        expect(res.body[0]).toHaveProperty('title');
        expect(res.body[0]).toHaveProperty('message');
      }
    });
  });
}); 