export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB) || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  // Configurações de cluster (se necessário)
  enableReadyCheck: true,
  maxLoadingTimeout: 10000,
  // Configurações de SSL (se necessário)
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
};

export const cacheConfig = {
  // TTL padrão para diferentes tipos de dados
  defaultTTL: 3600, // 1 hora
  userStatsTTL: 300, // 5 minutos
  userHistoryTTL: 180, // 3 minutos
  systemMetricsTTL: 600, // 10 minutos
  queryCacheTTL: 300, // 5 minutos
  paginationTTL: 120, // 2 minutos
  
  // Prefixos para diferentes tipos de cache
  prefixes: {
    user: 'user:',
    system: 'system:',
    query: 'query:',
    rateLimit: 'rate_limit:',
    session: 'session:',
  },
};

export const queueConfig = {
  // Configurações da queue de emails
  emailQueue: {
    name: 'email-queue',
    concurrency: Number(process.env.EMAIL_QUEUE_CONCURRENCY) || 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  
  // Configurações de rate limiting
  rateLimiting: {
    auth: { windowMs: 15 * 60 * 1000, max: 5 },
    register: { windowMs: 60 * 60 * 1000, max: 3 },
    user: { windowMs: 15 * 60 * 1000, max: 100 },
    admin: { windowMs: 15 * 60 * 1000, max: 200 },
    query: { windowMs: 60 * 1000, max: 30 },
  },
}; 