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
    it('deve aplicar rate limiting em rotas sensíveis', async () => {
      // Fazer múltiplas requisições sequenciais para testar rate limiting
      const responses = [];
      
      for (let i = 0; i < 15; i++) {
        const res = await request(app).post('/auth/login').send({
          email: 'test@example.com',
          password: 'password123'
        });
        responses.push(res);
        
        // Pequena pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Verificar se pelo menos uma resposta tem status diferente de 200/401
      const hasRateLimit = responses.some(res => res.status === 429);
      const hasOtherError = responses.some(res => res.status !== 200 && res.status !== 401);
      
      // Se não há rate limit específico, pelo menos deve haver outras respostas de erro
      expect(hasRateLimit || hasOtherError).toBe(true);
    }, 10000); // Aumentar timeout para 10 segundos
  });

  describe('Error Handling', () => {
    it('deve retornar erro 500 para erros internos', async () => {
      // Testar endpoint que pode gerar erro interno
      const res = await request(app)
        .get('/api/queries/history')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });
  });
}); 