import Redis from 'ioredis';
import logger from '../config/logger';

class CacheService {
  private redis?: Redis;
  private isConnected: boolean = false;
  private lastWarnTs: number = 0;

  constructor() {
    // Tornar Redis opcional - se não estiver disponível, o sistema continua funcionando
    const enableRedis = process.env.ENABLE_REDIS !== 'false';
    
    if (enableRedis) {
      // Suporta REDIS_URL (para serviços cloud) ou configuração individual
      let redisOptions: any;
      
      if (process.env.REDIS_URL) {
        // Se REDIS_URL for fornecido, usar diretamente (mais fácil para serviços cloud)
        redisOptions = process.env.REDIS_URL;
        logger.info('Using Redis URL for connection');
      } else {
        // Configuração individual (host, port, password)
        redisOptions = {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD,
          tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
          maxRetriesPerRequest: null, // null = infinitas tentativas, mas não bloqueia
          retryStrategy: (times: number) => {
            if (times > 10) {
              logger.warn('Redis max reconnection attempts reached, disabling Redis');
              this.isConnected = false;
              return null; // Para de tentar após 10 tentativas
            }
            const delay = Math.min(times * 200, 2000); // Delay progressivo até 2s
            return delay;
          },
          lazyConnect: true,
          keepAlive: 30000,
          connectTimeout: 10000,
          commandTimeout: 5000,
          enableReadyCheck: true,
          enableOfflineQueue: false, // Desabilitar fila offline para evitar acúmulo de erros
          showFriendlyErrorStack: true,
        };
        
        logger.info(`Connecting to Redis at ${redisOptions.host}:${redisOptions.port}${redisOptions.tls ? ' (TLS enabled)' : ''}`);
      }

      this.redis = new Redis(redisOptions);
      this.setupEventHandlers();
    } else {
      logger.info('Redis disabled - running without cache');
    }
  }

  private setupEventHandlers() {
    if (!this.redis) return;
    
    this.redis.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected successfully');
    });

    this.redis.on('error', (error: Error) => {
      this.isConnected = false;
      // Não logar como erro crítico se for apenas problema de conexão
      // O sistema deve continuar funcionando sem Redis
      const now = Date.now();
      if (now - this.lastWarnTs > 30000) { // 30s debounce para erros
        logger.warn('Redis connection error (non-critical):', error.message);
        this.lastWarnTs = now;
      }
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      const now = Date.now();
      if (now - this.lastWarnTs > 10000) { // 10s debounce
        logger.info('Redis not connected, skipping cache get', { sampleKey: key });
        this.lastWarnTs = now;
      }
      return null;
    }

    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Error getting cache key:', key, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (!this.isConnected || !this.redis) {
      const now = Date.now();
      if (now - this.lastWarnTs > 10000) {
        logger.info('Redis not connected, skipping cache set');
        this.lastWarnTs = now;
      }
      return;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
    } catch (error) {
      logger.error('Error setting cache key:', key, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.redis) {
      const now = Date.now();
      if (now - this.lastWarnTs > 10000) {
        logger.info('Redis not connected, skipping cache delete', { sampleKey: key });
        this.lastWarnTs = now;
      }
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Error deleting cache key:', key, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.redis) {
      const now = Date.now();
      if (now - this.lastWarnTs > 10000) {
        logger.info('Redis not connected, skipping cache pattern delete', { pattern });
        this.lastWarnTs = now;
      }
      return;
    }

    try {
      let cursor = '0';
      let total = 0;
      do {
        const result = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 500);
        cursor = result[0];
        const batchKeys = result[1] as string[];
        if (batchKeys.length > 0) {
          // Use pipeline para deletar em lote
          const pipeline = this.redis.pipeline();
          for (const k of batchKeys) pipeline.del(k);
          await pipeline.exec();
          total += batchKeys.length;
        }
      } while (cursor !== '0');

      if (total > 0) {
        logger.info(`Deleted ${total} cache keys matching pattern via SCAN: ${pattern}`);
      }
    } catch (error) {
      logger.error('Error deleting cache pattern via SCAN:', pattern, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) return false;

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Error checking cache key existence:', key, error);
      return false;
    }
  }

  async increment(key: string, ttl: number = 3600): Promise<number> {
    if (!this.isConnected || !this.redis) return 0;

    try {
      const result = await this.redis.incr(key);
      // Set TTL if this is the first increment
      if (result === 1) {
        await this.redis.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error('Error incrementing cache key:', key, error);
      return 0;
    }
  }

  async getTTL(key: string): Promise<number> {
    if (!this.isConnected || !this.redis) return -1;

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Error getting TTL for key:', key, error);
      return -1;
    }
  }

  // Métodos específicos para o domínio da aplicação
  async getUserStats(userId: string): Promise<any | null> {
    return this.get(`user:stats:${userId}`);
  }

  async setUserStats(userId: string, stats: any, ttl: number = 300): Promise<void> {
    await this.set(`user:stats:${userId}`, stats, ttl);
  }

  async getUserHistory(userId: string, limit: number, offset: number): Promise<any | null> {
    return this.get(`user:history:${userId}:${limit}:${offset}`);
  }

  async setUserHistory(userId: string, limit: number, offset: number, history: any, ttl: number = 180): Promise<void> {
    await this.set(`user:history:${userId}:${limit}:${offset}`, history, ttl);
  }

  async getSystemMetrics(): Promise<any | null> {
    return this.get('system:metrics');
  }

  async setSystemMetrics(metrics: any, ttl: number = 600): Promise<void> {
    await this.set('system:metrics', metrics, ttl);
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.delPattern(`user:*:${userId}*`);
  }

  async invalidateSystemCache(): Promise<void> {
    await this.delPattern('system:*');
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    if (!this.redis) return false;
    
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      logger.info('Redis disconnected gracefully');
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await cacheService.disconnect();
});

process.on('SIGINT', async () => {
  await cacheService.disconnect();
});

export default cacheService; 