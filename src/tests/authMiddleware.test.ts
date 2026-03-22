import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { userRateLimiter } from '../middlewares/rateLimitUserMiddleware';
import authConfig from '../config/auth';

// Mock do processo para testes
process.env.JWT_SECRET = 'test-secret-key-with-minimum-32-characters-for-security';

const app = express();
app.use(express.json());

// Rota protegida por authenticateJWT
app.get('/protected', authenticateJWT, (req, res) => {
  res.status(200).json({ message: 'Acesso autorizado' });
});

// Rota protegida por authenticateJWT + authorizeRoles
app.get('/admin', authenticateJWT, authorizeRoles(['admin']), (req, res) => {
  res.status(200).json({ message: 'Acesso admin autorizado' });
});

// Rota protegida por userRateLimiter
app.get('/limited', userRateLimiter, (req, res) => {
  res.status(200).json({ message: 'Dentro do limite' });
});

describe('Middleware de autenticação', () => {
  it('bloqueia requisição sem token', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('bloqueia requisição com token inválido', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer token_invalido');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('permite requisição com token válido', async () => {
    const token = jwt.sign({ userId: '123', role: 'user' }, authConfig.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Acesso autorizado');
  });
});

describe('Middleware de autorização por role', () => {
  it('bloqueia usuário sem role adequada', async () => {
    const token = jwt.sign({ userId: '123', role: 'user' }, authConfig.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  it('permite usuário com role adequada', async () => {
    const token = jwt.sign({ userId: '123', role: 'admin' }, authConfig.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Acesso admin autorizado');
  });
});

describe('Middleware de rate limiting por usuário/IP', () => {
  it('permite até o limite de requisições', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/limited');
      expect([200, 429]).toContain(res.status);
    }
  });

  it('bloqueia após exceder o limite', async () => {
    let blocked = false;
    for (let i = 0; i < 110; i++) {
      const res = await request(app).get('/limited');
      if (res.status === 429) blocked = true;
    }
    expect(blocked).toBe(true);
  });
}); 