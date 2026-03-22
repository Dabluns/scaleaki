import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import logger from './config/logger';
import authRoutes from './routes/authRoutes';
import corsConfig from './config/cors';
import adminRoutes from './routes/adminRoutes';
import nichoRoutes from './routes/nichoRoutes';
import ofertaRoutes from './routes/ofertaRoutes';
import favoritoRoutes from './routes/favoritoRoutes';
import relatorioRoutes from './routes/relatorioRoutes';
import rankingRoutes from './routes/rankingRoutes';
import asyncRoutes from './routes/asyncRoutes';
import settingsRoutes from './routes/settingsRoutes';
import profileRoutes from './routes/profileRoutes';
import securityRoutes from './routes/securityRoutes';
import notificationsRoutes from './routes/notificationsRoutes';
import exportRoutes from './routes/exportRoutes';
import accountRoutes from './routes/accountRoutes';
import keysRoutes from './routes/keysRoutes';
import webhooksRoutes from './routes/webhooksRoutes';
import paymentRoutes from './routes/paymentRoutes';
import botRoutes from './routes/botRoutes';
import { botService } from './services/botService';
import { startBillingMonitor } from './services/billingService';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || 'localhost';

// Configurar trust proxy para obter IP real do cliente através de proxies/load balancers
// Isso permite que req.ip funcione corretamente com x-forwarded-for
app.set('trust proxy', true);

// Rate limiting - Proteção contra DDoS
const RATE_LIMIT_WINDOW_MINUTES = Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 15);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 100);

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMIT_MAX,
  message: {
    error: `Muitas requisições deste IP. Tente novamente em ${RATE_LIMIT_WINDOW_MINUTES} minutos.`,
    retryAfter: `${RATE_LIMIT_WINDOW_MINUTES} minutes`
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Configurável via env; por padrão não pula prefixos
  skip: (req) => {
    const cfg = process.env.RATE_LIMIT_SKIP_PREFIXES;
    if (!cfg) return false;
    const path = req.path || req.originalUrl || '';
    const prefixed = cfg.split(',').map(p => p.trim()).filter(Boolean);
    return prefixed.some(p => path.startsWith(p));
  }
});

// Aplicar rate limiting global
app.use(limiter);

// Middlewares de segurança e performance
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: (process.env.CSP_DEFAULT_SRC || "'self'").split(',').map(s => s.trim()),
      styleSrc: (process.env.CSP_STYLE_SRC || "'self','unsafe-inline'").split(',').map(s => s.trim()),
      scriptSrc: (process.env.CSP_SCRIPT_SRC || "'self'").split(',').map(s => s.trim()),
      imgSrc: (process.env.CSP_IMG_SRC || "'self',data:,https:").split(',').map(s => s.trim()),
    },
  },
  hsts: {
    maxAge: Number(process.env.HSTS_MAX_AGE || 31536000),
    includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
    preload: process.env.HSTS_PRELOAD !== 'false'
  }
}));
app.use(cors(corsConfig)); // Usar configuração segura do CORS
app.use(cookieParser()); // Adicionar cookie-parser

// Compressão otimizada por tipo de resposta
app.use(compression({
  filter: (req, res) => {
    // Não comprimir se o cliente não suporta
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Comprimir apenas respostas JSON e texto
    const contentType = res.getHeader('Content-Type');
    if (typeof contentType === 'string') {
      return contentType.includes('application/json') ||
        contentType.includes('text/') ||
        contentType.includes('application/javascript');
    }

    return compression.filter(req, res);
  },
  level: 6, // Nível de compressão balanceado (0-9)
  threshold: 1024, // Comprimir apenas se > 1KB
  windowBits: 15,
  memLevel: 8
}));

// Parsing com limites seguros para evitar ataques de memória
app.use(express.json({
  limit: '1mb', // Reduzido de 10MB para 1MB
  strict: true
}));
app.use(express.urlencoded({
  extended: true,
  limit: '1mb' // Reduzido de 10MB para 1MB
}));

// Sanitização global de entrada (após parsing)
import { sanitizeInput } from './middlewares/inputSanitizationMiddleware';
app.use(sanitizeInput);

// Cache headers específicos - não aplicar a dados sensíveis
app.use('/health', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=60'); // Cache de 1 minuto para health
  next();
});

// Registrar rotas ANTES dos middlewares de erro
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/nichos', nichoRoutes);
app.use('/ofertas', ofertaRoutes);
app.use('/favoritos', favoritoRoutes);
app.use('/relatorios', relatorioRoutes);
app.use('/ranking', rankingRoutes);
app.use('/async', asyncRoutes);
app.use('/settings', settingsRoutes);
app.use('/profile', profileRoutes);
app.use('/security', securityRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/export', exportRoutes);
app.use('/account', accountRoutes);
app.use('/keys', keysRoutes);
app.use('/webhooks', webhooksRoutes);
app.use('/payments', paymentRoutes);
app.use('/bot', botRoutes);

import { startCleanupJob } from './jobs/cleanupJob';

startBillingMonitor();
startCleanupJob();

// Restaurar estado do bot após restart do servidor
botService.restoreState().catch(err => {
  logger.error('Failed to restore bot state on startup:', err);
});

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    message: 'SaaS Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Rota de health check com informações limitadas
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    // Remover informações sensíveis em produção
    ...(process.env.NODE_ENV === 'development' && {
      environment: process.env.NODE_ENV,
      memory: process.memoryUsage(),
    })
  };

  res.json(healthCheck);
});

// Middleware de tratamento de erros melhorado
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log assíncrono em vez de console.error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString(),
  });
});

// Middleware para rotas não encontradas (melhorado)
app.use('*', (req, res) => {
  logger.warn('Route not found:', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint não encontrado',
    timestamp: new Date().toISOString(),
  });
});

// Tratamento de erros não capturados para evitar crashes
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  // Não encerrar o processo imediatamente, apenas logar
  // Em produção, você pode querer encerrar graciosamente
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection:', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  // Não encerrar o processo, apenas logar
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // Marcar bot como parado no banco antes de fechar
  try { await botService.stop(); } catch (_) { }
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  // Marcar bot como parado no banco antes de fechar
  try { await botService.stop(); } catch (_) { }
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Iniciar servidor com tratamento de erro
let server: any;
try {
  server = app.listen(PORT, () => {
    logger.info('Server started successfully', {
      port: PORT,
      host: HOST,
      environment: process.env.NODE_ENV,
      healthCheck: `http://${HOST}:${PORT}/health`
    });
  });

  // Timeout de conexão aumentado
  server.timeout = 60000; // 60 segundos

  // Tratamento de erro do servidor
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use. Please use a different port.`);
      process.exit(1);
    } else {
      logger.error('Server error:', error);
      throw error;
    }
  });
} catch (error) {
  logger.error('Failed to start server:', error);
  process.exit(1);
}

export default app; 
