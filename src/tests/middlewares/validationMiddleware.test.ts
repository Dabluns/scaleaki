import express from 'express';
import request from 'supertest';
import { validateRegister, validateLogin } from '../../middlewares/validationMiddleware';

const app = express();
app.use(express.json());

// Rotas de teste com validação
app.post('/register', validateRegister, (req, res) => {
  res.status(200).json({ success: true, data: req.body });
});

app.post('/login', validateLogin, (req, res) => {
  res.status(200).json({ success: true, data: req.body });
});

describe('ValidationMiddleware', () => {
  describe('validateRegister', () => {
    it('deve permitir dados válidos', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User'
      };

      const res = await request(app)
        .post('/register')
        .send(validData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(validData);
    });

    it('deve rejeitar email inválido', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'TestPass123!',
        name: 'Test User'
      };

      const res = await request(app)
        .post('/register')
        .send(invalidData)
        .expect(400);

      expect(res.body.error).toBe('Dados inválidos');
      expect(res.body.details).toBeDefined();
    });

    it('deve rejeitar senha muito curta', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User'
      };

      const res = await request(app)
        .post('/register')
        .send(invalidData)
        .expect(400);

      expect(res.body.error).toBe('Dados inválidos');
      expect(res.body.details).toBeDefined();
    });

    it('deve rejeitar nome muito curto', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'A'
      };

      const res = await request(app)
        .post('/register')
        .send(invalidData)
        .expect(400);

      expect(res.body.error).toBe('Dados inválidos');
      expect(res.body.details).toBeDefined();
    });

    it('deve rejeitar dados ausentes', async () => {
      const invalidData = {
        email: 'test@example.com'
        // password e name ausentes
      };

      const res = await request(app)
        .post('/register')
        .send(invalidData)
        .expect(400);

      expect(res.body.error).toBe('Dados inválidos');
    });

    it('deve rejeitar dados vazios', async () => {
      const invalidData = {
        email: '',
        password: '',
        name: ''
      };

      const res = await request(app)
        .post('/register')
        .send(invalidData)
        .expect(400);

      expect(res.body.error).toBe('Dados inválidos');
    });

    it('deve rejeitar tipos de dados incorretos', async () => {
      const invalidData = {
        email: 123, // número em vez de string
        password: 'TestPass123!',
        name: 'Test User'
      };

      const res = await request(app)
        .post('/register')
        .send(invalidData)
        .expect(400);

      expect(res.body.error).toBe('Dados inválidos');
    });
  });
}); 