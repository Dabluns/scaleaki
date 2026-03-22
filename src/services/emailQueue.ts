import Bull from 'bull';
import { sendEmail } from '../utils/email';
import logger from '../config/logger';

// Verificar se Redis está disponível
// Suporta REDIS_URL (para serviços cloud) ou configuração individual
let redisConfig: any = {};

if (process.env.REDIS_URL) {
  // Se REDIS_URL for fornecido, usar diretamente (mais fácil para serviços cloud)
  redisConfig = {
    ...redisConfig,
    // ioredis aceita URL diretamente
  };
  // Parse da URL será feito pelo ioredis
} else {
  // Configuração individual (host, port, password)
  redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  };
  
  // Aplicar TLS se necessário (obrigatório para Upstash e outros serviços cloud)
  if (process.env.REDIS_TLS === 'true') {
    redisConfig.tls = {};
  }
}

let emailQueue: Bull.Queue | null = null;
let useQueue = false;
let isRedisConnected = false;

// Verificar se Redis está habilitado antes de inicializar
const enableRedis = process.env.ENABLE_REDIS !== 'false';

if (enableRedis) {
  // Tentar usar Redis apenas se estiver habilitado
  try {
    // Configuração base do Redis
    // Bull aceita URL como string ou objeto de configuração
    const bullRedisConfig: any = process.env.REDIS_URL 
      ? process.env.REDIS_URL  // Se usar REDIS_URL, passar diretamente como string
      : {
          ...redisConfig,
          // Configurações para reconexão automática - sempre reconecta
          retryStrategy: (times: number) => {
            // Delay crescente até máximo de 5 segundos
            const delay = Math.min(Math.pow(2, times) * 100, 5000);
            // Log apenas a cada 20 tentativas para não poluir
            if (times % 20 === 0 || times <= 3) {
              if (times === 1) {
                const hostInfo = process.env.REDIS_URL 
                  ? process.env.REDIS_URL.replace(/:[^:@]*@/, ':****@') // Ocultar senha na URL
                  : `${redisConfig.host}:${redisConfig.port}`;
                logger.warn(`Redis connection failed. Attempting to reconnect... (Make sure Redis is running: ${hostInfo})`);
              }
            }
            return delay; // Sempre retorna delay (nunca null) para continuar tentando
          },
          maxRetriesPerRequest: null, // Retry infinito
          enableReadyCheck: true,
          lazyConnect: true, // Mudado para true para evitar conexão imediata
          connectTimeout: 10000,
          commandTimeout: 5000,
          // Adicionar handler de erro global para evitar "Unhandled error event"
          showFriendlyErrorStack: true,
        };

    emailQueue = new Bull('email-queue', {
      redis: bullRedisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
    settings: {
      // Configurações para melhor tolerância a falhas
      maxStalledCount: 1,
      stalledInterval: 30000,
    },
  });

  // Evento quando Redis está pronto
  emailQueue.on('ready', () => {
    if (!isRedisConnected) {
      logger.info('Redis connection established, using email queue');
      useQueue = true;
      isRedisConnected = true;
    }
  });

  // Evento quando há erro de conexão (mas continua tentando reconectar)
  let errorCount = 0;
  emailQueue.on('error', (error) => {
    errorCount++;
    
    if (isRedisConnected) {
      logger.warn('Redis connection error (will retry)', { 
        error: error.message 
      });
      useQueue = false;
      isRedisConnected = false;
    } else {
      // Log apenas a cada 50 erros para não poluir os logs
      if (errorCount % 50 === 0 || errorCount <= 3) {
        logger.warn('Redis connection error (retrying)', { 
          error: error.message,
          attempt: errorCount,
          tip: 'Make sure Redis is running on ' + redisConfig.host + ':' + redisConfig.port
        });
      }
    }
  });


  // Evento quando reconecta (silencioso para não poluir logs)
  emailQueue.on('reconnecting', () => {
    // Log apenas na primeira reconexão
    if (!isRedisConnected) {
      logger.debug('Redis attempting to reconnect...');
    }
  });

  // Capturar erros não tratados do cliente Redis (ioredis) - evita "Unhandled error event"
  // Configurar handlers após a queue estar inicializada
  setImmediate(() => {
    try {
      const queueAny = emailQueue as any;
      
      // Função para adicionar handler de erro a um cliente
      const addErrorHandler = (client: any) => {
        if (client && typeof client.on === 'function') {
          // Remover listeners anteriores para evitar duplicação
          client.removeAllListeners('error');
          // Adicionar handler que captura o erro sem logar (já é logado pelo Bull)
          client.on('error', (error: Error) => {
            // Handler silencioso - evita "Unhandled error event"
            // O erro já é tratado pelo evento 'error' da queue
            if (error.message && !error.message.includes('ECONNREFUSED')) {
              // Logar apenas erros não relacionados a conexão
              logger.debug('Redis client error (handled)', { error: error.message });
            }
          });
        }
      };
      
      // Capturar erros de todos os clientes possíveis do Bull
      const clients = queueAny.clients || [];
      if (Array.isArray(clients)) {
        clients.forEach(addErrorHandler);
      }
      
      // Cliente principal, subscriber e bclient
      [queueAny.client, queueAny.subscriber, queueAny.bclient].forEach(addErrorHandler);
      
      // Também capturar no objeto queue diretamente
      if (queueAny.redis && queueAny.redis.client) {
        addErrorHandler(queueAny.redis.client);
      }
    } catch (error) {
      // Ignorar erros ao configurar handlers
      logger.debug('Error setting up Redis error handlers', { error });
    }
  });

  // Verificar conexão inicial (com lazyConnect, só conecta quando necessário)
  // Não verificar isReady() imediatamente para evitar erro na inicialização
  // A conexão será estabelecida quando o primeiro job for adicionado

} catch (error) {
  logger.error('Failed to initialize email queue', { 
    error: error instanceof Error ? error.message : String(error) 
  });
  // Mesmo com erro, tenta criar novamente
  emailQueue = null;
  useQueue = false;
  isRedisConnected = false;
}
} else {
  logger.info('Redis disabled (ENABLE_REDIS=false) - emails will be sent directly');
}

