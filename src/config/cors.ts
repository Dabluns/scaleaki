import { CorsOptions } from 'cors';

// Lista de origens permitidas (configurável via env)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];

// Configuração segura do CORS
export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    // Durante testes, permitir todas as origens
    if (process.env.NODE_ENV === 'test') {
      return callback(null, true);
    }

    // Permitir requisições sem origin (ex: Postman, mobile apps)
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Verificar se a origem está na lista permitida ou se é da Vercel
    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ],
  credentials: true, // Permitir cookies
  maxAge: 86400, // Cache de preflight por 24 horas
  optionsSuccessStatus: 200 // Para suporte a browsers antigos
};

export default corsConfig; 