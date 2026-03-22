import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';
import logger from '../config/logger';

// Ranking de ofertas por critério específico
export async function getRankingOfertas(req: AuthRequest, res: Response) {
  try {
    const { 
      criterio = 'receita', 
      periodo = '30d', 
      nichoId, 
      plataforma,
      limit = 10 
    } = req.query;

    const userId = req.user?.userId;

    // Calcular data de início baseada no período
    const dataInicio = new Date();
    switch (periodo) {
      case '7d':
        dataInicio.setDate(dataInicio.getDate() - 7);
        break;
      case '30d':
        dataInicio.setDate(dataInicio.getDate() - 30);
        break;
      case '90d':
        dataInicio.setDate(dataInicio.getDate() - 90);
        break;
      default:
        dataInicio.setDate(dataInicio.getDate() - 30);
    }

    // Construir filtros
    const where: any = {
      createdAt: {
        gte: dataInicio
      },
      isActive: true
    };

    if (nichoId) where.nichoId = nichoId;
    if (plataforma) where.plataforma = plataforma;

    // Definir ordenação baseada no critério
    let orderBy: any = {};
    switch (criterio) {
      case 'receita':
        orderBy.receita = 'desc';
        break;
      default:
        orderBy.receita = 'desc';
    }

    // Buscar ofertas ordenadas
    const ofertas = await prisma.oferta.findMany({
      where,
      select: {
        id: true,
        titulo: true,
        imagem: true,
        texto: true,
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
        createdAt: true,
        nicho: {
          select: {
            id: true,
            nome: true,
            slug: true
          }
        }
      },
      orderBy,
      take: parseInt(limit as string) || 10
    });

    // Processar dados das ofertas
    const ofertasProcessadas = ofertas.map((oferta, index) => ({
      ...oferta,
      posicao: index + 1,
      links: JSON.parse(oferta.links),
      tags: oferta.tags ? JSON.parse(oferta.tags) : undefined,
      metricas: oferta.metricas ? JSON.parse(oferta.metricas) : undefined
    }));

    logger.info('Ranking de ofertas gerado', {
      userId,
      criterio,
      periodo,
      nichoId: nichoId || null,
      plataforma: plataforma || null,
      totalOfertas: ofertasProcessadas.length
    });

    res.json({
      success: true,
      data: {
        criterio,
        periodo,
        dataInicio,
        dataFim: new Date(),
        filtros: {
          nichoId: nichoId || null,
          plataforma: plataforma || null
        },
        ranking: ofertasProcessadas
      }
    });
  } catch (error) {
    logger.error('Erro ao gerar ranking de ofertas', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Ranking de nichos por performance
export async function getRankingNichos(req: AuthRequest, res: Response) {
  try {
    const { periodo = '30d', criterio = 'receita', limit = 10 } = req.query;
    const userId = req.user?.userId;

    // Calcular data de início
    const dataInicio = new Date();
    switch (periodo) {
      case '7d':
        dataInicio.setDate(dataInicio.getDate() - 7);
        break;
      case '30d':
        dataInicio.setDate(dataInicio.getDate() - 30);
        break;
      case '90d':
        dataInicio.setDate(dataInicio.getDate() - 90);
        break;
      default:
        dataInicio.setDate(dataInicio.getDate() - 30);
    }

    // Buscar dados agregados por nicho
    const rankingNichos = await prisma.oferta.groupBy({
      by: ['nichoId'],
      where: {
        createdAt: {
          gte: dataInicio
        },
        isActive: true
      },
      _count: {
        id: true
      },
      _avg: {
        receita: true
      },
      _sum: {
        receita: true
      }
    });

    // Buscar informações dos nichos
    const nichos = await prisma.nicho.findMany({
      where: {
        id: {
          in: rankingNichos.map(r => r.nichoId)
        }
      }
    });

    // Combinar dados e calcular score
    const nichosComScore = rankingNichos.map(relatorio => {
      const nicho = nichos.find(n => n.id === relatorio.nichoId);
      
      // Calcular score baseado no critério
      let score = 0;
      switch (criterio) {
        case 'receita':
          score = relatorio._sum?.receita || 0;
          break;
        case 'volume':
          score = relatorio._count?.id || 0;
          break;
        default:
          score = relatorio._sum?.receita || 0;
      }

      return {
        nicho: {
          id: nicho?.id,
          nome: nicho?.nome,
          slug: nicho?.slug
        },
        totalOfertas: relatorio._count?.id || 0,
        score,
        metricas: {
          receitaMedia: relatorio._avg?.receita || 0,
          totalReceita: relatorio._sum?.receita || 0
        }
      };
    });

    // Ordenar por score
    nichosComScore.sort((a, b) => b.score - a.score);

    // Adicionar posições e limitar resultados
    const resultado = nichosComScore
      .slice(0, parseInt(limit as string) || 10)
      .map((nicho, index) => ({
        ...nicho,
        posicao: index + 1
      }));

    logger.info('Ranking de nichos gerado', {
      userId,
      criterio,
      periodo,
      totalNichos: resultado.length
    });

    res.json({
      success: true,
      data: {
        criterio,
        periodo,
        dataInicio,
        dataFim: new Date(),
        ranking: resultado
      }
    });
  } catch (error) {
    logger.error('Erro ao gerar ranking de nichos', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Ranking de plataformas por performance
export async function getRankingPlataformas(req: AuthRequest, res: Response) {
  try {
    const { periodo = '30d', criterio = 'receita', limit = 10 } = req.query;
    const userId = req.user?.userId;

    // Calcular data de início
    const dataInicio = new Date();
    switch (periodo) {
      case '7d':
        dataInicio.setDate(dataInicio.getDate() - 7);
        break;
      case '30d':
        dataInicio.setDate(dataInicio.getDate() - 30);
        break;
      case '90d':
        dataInicio.setDate(dataInicio.getDate() - 90);
        break;
      default:
        dataInicio.setDate(dataInicio.getDate() - 30);
    }

    // Buscar dados agregados por plataforma
    const rankingPlataformas = await prisma.oferta.groupBy({
      by: ['plataforma'],
      where: {
        createdAt: {
          gte: dataInicio
        },
        isActive: true
      },
      _count: {
        id: true
      },
      _avg: {
        receita: true
      },
      _sum: {
        receita: true
      }
    });

    // Calcular score e processar dados
    const plataformasComScore = rankingPlataformas.map(relatorio => {
      // Calcular score baseado no critério
      let score = 0;
      switch (criterio) {
        case 'receita':
          score = relatorio._sum?.receita || 0;
          break;
        case 'volume':
          score = relatorio._count?.id || 0;
          break;
        default:
          score = relatorio._sum?.receita || 0;
      }

      return {
        plataforma: relatorio.plataforma,
        totalOfertas: relatorio._count?.id || 0,
        score,
        metricas: {
          receitaMedia: relatorio._avg?.receita || 0,
          totalReceita: relatorio._sum?.receita || 0
        }
      };
    });

    // Ordenar por score
    plataformasComScore.sort((a, b) => b.score - a.score);

    // Adicionar posições e limitar resultados
    const resultado = plataformasComScore
      .slice(0, parseInt(limit as string) || 10)
      .map((plataforma, index) => ({
        ...plataforma,
        posicao: index + 1
      }));

    logger.info('Ranking de plataformas gerado', {
      userId,
      criterio,
      periodo,
      totalPlataformas: resultado.length
    });

    res.json({
      success: true,
      data: {
        criterio,
        periodo,
        dataInicio,
        dataFim: new Date(),
        ranking: resultado
      }
    });
  } catch (error) {
    logger.error('Erro ao gerar ranking de plataformas', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
} 