// Processador de jobs de email (apenas se a queue estiver disponível)
if (emailQueue) {
  emailQueue.process(async (job) => {
    const { to, subject, html, type } = job.data;
    
    try {
      logger.info('Processing email job', { 
        jobId: job.id, 
        type, 
        to,
        attempt: job.attemptsMade + 1 
      });

      await sendEmail(to, subject, html);
      
      logger.info('Email sent successfully', { 
        jobId: job.id, 
        type, 
        to 
      });
      
      return { success: true, sentAt: new Date().toISOString() };
    } catch (error) {
      logger.error('Failed to send email', { 
        jobId: job.id, 
        type, 
        to, 
        error: error instanceof Error ? error.message : String(error),
        attempt: job.attemptsMade + 1 
      });
      
      throw error; // Re-throw para que o Bull possa fazer retry
    }
  });
}

// Event listeners para monitoramento (apenas se a queue estiver disponível)
if (emailQueue) {
  emailQueue.on('completed', (job) => {
    logger.info('Email job completed', { 
      jobId: job.id, 
      type: job.data.type,
      duration: Date.now() - job.timestamp 
    });
  });

  emailQueue.on('failed', (job, err) => {
    logger.error('Email job failed', { 
      jobId: job.id, 
      type: job.data.type,
      error: err.message,
      attempts: job.attemptsMade 
    });
  });

  emailQueue.on('stalled', (job) => {
    logger.warn('Email job stalled', { 
      jobId: job.id, 
      type: job.data.type 
    });
  });
}

