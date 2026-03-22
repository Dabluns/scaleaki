import prisma from '../config/database';
import cacheService from './cacheService';
import {
  Oferta,
  CreateOfertaInput,
  UpdateOfertaInput,
  OfertasFilters,
  OfertasSortOptions,
  OfertasResponse,
  PlataformaAnuncio,
  TipoOferta,
  StatusOferta,
  MetricasOferta
} from '../types/oferta';
import logger from '../config/logger';

// Cache TTL em segundos
const CACHE_TTL = {
  OFERTAS_LIST: 300, // 5 minutos
  OFERTA_DETAIL: 600, // 10 minutos
  OFERTAS_DESTAQUE: 180, // 3 minutos
  ESTATISTICAS: 300, // 5 minutos
  NICHOS: 1800, // 30 minutos
};

// Parse seguro para JSON: apenas tenta quando parece JSON e não lança erro
function safeJsonParse<T = any>(value: unknown): T | unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');
  if (!looksLikeJson) return value;
  try {
    return JSON.parse(trimmed) as T;
  } catch (err) {
    logger.warn('Safe JSON parse failed', {
      error: err instanceof Error ? err.message : String(err)
    });
    return value;
  }
}

// Função helper otimizada para processar dados do Prisma
function processPrismaOferta(oferta: any): Oferta {
  try {
    // Parse lazy: apenas para detalhe ou quando campos existirem e aparentarem JSON
    const links = typeof oferta.links === 'string' && (oferta.links.trim().startsWith('[') || oferta.links.trim().startsWith('{'))
      ? safeJsonParse(oferta.links) : oferta.links;
    const tags = typeof oferta.tags === 'string' && oferta.tags.trim().startsWith('[')
      ? safeJsonParse(oferta.tags) : oferta.tags;
    const metricas = typeof oferta.metricas === 'string' && (oferta.metricas.trim().startsWith('{') || oferta.metricas.trim().startsWith('['))
      ? safeJsonParse(oferta.metricas) : oferta.metricas;

    return {
      ...oferta,
      links,
      tags,
      metricas,
      createdAt: oferta.createdAt,
      updatedAt: oferta.updatedAt
    } as Oferta;
  } catch (error) {
    logger.error('Error processing oferta data', { ofertaId: oferta.id, error: error instanceof Error ? error.message : String(error) });
    // Retornar dados sem processar em caso de erro
    return {
      ...oferta,
      links: oferta.links,
      tags: oferta.tags,
      metricas: oferta.metricas,
      createdAt: oferta.createdAt,
      updatedAt: oferta.updatedAt
    } as Oferta;
  }
}

// Função helper para gerar chaves de cache
function getCacheKey(prefix: string, params: any = {}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join(':');
  return `${prefix}:${sortedParams}`;
}

// Função helper para invalidar cache de ofertas (granular)
async function invalidateOfertaCache(context?: {
  ofertaId?: string;
  nichoId?: string;
}): Promise<void> {
  try {
    const tasks: Array<Promise<any>> = [];
    // Detalhe da oferta
    if (context?.ofertaId) {
      tasks.push(cacheService.del(getCacheKey('oferta', { id: context.ofertaId })));
    }
    // Listas por nicho
    if (context?.nichoId) {
      tasks.push(cacheService.delPattern(`ofertas:nicho:${context.nichoId}:*`));
    }
    // Listas genéricas e destaques/estatísticas (curtas)
    tasks.push(cacheService.delPattern('ofertas:list:*'));
    tasks.push(cacheService.delPattern('ofertas:destaque:*'));
    tasks.push(cacheService.delPattern('ofertas:reels:*'));
    tasks.push(cacheService.del('estatisticas:ofertas'));
    // Métricas agregadas (cache por minuto)
    tasks.push(cacheService.delPattern('ofertas:metricas:*'));

    await Promise.all(tasks);
    logger.info('Oferta cache invalidated successfully');
  } catch (error) {
    logger.error('Error invalidating oferta cache', { error: error instanceof Error ? error.message : String(error) });
  }
}

