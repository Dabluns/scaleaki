import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Adiciona parâmetros de pool à URL do banco de dados se não estiverem presentes
 */
function ensurePoolParams(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    
    // Parâmetros recomendados para evitar erros de conexão
    const poolParams = {
      connection_limit: '10',           // Limite de conexões simultâneas
      pool_timeout: '20',                // Timeout para obter conexão do pool (segundos)
      connect_timeout: '10',             // Timeout para estabelecer conexão (segundos)
      schema: 'public',                  // Schema padrão
    };

    // Adicionar parâmetros se não existirem
    Object.entries(poolParams).forEach(([key, value]) => {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  } catch (error) {
    // Se não for uma URL válida, retornar original
    console.warn('Não foi possível processar DATABASE_URL, usando original');
    return databaseUrl;
  }
}

// Singleton do PrismaClient para evitar múltiplas instâncias
class DatabaseManager {
  private static instance: PrismaClient;
  private static heartbeatInterval: NodeJS.Timeout | null = null;

  public static getInstance(): PrismaClient {
    if (!DatabaseManager.instance) {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL não está definida nas variáveis de ambiente');
      }

      // Garantir que a URL tenha parâmetros de pool
      const optimizedUrl = ensurePoolParams(databaseUrl);

      DatabaseManager.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'pretty',
        datasources: {
          db: {
            url: optimizedUrl,
          },
        },
      });

      // Configurar heartbeat para manter conexões vivas
      // Isso ajuda a evitar que o servidor PostgreSQL feche conexões inativas
      DatabaseManager.heartbeatInterval = setInterval(async () => {
        try {
          await DatabaseManager.instance.$queryRaw`SELECT 1`;
        } catch (error) {
          // Ignorar erros silenciosamente - apenas manter conexão viva
        }
      }, 30000); // A cada 30 segundos

      // Configurar graceful shutdown
      process.on('beforeExit', async () => {
        await DatabaseManager.instance.$disconnect();
      });

      process.on('SIGINT', async () => {
        await DatabaseManager.instance.$disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await DatabaseManager.instance.$disconnect();
        process.exit(0);
      });
    }

    return DatabaseManager.instance;
  }

  public static async disconnect(): Promise<void> {
    // Limpar heartbeat
    if (DatabaseManager.heartbeatInterval) {
      clearInterval(DatabaseManager.heartbeatInterval);
      DatabaseManager.heartbeatInterval = null;
    }
    
    if (DatabaseManager.instance) {
      await DatabaseManager.instance.$disconnect();
    }
  }
}

// Para desenvolvimento com hot reload
if (process.env.NODE_ENV === 'development') {
  if (!global.__prisma) {
    global.__prisma = DatabaseManager.getInstance();
  }
}

// Exportar sempre via ESM default
const prisma = process.env.NODE_ENV === 'development' && global.__prisma
  ? (global.__prisma as PrismaClient)
  : DatabaseManager.getInstance();

export default prisma;