// Funções para adicionar jobs à queue ou enviar diretamente
export async function queueEmail(
  to: string, 
  subject: string, 
  html: string, 
  type: string = 'general',
  priority: 'low' | 'normal' | 'high' = 'normal',
  delay: number = 0
): Promise<Bull.Job | { success: boolean }> {
  // Sempre tentar usar Redis primeiro (sempre ativo)
  if (emailQueue) {
    // Tentar adicionar à queue do Redis
    const jobData = {
      to,
      subject,
      html,
      type,
      createdAt: new Date().toISOString(),
    };

    const jobOptions: Bull.JobOptions = {
      priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2,
    };

    if (delay > 0) {
      jobOptions.delay = delay;
    }

    try {
      // Tentar adicionar à queue (mesmo se não estiver conectado, o Bull tentará reconectar)
      const job = await emailQueue.add(jobData, jobOptions);
      
      logger.info('Email queued successfully in Redis', { 
        jobId: job.id, 
        type, 
        to, 
        priority,
        delay 
      });

      return job;
    } catch (error) {
      // Se falhar ao adicionar na queue (Redis não disponível), enviar diretamente
      logger.warn('Failed to queue email in Redis, sending directly', { 
        to, 
        subject, 
        type,
        error: error instanceof Error ? error.message : String(error) 
      });
      
      try {
        await sendEmail(to, subject, html);
        return { success: true };
      } catch (sendError) {
        logger.error('Failed to send email directly', { 
          to, 
          subject, 
          type,
          error: sendError instanceof Error ? sendError.message : String(sendError) 
        });
        throw sendError;
      }
    }
  } else {
    // Se não houver queue criada, enviar diretamente
    logger.info('Sending email directly (Redis queue not initialized)', { to, subject, type });
    try {
      await sendEmail(to, subject, html);
      return { success: true };
    } catch (error) {
      logger.error('Failed to send email directly', { 
        to, 
        subject, 
        type,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
}

// Funções específicas para tipos de email
export async function queueWelcomeEmail(to: string, name: string): Promise<Bull.Job | { success: boolean }> {
  const subject = 'Bem-vindo ao nosso SaaS!';
  const html = `
    <h1>Olá, ${name}!</h1>
    <p>Bem-vindo ao nosso sistema SaaS. Estamos felizes em tê-lo conosco!</p>
    <p>Se você tiver alguma dúvida, não hesite em nos contatar.</p>
  `;
  
  return queueEmail(to, subject, html, 'welcome', 'normal');
}

export async function queueConfirmationEmail(
  to: string, 
  name: string, 
  confirmationToken: string
): Promise<Bull.Job | { success: boolean }> {
  const subject = 'Confirme seu cadastro - Ative sua conta';
  const confirmUrl = `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3001'}/auth/confirm?token=${confirmationToken}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #16a34a; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bem-vindo, ${name}!</h1>
        </div>
        <div class="content">
          <p>Obrigado por se cadastrar em nossa plataforma!</p>
          <p>Para ativar sua conta e começar a usar nossos serviços, clique no botão abaixo:</p>
          <div style="text-align: center;">
            <a href="${confirmUrl}" class="button">Confirmar Email</a>
          </div>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #06b6d4;">${confirmUrl}</p>
          <div class="warning">
            <strong>⚠️ Importante:</strong> Este link expira em 1 hora. Se não conseguir confirmar agora, você pode solicitar um novo email de confirmação.
          </div>
          <p>Se você não se cadastrou nesta plataforma, pode ignorar este email com segurança.</p>
        </div>
        <div class="footer">
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return queueEmail(to, subject, html, 'confirmation', 'high');
}

export async function queuePasswordResetEmail(
  to: string, 
  name: string, 
  resetToken: string
): Promise<Bull.Job | { success: boolean }> {
  const subject = 'Redefinição de senha';
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
  const html = `
    <p>Olá, ${name}!</p>
    <p>Você solicitou a redefinição de sua senha. Clique no link abaixo:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>Este link expira em 1 hora.</p>
    <p>Se você não solicitou esta redefinição, ignore este email.</p>
  `;
  
  return queueEmail(to, subject, html, 'password-reset', 'high');
}

export async function queueNotificationEmail(
  to: string, 
  subject: string, 
  message: string
): Promise<Bull.Job | { success: boolean }> {
  const html = `
    <h2>${subject}</h2>
    <p>${message}</p>
  `;
  
  return queueEmail(to, subject, html, 'notification', 'low');
}

// Funções de monitoramento e estatísticas
export async function getQueueStats() {
  if (!emailQueue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      total: 0,
      queueAvailable: false,
    };
  }

  try {
    const [waiting, active, completed, failed] = await Promise.all([
      emailQueue.getWaiting(),
      emailQueue.getActive(),
      emailQueue.getCompleted(),
      emailQueue.getFailed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,
      queueAvailable: true,
    };
  } catch (error) {
    logger.error('Failed to get queue stats', { error });
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      total: 0,
      queueAvailable: false,
    };
  }
}

export async function getQueueHealth(): Promise<boolean> {
  if (!emailQueue) {
    return true; // Se não há queue, considerar saudável (enviando diretamente)
  }

  try {
    const stats = await getQueueStats();
    const isHealthy = stats.failed < 10; // Considera saudável se menos de 10 jobs falharam
    
    logger.info('Email queue health check', { stats, isHealthy });
    return isHealthy;
  } catch (error) {
    logger.error('Email queue health check failed', { error });
    return false;
  }
}

// Função para limpar jobs antigos
export async function cleanOldJobs(): Promise<void> {
  if (!emailQueue) return;

  try {
    const completedCount = await emailQueue.clean(24 * 60 * 60 * 1000, 'completed'); // 24 horas
    const failedCount = await emailQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // 7 dias
    
    logger.info('Cleaned old email jobs', { completedCount, failedCount });
  } catch (error) {
    logger.error('Failed to clean old email jobs', { error });
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (emailQueue) {
    await emailQueue.close();
    logger.info('Email queue closed gracefully');
  }
});

process.on('SIGINT', async () => {
  if (emailQueue) {
    await emailQueue.close();
    logger.info('Email queue closed gracefully');
  }
});

export { emailQueue }; 