export async function getAllOfertas(limit = 10, offset = 0, filters: any = {}, sortOptions?: OfertasSortOptions) {
  const cacheKey = getCacheKey('ofertas:list', { limit, offset, ...filters, ...(sortOptions || {}) });

  try {
    // Tentar cache primeiro
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for getAllOfertas');
      return cached;
    }

    // Construir where clause baseado nos filtros
    const where: any = { isActive: true };

    if (filters.plataforma) {
      const plat = (filters.plataforma as unknown as string);
      if (plat === 'meta_ads') {
        where.plataforma = { in: ['facebook_ads', 'instagram_ads'] } as any;
      } else {
        where.plataforma = filters.plataforma;
      }
    }
    if (filters.tipoOferta) where.tipoOferta = filters.tipoOferta;
    if (filters.status) where.status = filters.status;
    if (filters.nichoId) where.nichoId = filters.nichoId;
    if (filters.linguagem) where.linguagem = filters.linguagem;
    if (filters.search) {
      const searchTerms = filters.search.trim().split(/\s+/);
      if (searchTerms.length > 1) {
        // Busca avançada: todos os termos devem estar presentes (AND)
        where.AND = searchTerms.map((term: string) => ({
          OR: [
            { titulo: { contains: term, mode: 'insensitive' } },
            { texto: { contains: term, mode: 'insensitive' } }
          ]
        }));
      } else {
        // Busca simples: termo único
        where.OR = [
          { titulo: { contains: filters.search, mode: 'insensitive' } },
          { texto: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
    }

    // Query otimizada com select específico
    const ofertas = await prisma.oferta.findMany({
      where,
      select: {
        id: true,
        titulo: true,
        imagem: true,
        texto: true,
        nichoId: true,
        plataforma: true,
        tipoOferta: true,
        status: true,
        linguagem: true,
        links: true,
        tags: true,
        vsl: true,
        vslDescricao: true,
        receita: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Incluir apenas dados essenciais do nicho
        nicho: {
          select: {
            id: true,
            nome: true,
            icone: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: sortOptions ? { [sortOptions.field]: sortOptions.order } : { createdAt: 'desc' }
    });

    // Contar total para paginação
    const total = await prisma.oferta.count({ where });

    const result = {
      data: ofertas.map(processPrismaOferta),
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: offset > 0
      }
    };

    // Salvar no cache
    await cacheService.set(cacheKey, result, CACHE_TTL.OFERTAS_LIST);

    return result;
  } catch (error) {
    logger.error('Error fetching all ofertas', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar ofertas');
  }
}

export async function getOfertasByNicho(nichoId: string, limit = 10, offset = 0) {
  const cacheKey = getCacheKey(`ofertas:nicho:${nichoId}`, { limit, offset });

  try {
    // Tentar cache primeiro
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for getOfertasByNicho');
      return cached;
    }

    // Query otimizada com select específico
    const ofertas = await prisma.oferta.findMany({
      where: {
        nichoId,
        isActive: true
      },
      select: {
        id: true,
        titulo: true,
        imagem: true,
        texto: true,
        nichoId: true,
        plataforma: true,
        tipoOferta: true,
        status: true,
        linguagem: true,
        links: true,
        tags: true,
        vsl: true,
        vslDescricao: true,
        receita: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        nicho: {
          select: {
            id: true,
            nome: true,
            icone: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    });

    // Contar total para paginação
    const total = await prisma.oferta.count({
      where: { nichoId, isActive: true }
    });

    const result = {
      data: ofertas.map(processPrismaOferta),
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: offset > 0
      }
    };

    // Salvar no cache
    await cacheService.set(cacheKey, result, CACHE_TTL.OFERTAS_LIST);

    return result;
  } catch (error) {
    logger.error('Error fetching ofertas by nicho', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar ofertas do nicho');
  }
}

export async function getOfertaById(id: string) {
  const cacheKey = getCacheKey('oferta', { id });

  try {
    // Tentar cache primeiro
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for getOfertaById');
      return cached;
    }

    // Query otimizada com select específico
    const oferta = await prisma.oferta.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        imagem: true,
        texto: true,
        nichoId: true,
        plataforma: true,
        tipoOferta: true,
        status: true,
        tags: true,
        linguagem: true,
        links: true,
        metricas: true,
        vsl: true,
        vslDescricao: true,
        receita: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        nicho: {
          select: {
            id: true,
            nome: true,
            icone: true,
            descricao: true
          }
        }
      }
    });

    if (!oferta) {
      throw new Error('Oferta não encontrada');
    }

    const result = processPrismaOferta(oferta);

    // Salvar no cache
    await cacheService.set(cacheKey, result, CACHE_TTL.OFERTA_DETAIL);

    return result;
  } catch (error) {
    logger.error('Error fetching oferta by id', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar oferta');
  }
}

export async function createOferta(data: CreateOfertaInput): Promise<Oferta> {
  try {
    // Verificar se o nicho existe
    const nicho = await prisma.nicho.findUnique({
      where: { id: data.nichoId }
    });

    if (!nicho) {
      throw new Error('Nicho não encontrado');
    }

    const oferta = await prisma.oferta.create({
      data: {
        titulo: data.titulo,
        imagem: data.imagem,
        texto: data.texto,
        nichoId: data.nichoId,
        plataforma: data.plataforma || 'facebook_ads',
        tipoOferta: data.tipoOferta || 'ecommerce',
        status: data.status || 'ativa',
        tags: data.tags ? JSON.stringify(data.tags) : null,
        linguagem: data.linguagem || 'pt_BR',
        links: JSON.stringify(data.links),
        metricas: data.metricas ? JSON.stringify(data.metricas) : null,
        vsl: data.vsl,
        vslDescricao: data.vslDescricao,
        receita: data.receita
      },
      include: { nicho: true }
    });

    // Invalidar cache relacionado
    await invalidateOfertaCache({ ofertaId: oferta.id, nichoId: oferta.nichoId });

    logger.info('Oferta created successfully', { ofertaId: oferta.id, titulo: oferta.titulo });

    return processPrismaOferta(oferta);
  } catch (error) {
    logger.error('Error creating oferta', { data, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function updateOferta(id: string, data: UpdateOfertaInput): Promise<Oferta> {
  try {
    // Verificar se a oferta existe
    const existingOferta = await prisma.oferta.findUnique({
      where: { id }
    });

    if (!existingOferta) {
      throw new Error('Oferta não encontrada');
    }

    // Se estiver atualizando o nicho, verificar se existe
    if (data.nichoId && data.nichoId !== existingOferta.nichoId) {
      const nicho = await prisma.nicho.findUnique({
        where: { id: data.nichoId }
      });

      if (!nicho) {
        throw new Error('Nicho não encontrado');
      }
    }

    // Deletar arquivos antigos do Supabase Storage se foram substituídos
    const filesToDelete: Array<{ bucket: string; path: string }> = [];

    // Se a imagem foi substituída (nova URL diferente da antiga)
    if (data.imagem && data.imagem !== existingOferta.imagem && existingOferta.imagem) {
      const oldImagePath = extractSupabaseStoragePath(existingOferta.imagem);
      if (oldImagePath) {
        filesToDelete.push(oldImagePath);
        logger.info('Imagem antiga marcada para exclusão', {
          oldUrl: existingOferta.imagem,
          newUrl: data.imagem
        });
      }
    }

    // Se a imagem foi removida (data.imagem é null ou vazio e existia antes)
    if ((data.imagem === null || data.imagem === '') && existingOferta.imagem) {
      const oldImagePath = extractSupabaseStoragePath(existingOferta.imagem);
      if (oldImagePath) {
        filesToDelete.push(oldImagePath);
        logger.info('Imagem antiga marcada para exclusão (removida)', {
          oldUrl: existingOferta.imagem
        });
      }
    }

    // Se o VSL foi substituído
    if (data.vsl && data.vsl !== existingOferta.vsl && existingOferta.vsl) {
      const oldVslPath = extractSupabaseStoragePath(existingOferta.vsl);
      if (oldVslPath) {
        filesToDelete.push(oldVslPath);
        logger.info('VSL antigo marcado para exclusão', {
          oldUrl: existingOferta.vsl,
          newUrl: data.vsl
        });
      }
    }

    // Se o VSL foi removido
    if ((data.vsl === null || data.vsl === '') && existingOferta.vsl) {
      const oldVslPath = extractSupabaseStoragePath(existingOferta.vsl);
      if (oldVslPath) {
        filesToDelete.push(oldVslPath);
        logger.info('VSL antigo marcado para exclusão (removido)', {
          oldUrl: existingOferta.vsl
        });
      }
    }

    // Comparar arrays de links para detectar imagens removidas
    if (data.links) {
      try {
        // Parse dos links antigos e novos
        const oldLinks: string[] = typeof existingOferta.links === 'string'
          ? JSON.parse(existingOferta.links)
          : (Array.isArray(existingOferta.links) ? existingOferta.links : []);

        const newLinks: string[] = Array.isArray(data.links) ? data.links : [];

        // Encontrar links que existiam antes mas não existem mais
        const removedLinks = oldLinks.filter(oldLink =>
          oldLink &&
          typeof oldLink === 'string' &&
          oldLink.trim() !== '' &&
          !newLinks.includes(oldLink)
        );

        // Marcar cada link removido para exclusão
        removedLinks.forEach(removedLink => {
          const linkPath = extractSupabaseStoragePath(removedLink);
          if (linkPath) {
            filesToDelete.push(linkPath);
            logger.info('Link/imagem adicional marcada para exclusão', {
              oldUrl: removedLink
            });
          }
        });

        if (removedLinks.length > 0) {
          logger.info('Links removidos detectados', {
            total: removedLinks.length,
            oldLinksCount: oldLinks.length,
            newLinksCount: newLinks.length
          });
        }
      } catch (err) {
        logger.warn('Erro ao comparar arrays de links', {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    // Deletar arquivos antigos do storage (em paralelo)
    if (filesToDelete.length > 0) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        // Usar SERVICE_ROLE_KEY para deletar (tem permissões administrativas)
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
          const deletePromises = filesToDelete.map(async ({ bucket, path }) => {
            try {
              const response = await fetch(
                `${supabaseUrl}/storage/v1/object/${bucket}/${path}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey
                  }
                }
              );

              if (response.ok) {
                logger.info('Arquivo antigo deletado do storage', { bucket, path });
              } else {
                const errorText = await response.text().catch(() => 'Unknown error');
                logger.warn('Falha ao deletar arquivo antigo do storage', {
                  bucket,
                  path,
                  status: response.status,
                  error: errorText
                });
              }
            } catch (err) {
              logger.warn('Erro ao deletar arquivo antigo do storage', {
                bucket,
                path,
                error: err instanceof Error ? err.message : String(err)
              });
            }
          });

          await Promise.allSettled(deletePromises);
        } else {
          logger.warn('Credenciais do Supabase não configuradas, pulando exclusão de arquivos antigos');
        }
      } catch (err) {
        logger.error('Erro durante limpeza de arquivos antigos', {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    const updateData: any = { ...data };
    if (data.links) {
      updateData.links = JSON.stringify(data.links);
    }
    if (data.metricas && typeof data.metricas !== 'string') {
      try {
        updateData.metricas = JSON.stringify(data.metricas);
      } catch {
        // fallback: remove metricas se não serializável
        delete updateData.metricas;
      }
    }

    const oferta = await prisma.oferta.update({
      where: { id },
      data: updateData,
      include: { nicho: true }
    });

    // Invalidar cache relacionado
    const prevNichoId = existingOferta.nichoId;
    await invalidateOfertaCache({ ofertaId: oferta.id, nichoId: data.nichoId || prevNichoId });

    logger.info('Oferta updated successfully', {
      ofertaId: oferta.id,
      titulo: oferta.titulo,
      filesDeleted: filesToDelete.length
    });

    return processPrismaOferta(oferta);
  } catch (error) {
    logger.error('Error updating oferta', { id, data, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// Helper para extrair bucket e path de URL do Supabase Storage
function extractSupabaseStoragePath(url: string | null): { bucket: string; path: string } | null {
  if (!url) return null;

  try {
    // URL formato: https://xxxxx.supabase.co/storage/v1/object/public/BUCKET/PATH
    const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
    if (match) {
      return {
        bucket: match[1],
        path: match[2]
      };
    }
  } catch (error) {
    logger.warn('Failed to extract storage path from URL', { url });
  }
  return null;
}

export async function deleteOferta(id: string): Promise<void> {
  try {
    // Verificar se a oferta existe
    const existingOferta = await prisma.oferta.findUnique({
      where: { id }
    });

    if (!existingOferta) {
      throw new Error('Oferta não encontrada');
    }

    // Deletar arquivos do Supabase Storage (se existirem)
    const filesToDelete: Array<{ bucket: string; path: string }> = [];

    // Imagem
    if (existingOferta.imagem) {
      const imagePath = extractSupabaseStoragePath(existingOferta.imagem);
      if (imagePath) filesToDelete.push(imagePath);
    }

    // VSL
    if (existingOferta.vsl) {
      const vslPath = extractSupabaseStoragePath(existingOferta.vsl);
      if (vslPath) filesToDelete.push(vslPath);
    }

    // Deletar arquivos do storage (em paralelo)
    if (filesToDelete.length > 0) {
      try {
        // Usar API do Supabase via HTTP
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        // Usar SERVICE_ROLE_KEY para deletar (tem permissões administrativas)
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
          const deletePromises = filesToDelete.map(async ({ bucket, path }) => {
            try {
              const response = await fetch(
                `${supabaseUrl}/storage/v1/object/${bucket}/${path}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey
                  }
                }
              );

              if (response.ok) {
                logger.info('File deleted from storage', { bucket, path });
              } else {
                const errorText = await response.text().catch(() => 'Unknown error');
                logger.warn('Failed to delete file from storage', {
                  bucket,
                  path,
                  status: response.status,
                  error: errorText
                });
              }
            } catch (err) {
              logger.warn('Error deleting file from storage', {
                bucket,
                path,
                error: err instanceof Error ? err.message : String(err)
              });
            }
          });

          await Promise.allSettled(deletePromises);
        } else {
          logger.warn('Supabase credentials not configured, skipping storage deletion');
        }
      } catch (err) {
        logger.error('Error during storage cleanup', {
          error: err instanceof Error ? err.message : String(err)
        });
        // Continua com a exclusão do banco mesmo se falhar no storage
      }
    }

    // Deletar oferta do banco de dados
    await prisma.oferta.delete({
      where: { id }
    });

    // Invalidar cache relacionado
    await invalidateOfertaCache({ ofertaId: id, nichoId: existingOferta.nichoId });

    logger.info('Oferta deleted successfully', { ofertaId: id, filesDeleted: filesToDelete.length });
  } catch (error) {
    logger.error('Error deleting oferta', { id, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function deactivateOferta(id: string): Promise<Oferta> {
  try {
    const oferta = await prisma.oferta.update({
      where: { id },
      data: { isActive: false },
      include: { nicho: true }
    });

    logger.info('Oferta deactivated successfully', { ofertaId: oferta.id, titulo: oferta.titulo });

    return processPrismaOferta(oferta);
  } catch (error) {
    logger.error('Error deactivating oferta', { id, error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao desativar oferta');
  }
}

// ===== NOVOS MÉTODOS EXPANDIDOS =====

export async function getOfertasByPlataforma(plataforma: PlataformaAnuncio | 'meta_ads'): Promise<Oferta[]> {
  try {
    const where: any = { isActive: true };
    if ((plataforma as any) === 'meta_ads') {
      where.plataforma = { in: ['facebook_ads', 'instagram_ads'] } as any;
    } else {
      where.plataforma = plataforma;
    }
    const ofertas = await prisma.oferta.findMany({
      where,
      include: { nicho: true },
      orderBy: { createdAt: 'desc' }
    });

    return ofertas.map(oferta => processPrismaOferta(oferta));
  } catch (error) {
    logger.error('Error fetching ofertas by plataforma', { plataforma, error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar ofertas por plataforma');
  }
}

export async function getOfertasByTipo(tipo: TipoOferta): Promise<Oferta[]> {
  try {
    const ofertas = await prisma.oferta.findMany({
      where: {
        tipoOferta: tipo,
        isActive: true
      },
      include: { nicho: true },
      orderBy: { createdAt: 'desc' }
    });

    return ofertas.map(oferta => processPrismaOferta(oferta));
  } catch (error) {
    logger.error('Error fetching ofertas by tipo', { tipo, error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar ofertas por tipo');
  }
}

export async function getOfertasByStatus(status: StatusOferta): Promise<Oferta[]> {
  try {
    const ofertas = await prisma.oferta.findMany({
      where: {
        status,
        isActive: true
      },
      include: { nicho: true },
      orderBy: { createdAt: 'desc' }
    });

    return ofertas.map(oferta => processPrismaOferta(oferta));
  } catch (error) {
    logger.error('Error fetching ofertas by status', { status, error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar ofertas por status');
  }
}

export async function getOfertasComMetricas(params: {
  page: number;
  limit: number;
  filters: OfertasFilters;
  sortOptions: OfertasSortOptions;
}): Promise<OfertasResponse> {
  const cacheKey = getCacheKey('ofertas:metricas', { ...params, timestamp: Math.floor(Date.now() / 60000) }); // Cache por minuto

  try {
    // Tentar cache primeiro
    const cached = await cacheService.get<OfertasResponse>(cacheKey);
    if (cached) {
      logger.info('Cache hit for getOfertasComMetricas', { page: params.page, limit: params.limit });
      return cached;
    }

    const { page, limit, filters, sortOptions } = params;
    const skip = (page - 1) * limit;

    // Construir where clause otimizada
    const whereClause: any = { isActive: true };

    if (filters.plataforma) {
      const plat = (filters.plataforma as unknown as string);
      if (plat === 'meta_ads') {
        whereClause.plataforma = { in: ['facebook_ads', 'instagram_ads'] } as any;
      } else {
        whereClause.plataforma = filters.plataforma;
      }
    }
    if (filters.tipoOferta) whereClause.tipoOferta = filters.tipoOferta;
    if (filters.nichoId) whereClause.nichoId = filters.nichoId;
    if (filters.linguagem) whereClause.linguagem = filters.linguagem;


    // Busca por texto
    if (filters.search) {
      const searchTerms = filters.search.trim().split(/\s+/);
      if (searchTerms.length > 1) {
        whereClause.AND = searchTerms.map((term: string) => ({
          OR: [
            { titulo: { contains: term, mode: 'insensitive' } },
            { texto: { contains: term, mode: 'insensitive' } }
          ]
        }));
      } else {
        whereClause.OR = [
          { titulo: { contains: filters.search, mode: 'insensitive' } },
          { texto: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
    }

    const [ofertas, total] = await Promise.all([
      prisma.oferta.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { [sortOptions.field]: sortOptions.order },
        include: { nicho: true }
      }),
      prisma.oferta.count({ where: whereClause })
    ]);

    const ofertasProcessadas = ofertas.map(oferta => processPrismaOferta(oferta));

    const result = {
      data: ofertasProcessadas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    // Salvar no cache
    await cacheService.set(cacheKey, result, CACHE_TTL.OFERTAS_LIST);

    return result;
  } catch (error) {
    logger.error('Error fetching ofertas com métricas', { params, error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar ofertas com métricas');
  }
}

export async function updateMetricasOferta(id: string, metricas: Partial<MetricasOferta>): Promise<Oferta> {
  try {
    const oferta = await prisma.oferta.update({
      where: { id },
      data: metricas,
      include: { nicho: true }
    });

    logger.info('Oferta metrics updated successfully', { ofertaId: oferta.id, metricas });

    return {
      ...oferta,
      links: safeJsonParse(oferta.links) as any,
      tags: oferta.tags ? (safeJsonParse(oferta.tags) as any) : undefined,
      metricas: oferta.metricas ? (safeJsonParse(oferta.metricas) as any) : undefined,
      createdAt: oferta.createdAt,
      updatedAt: oferta.updatedAt
    };
  } catch (error) {
    logger.error('Error updating oferta metrics', { id, metricas, error: error instanceof Error ? error.message : String(error) });
    throw new Error('Oferta não encontrada');
  }
}

export async function getOfertasDestaque(limit: number = 3): Promise<Oferta[]> {
  const cacheKey = getCacheKey('ofertas:destaque', { limit });

  try {
    // Tentar cache primeiro
    const cached = await cacheService.get<Oferta[]>(cacheKey);
    if (cached) {
      logger.info('Cache hit for getOfertasDestaque', { limit });
      return cached;
    }

    // Algoritmo baseado em visualizações reais
    // Buscar ofertas mais acessadas nos últimos 30 dias
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    // Agrupar visualizações por oferta e contar
    const visualizacoesPorOferta = await prisma.ofertaView.groupBy({
      by: ['ofertaId'],
      where: {
        viewedAt: {
          gte: trintaDiasAtras
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit * 2 // Buscar mais para ter opções caso algumas não estejam ativas
    });

    // Se não houver visualizações suficientes, buscar também por receita como fallback
    const ofertaIdsMaisAcessadas = visualizacoesPorOferta.map(v => v.ofertaId);

    let ofertas: any[] = [];

    if (ofertaIdsMaisAcessadas.length > 0) {
      // Buscar ofertas mais acessadas
      ofertas = await prisma.oferta.findMany({
        where: {
          id: { in: ofertaIdsMaisAcessadas },
          isActive: true,
          status: 'ativa'
        },
        include: {
          nicho: true,
          views: {
            where: {
              viewedAt: {
                gte: trintaDiasAtras
              }
            },
            select: {
              id: true
            }
          }
        }
      });

      // Ordenar pela ordem de visualizações
      const ordemVisualizacoes = new Map(
        visualizacoesPorOferta.map((v, index) => [v.ofertaId, index])
      );
      ofertas.sort((a, b) => {
        const ordemA = ordemVisualizacoes.get(a.id) ?? 999;
        const ordemB = ordemVisualizacoes.get(b.id) ?? 999;
        return ordemA - ordemB;
      });
    }

    // Se não tiver ofertas suficientes, completar com ofertas por receita
    if (ofertas.length < limit) {
      const ofertasAdicionais = await prisma.oferta.findMany({
        where: {
          isActive: true,
          status: 'ativa',
          id: {
            notIn: ofertaIdsMaisAcessadas
          }
        },
        include: { nicho: true },
        orderBy: [
          { receita: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit - ofertas.length
      });

      ofertas = [...ofertas, ...ofertasAdicionais];
    }

    const processedOfertas = ofertas.map(oferta => processPrismaOferta(oferta));

    // Limitar ao número solicitado (máximo 3)
    const finalOfertas = processedOfertas.slice(0, limit);

    // Salvar no cache
    await cacheService.set(cacheKey, finalOfertas, CACHE_TTL.OFERTAS_DESTAQUE);

    return finalOfertas;
  } catch (error) {
    logger.error('Error fetching ofertas destaque', { limit, error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar ofertas em destaque');
  }
}

export async function getOfertasParaReels(limit = 20, offset = 0) {
  const cacheKey = getCacheKey('ofertas:reels', { limit, offset });

  try {
    // Tentar cache primeiro
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for getOfertasParaReels', { limit, offset });
      return cached;
    }

    // Buscar apenas ofertas que possuem VSL e estão ativas
    const ofertas = await prisma.oferta.findMany({
      where: {
        isActive: true,
        status: 'ativa',
        AND: [
          { vsl: { not: null } },
          { vsl: { not: '' } }
        ]
      },
      select: {
        id: true,
        titulo: true,
        imagem: true,
        vsl: true,
        vslDescricao: true,
        nichoId: true,
        plataforma: true,
        tipoOferta: true,
        status: true,
        metricas: true,
        receita: true,
        createdAt: true,
        updatedAt: true,
        nicho: {
          select: {
            id: true,
            nome: true,
            icone: true,
            slug: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Contar total para paginação
    const total = await prisma.oferta.count({
      where: {
        isActive: true,
        status: 'ativa',
        AND: [
          { vsl: { not: null } },
          { vsl: { not: '' } }
        ]
      }
    });

    const processedOfertas = ofertas.map(processPrismaOferta);

    const result = {
      data: processedOfertas,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: offset > 0
      }
    };

    // Salvar no cache (TTL de 3 minutos, similar aos destaques)
    await cacheService.set(cacheKey, result, CACHE_TTL.OFERTAS_DESTAQUE);

    logger.info('Ofertas para reels fetched', {
      count: processedOfertas.length,
      total,
      limit,
      offset
    });

    return result;
  } catch (error) {
    logger.error('Error fetching ofertas para reels', {
      limit,
      offset,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error('Erro ao buscar ofertas para reels');
  }
}

export async function getEstatisticasOfertas() {
  const cacheKey = 'estatisticas:ofertas';

  try {
    // Tentar cache primeiro
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for getEstatisticasOfertas');
      return cached;
    }

    // Usar queries otimizadas com select específico
    const [totalOfertas, ofertasAtivas, estatisticas] = await Promise.all([
      prisma.oferta.count({
        where: { isActive: true }
      }),
      prisma.oferta.count({
        where: { isActive: true, status: 'ativa' }
      }),
      prisma.$queryRaw`
        SELECT 
          plataforma,
          tipoOferta,
          COUNT(*) as count,
          SUM(receita) as total_receita
        FROM Oferta 
        WHERE isActive = 1 
        GROUP BY plataforma, tipoOferta
      `
    ]);

    // Processar resultados
    const ofertasPorPlataforma: Record<string, number> = {};
    const ofertasPorTipo: Record<string, number> = {};
    let receitaTotal = 0;

    (estatisticas as any[]).forEach((item: any) => {
      ofertasPorPlataforma[item.plataforma] = (ofertasPorPlataforma[item.plataforma] || 0) + Number(item.count);
      ofertasPorTipo[item.tipoOferta] = (ofertasPorTipo[item.tipoOferta] || 0) + Number(item.count);

      receitaTotal += Number(item.total_receita) || 0;
    });

    const result = {
      totalOfertas,
      ofertasAtivas,
      ofertasPorPlataforma,
      ofertasPorTipo,
      receitaTotal,
      // Métricas adicionais calculadas
      taxaAtivacao: totalOfertas > 0 ? (ofertasAtivas / totalOfertas) * 100 : 0,
      receitaMedia: totalOfertas > 0 ? receitaTotal / totalOfertas : 0
    };

    // Salvar no cache
    await cacheService.set(cacheKey, result, CACHE_TTL.ESTATISTICAS);

    return result;
  } catch (error) {
    logger.error('Error fetching estatísticas ofertas', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar estatísticas das ofertas');
  }
}

// Algoritmo de recomendações inteligente baseado em histórico completo do usuário
export async function getRecommendationsForUser(userId: string, limit: number = 8): Promise<Oferta[]> {
  const cacheKey = getCacheKey('recs:user', { userId, limit });

  try {
    const cached = await cacheService.get<Oferta[]>(cacheKey);
    if (cached) {
      logger.info('Cache hit for user recommendations', { userId, limit });
      return cached;
    }

    // ===== FASE 1: COLETAR DADOS DO HISTÓRICO =====

    // 1. Favoritos (peso alto - indica interesse explícito)
    const favoritos = await prisma.favorito.findMany({
      where: { userId },
      include: { oferta: true },
      orderBy: { createdAt: 'desc' },
      take: 50 // Últimos 50 favoritos
    });

    // 2. Ofertas visitadas (devem ser excluídas das recomendações)
    const ofertasVisitadas = await prisma.ofertaView.findMany({
      where: { userId },
      select: { ofertaId: true },
      orderBy: { viewedAt: 'desc' }
    });
    const visitedIds = new Set(ofertasVisitadas.map(v => v.ofertaId));

    // 3. Preferências do usuário
    const userSettings = await prisma.userSettings.findUnique({ where: { userId } });

    // ===== FASE 2: ANÁLISE DE PADRÕES =====

    const favoriteIds = new Set<string>();
    const plataformaWeights: Record<string, number> = {};
    const tipoWeights: Record<string, number> = {};
    const nichoWeights: Record<string, number> = {};
    const linguagemWeights: Record<string, number> = {};

    // Analisar favoritos com pesos temporais (favoritos recentes têm mais peso)
    const now = Date.now();
    for (const fav of favoritos) {
      favoriteIds.add(fav.ofertaId);

      // Peso temporal: favoritos mais recentes têm mais influência
      const daysSinceFav = (now - new Date(fav.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const temporalWeight = Math.max(0.1, 1 - (daysSinceFav / 90)); // Decai em 90 dias

      if (fav.oferta) {
        const weight = 3.0 * temporalWeight; // Favoritos têm peso 3x maior

        if (fav.oferta.plataforma) {
          plataformaWeights[fav.oferta.plataforma] = (plataformaWeights[fav.oferta.plataforma] || 0) + weight;
        }
        if (fav.oferta.tipoOferta) {
          tipoWeights[fav.oferta.tipoOferta] = (tipoWeights[fav.oferta.tipoOferta] || 0) + weight;
        }
        if (fav.oferta.nichoId) {
          nichoWeights[fav.oferta.nichoId] = (nichoWeights[fav.oferta.nichoId] || 0) + weight;
        }
        if (fav.oferta.linguagem) {
          linguagemWeights[fav.oferta.linguagem] = (linguagemWeights[fav.oferta.linguagem] || 0) + weight;
        }
      }
    }

    // Mesclar com preferências explícitas do usuário (peso ainda maior)
    const prefPlats = userSettings?.preferredPlataformas ? JSON.parse(userSettings.preferredPlataformas) as string[] : [];
    const prefTipos = userSettings?.preferredTipoOferta ? JSON.parse(userSettings.preferredTipoOferta) as string[] : [];
    const prefNichos = userSettings?.favoriteNichos ? JSON.parse(userSettings.favoriteNichos) as string[] : [];
    const prefLanguages = userSettings?.preferredLanguages ? JSON.parse(userSettings.preferredLanguages) as string[] : [];

    // Adicionar peso extra para preferências explícitas
    prefPlats.forEach(p => { plataformaWeights[p] = (plataformaWeights[p] || 0) + 5.0; });
    prefTipos.forEach(t => { tipoWeights[t] = (tipoWeights[t] || 0) + 5.0; });
    prefNichos.forEach(n => { nichoWeights[n] = (nichoWeights[n] || 0) + 5.0; });
    prefLanguages.forEach(l => { linguagemWeights[l] = (linguagemWeights[l] || 0) + 5.0; });

    // ===== FASE 3: BUSCAR OFERTAS CANDIDATAS =====

    // Combinar IDs de ofertas a excluir (favoritas + visitadas)
    const excludedIds = new Set([...Array.from(favoriteIds), ...Array.from(visitedIds)]);

    // Buscar todas as ofertas ativas (exceto favoritas e visitadas)
    const allOfertas = await prisma.oferta.findMany({
      where: {
        isActive: true,
        status: 'ativa',
        id: excludedIds.size > 0 ? { notIn: Array.from(excludedIds) } : undefined
      },
      include: { nicho: true }
    });

    // ===== FASE 4: SISTEMA DE SCORING INTELIGENTE =====

    interface ScoredOferta {
      oferta: any;
      score: number;
    }

    const scoredOfertas: ScoredOferta[] = allOfertas.map(oferta => {
      let score = 0;

      // 1. Match com plataforma preferida (peso: 2.0)
      if (oferta.plataforma && plataformaWeights[oferta.plataforma]) {
        score += plataformaWeights[oferta.plataforma] * 2.0;
      }

      // 2. Match com tipo de oferta preferido (peso: 2.0)
      if (oferta.tipoOferta && tipoWeights[oferta.tipoOferta]) {
        score += tipoWeights[oferta.tipoOferta] * 2.0;
      }

      // 3. Match com nicho preferido (peso: 3.0 - nicho é muito importante)
      if (oferta.nichoId && nichoWeights[oferta.nichoId]) {
        score += nichoWeights[oferta.nichoId] * 3.0;
      }

      // 4. Match com linguagem preferida (peso: 1.5)
      if (oferta.linguagem && linguagemWeights[oferta.linguagem]) {
        score += linguagemWeights[oferta.linguagem] * 1.5;
      }

      // 5. Performance da oferta (peso: 1.0)
      // Ofertas com receita alta têm bonus
      if (oferta.receita) {
        const receitaScore = Math.min(oferta.receita / 10000, 5.0); // Normalizar até 5.0
        score += receitaScore * 1.0;
      }

      // 6. Novidade (peso: 0.5)
      // Ofertas mais recentes têm pequeno bonus
      const daysSinceCreation = (now - new Date(oferta.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const noveltyBonus = daysSinceCreation < 7 ? 2.0 : daysSinceCreation < 30 ? 1.0 : 0.5;
      score += noveltyBonus * 0.5;

      // 7. Diversidade: penalizar ofertas muito similares às já favoritadas
      // (já feito ao excluir favoritas)

      return { oferta, score };
    });

    // Ordenar por score e pegar as melhores
    scoredOfertas.sort((a, b) => b.score - a.score);

    // Se não há histórico suficiente, adicionar ofertas populares como fallback
    let selectedOfertas = scoredOfertas.slice(0, limit).map(s => s.oferta);

    if (selectedOfertas.length < limit) {
      // Completar com ofertas de alta performance (excluindo favoritas e visitadas)
      const highPerfOfertas = await prisma.oferta.findMany({
        where: {
          isActive: true,
          status: 'ativa',
          receita: { gte: 5000 }, // Receita mínima
          id: excludedIds.size > 0 ? { notIn: Array.from(excludedIds) } : undefined
        },
        include: { nicho: true },
        orderBy: { receita: 'desc' },
        take: limit - selectedOfertas.length
      });

      // Evitar duplicatas
      const selectedIds = new Set(selectedOfertas.map(o => o.id));
      const additional = highPerfOfertas.filter(o => !selectedIds.has(o.id));
      selectedOfertas = [...selectedOfertas, ...additional];
    }

    const processed = selectedOfertas.map(processPrismaOferta);

    // Cache curto (2 minutos) para recomendações dinâmicas
    await cacheService.set(cacheKey, processed, 120);

    logger.info('Recommendations generated', {
      userId,
      count: processed.length,
      hasHistory: favoritos.length > 0,
      visitedCount: visitedIds.size,
      excludedCount: excludedIds.size,
      topNicho: Object.entries(nichoWeights).sort((a, b) => b[1] - a[1])[0]?.[0],
      topPlataforma: Object.entries(plataformaWeights).sort((a, b) => b[1] - a[1])[0]?.[0]
    });

    return processed as Oferta[];
  } catch (error) {
    logger.error('Error generating recommendations', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    // Fallback em caso de erro: retornar destaques
    try {
      return await getOfertasDestaque(limit);
    } catch {
      return [];
    }
  }
}