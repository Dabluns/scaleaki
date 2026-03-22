import prisma from '../config/database';
import { Nicho, CreateNichoInput, UpdateNichoInput } from '../types/nicho';
import logger from '../config/logger';

export async function getAllNichos(filters?: { search?: string }): Promise<Nicho[]> {
  try {
    const whereClause: any = { isActive: true };
    
    if (filters?.search) {
      whereClause.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { descricao: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    const nichos = await prisma.nicho.findMany({
      where: whereClause,
      orderBy: { nome: 'asc' }
    });
    
    return nichos.map(nicho => ({
      ...nicho,
      descricao: nicho.descricao || undefined,
      createdAt: nicho.createdAt,
      updatedAt: nicho.updatedAt
    }));
  } catch (error) {
    logger.error('Error fetching nichos', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar nichos');
  }
}

export async function getNichoById(id: string): Promise<Nicho | null> {
  try {
    const nicho = await prisma.nicho.findUnique({
      where: { id }
    });
    
    return nicho ? {
      ...nicho,
      createdAt: nicho.createdAt,
      updatedAt: nicho.updatedAt
    } : null;
  } catch (error) {
    logger.error('Error fetching nicho by id', { id, error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar nicho');
  }
}

export async function getNichoBySlug(slug: string): Promise<Nicho | null> {
  try {
    const nicho = await prisma.nicho.findUnique({
      where: { slug }
    });
    
    return nicho ? {
      ...nicho,
      createdAt: nicho.createdAt,
      updatedAt: nicho.updatedAt
    } : null;
  } catch (error) {
    logger.error('Error fetching nicho by slug', { slug, error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar nicho');
  }
}

export async function createNicho(data: CreateNichoInput): Promise<Nicho> {
  try {
    // Verificar se o slug já existe
    const existingNicho = await prisma.nicho.findUnique({
      where: { slug: data.slug }
    });
    
    if (existingNicho) {
      throw new Error('Slug já existe');
    }
    
    const nicho = await prisma.nicho.create({
      data: {
        nome: data.nome,
        slug: data.slug,
        icone: data.icone,
        descricao: data.descricao
      }
    });
    
    logger.info('Nicho created successfully', { nichoId: nicho.id, nome: nicho.nome });
    
    return {
      ...nicho,
      createdAt: nicho.createdAt,
      updatedAt: nicho.updatedAt
    };
  } catch (error) {
    logger.error('Error creating nicho', { data, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function updateNicho(id: string, data: UpdateNichoInput): Promise<Nicho> {
  try {
    // Verificar se o nicho existe
    const existingNicho = await prisma.nicho.findUnique({
      where: { id }
    });
    
    if (!existingNicho) {
      throw new Error('Nicho não encontrado');
    }
    
    // Se estiver atualizando o slug, verificar se já existe
    if (data.slug && data.slug !== existingNicho.slug) {
      const slugExists = await prisma.nicho.findUnique({
        where: { slug: data.slug }
      });
      
      if (slugExists) {
        throw new Error('Slug já existe');
      }
    }
    
    const nicho = await prisma.nicho.update({
      where: { id },
      data
    });
    
    logger.info('Nicho updated successfully', { nichoId: nicho.id, nome: nicho.nome });
    
    return {
      ...nicho,
      createdAt: nicho.createdAt,
      updatedAt: nicho.updatedAt
    };
  } catch (error) {
    logger.error('Error updating nicho', { id, data, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function deleteNicho(id: string): Promise<void> {
  try {
    // Verificar se o nicho existe
    const existingNicho = await prisma.nicho.findUnique({
      where: { id },
      include: { ofertas: true }
    });
    
    if (!existingNicho) {
      throw new Error('Nicho não encontrado');
    }
    
    // Verificar se há ofertas associadas
    if (existingNicho.ofertas.length > 0) {
      throw new Error('Não é possível deletar um nicho que possui ofertas associadas');
    }
    
    await prisma.nicho.delete({
      where: { id }
    });
    
    logger.info('Nicho deleted successfully', { nichoId: id, nome: existingNicho.nome });
  } catch (error) {
    logger.error('Error deleting nicho', { id, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function deactivateNicho(id: string): Promise<Nicho> {
  try {
    const nicho = await prisma.nicho.update({
      where: { id },
      data: { isActive: false }
    });
    
    logger.info('Nicho deactivated successfully', { nichoId: nicho.id, nome: nicho.nome });
    
    return {
      ...nicho,
      createdAt: nicho.createdAt,
      updatedAt: nicho.updatedAt
    };
  } catch (error) {
    logger.error('Error deactivating nicho', { id, error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao desativar nicho');
  }
}

export async function getNichosPopulares(limit: number = 3): Promise<Array<{
  nicho: Nicho;
  ofertasCount: number;
  visualizacoes: number;
  trending: boolean;
}>> {
  try {
    // Algoritmo baseado em visualizações reais
    // Buscar visualizações dos últimos 30 dias
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    // Buscar visualizações agrupadas por oferta com seus nichos
    const visualizacoesComOfertas = await prisma.ofertaView.findMany({
      where: {
        viewedAt: {
          gte: trintaDiasAtras
        }
      },
      include: {
        oferta: {
          select: {
            nichoId: true,
            isActive: true,
            status: true
          }
        }
      }
    });

    // Filtrar apenas ofertas ativas e agrupar por nicho
    const visualizacoesPorNicho = new Map<string, number>();
    
    visualizacoesComOfertas.forEach(view => {
      if (view.oferta.isActive && view.oferta.status === 'ativa') {
        const count = visualizacoesPorNicho.get(view.oferta.nichoId) || 0;
        visualizacoesPorNicho.set(view.oferta.nichoId, count + 1);
      }
    });

    // Buscar contagem de ofertas por nicho
    const ofertasPorNicho = await prisma.oferta.groupBy({
      by: ['nichoId'],
      where: {
        isActive: true,
        status: 'ativa'
      },
      _count: {
        id: true
      }
    });

    // Buscar informações dos nichos
    const todosNichoIds = Array.from(new Set([
      ...Array.from(visualizacoesPorNicho.keys()),
      ...ofertasPorNicho.map(item => item.nichoId)
    ]));

    const nichos = await prisma.nicho.findMany({
      where: {
        id: { in: todosNichoIds },
        isActive: true
      }
    });

    // Combinar dados com visualizações reais
    const nichosComMetricas = nichos.map(nicho => {
      const ofertasCount = ofertasPorNicho.find(item => item.nichoId === nicho.id)?._count.id || 0;
      const visualizacoes = visualizacoesPorNicho.get(nicho.id) || 0;
      
      // Trending: nicho tem mais de 20 visualizações nos últimos 30 dias OU está nos top 3
      const trending = visualizacoes >= 20;

      return {
        nicho: {
          ...nicho,
          createdAt: nicho.createdAt,
          updatedAt: nicho.updatedAt
        },
        ofertasCount,
        visualizacoes,
        trending
      };
    }).filter(item => item.ofertasCount > 0); // Apenas nichos com ofertas

    // Ordenar por visualizações reais (mais acessado primeiro), depois por número de ofertas
    nichosComMetricas.sort((a, b) => {
      if (b.visualizacoes !== a.visualizacoes) {
        return b.visualizacoes - a.visualizacoes;
      }
      return b.ofertasCount - a.ofertasCount;
    });
    
    // Retornar apenas os top N (máximo 3)
    return nichosComMetricas.slice(0, limit);
  } catch (error) {
    logger.error('Error fetching popular nichos', { error: error instanceof Error ? error.message : String(error) });
    throw new Error('Erro ao buscar nichos populares');
  }
} 