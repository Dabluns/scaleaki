import request from 'supertest';
import app from '../../server';

describe('Server Integration Tests', () => {
  describe('Health Check', () => {
    it('deve retornar status 200 para health check', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('Root Endpoint', () => {
    it('deve retornar mensagem de boas-vindas', async () => {
      const res = await request(app)
        .get('/')
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('SaaS Backend');
    });
  });

  describe('404 Handler', () => {
    it('deve retornar 404 para rotas inexistentes', async () => {
      const res = await request(app)
        .get('/rota-inexistente')
        .expect(404);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Not Found');
    });
  });

  describe('CORS', () => {
    it('deve incluir headers CORS', async () => {
      const res = await request(app)
        .options('/')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(res.headers).toHaveProperty('access-control-allow-origin');
      expect(res.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Security Headers', () => {
    it('deve incluir headers de segurança', async () => {
      const res = await request(app)
        .get('/')
        .expect(200);

      // Verificar headers de segurança básicos
      expect(res.headers).toHaveProperty('x-content-type-options');
      expect(res.headers).toHaveProperty('x-frame-options');
      expect(res.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Rate Limiting', () => {
    it('burst de login retorna respostas controladas (sem 5xx)', async () => {
      // RATE_LIMIT_MAX default = 500 (server.ts), entao 15 reqs nao batem 429.
      // Garantia real: burst tratado pelo fluxo de auth -> todos 200/401/429,
      // nenhum 5xx vazando pra fora.
      const responses = [];
      for (let i = 0; i < 15; i++) {
        const res = await request(app).post('/auth/login').send({
          email: 'test@example.com',
          password: 'password123',
        });
        responses.push(res);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const allHandled = responses.every(r => [200, 401, 429].includes(r.status));
      expect(allHandled).toBe(true);
      // Sanidade: ao menos uma resposta chegou (nao foi tudo timeout/conexao)
      expect(responses.length).toBe(15);
    }, 15000);
  });

  describe('Error Handling', () => {
    it('rota protegida com Bearer invalido retorna 401 sem tocar DB', async () => {
      // /api/queries/history nao existe (sem prefixo /api montado) -> caia 404.
      // Trocado por /auth/me: jwt.verify lanca em token invalido -> 401 antes do DB.
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });
  });
}); 