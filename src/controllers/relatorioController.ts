import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';
import logger from '../config/logger';

// Relatório de performance por nicho
export async function getRelatorioNichos(req: AuthRequest, res: Response) {
  try {
    const { periodo = '30d' } = req.query;
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

    // Buscar dados agregados por nicho
    const relatorioNichos = await prisma.oferta.groupBy({
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
          in: relatorioNichos.map(r => r.nichoId)
        }
      }
    });

    // Combinar dados
    const resultado = relatorioNichos.map(relatorio => {
      const nicho = nichos.find(n => n.id === relatorio.nichoId);
      return {
        nicho: {
          id: nicho?.id,
          nome: nicho?.nome,
          slug: nicho?.slug
        },
        totalOfertas: relatorio._count?.id || 0,
        metricas: {
          receitaMedia: relatorio._avg?.receita || 0,
          totalReceita: relatorio._sum?.receita || 0
        }
      };
    });

    // Ordenar por total de receita
    resultado.sort((a, b) => b.metricas.totalReceita - a.metricas.totalReceita);

    logger.info('Relatório de nichos gerado', {
      userId,
      periodo,
      totalNichos: resultado.length
    });

    res.json({
      success: true,
      data: {
        periodo,
        dataInicio,
        dataFim: new Date(),
        nichos: resultado
      }
    });
  } catch (error) {
    logger.error('Erro ao gerar relatório de nichos', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Relatório de performance por plataforma
export async function getRelatorioPlataformas(req: AuthRequest, res: Response) {
  try {
    const { periodo = '30d' } = req.query;
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
    const relatorioPlataformas = await prisma.oferta.groupBy({
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

    // Processar dados
    const resultado = relatorioPlataformas.map(relatorio => ({
      plataforma: relatorio.plataforma,
      totalOfertas: relatorio._count?.id || 0,
      metricas: {
        receitaMedia: relatorio._avg?.receita || 0,
        totalReceita: relatorio._sum?.receita || 0
      }
    }));

    // Ordenar por total de receita
    resultado.sort((a, b) => b.metricas.totalReceita - a.metricas.totalReceita);

    logger.info('Relatório de plataformas gerado', {
      userId,
      periodo,
      totalPlataformas: resultado.length
    });

    res.json({
      success: true,
      data: {
        periodo,
        dataInicio,
        dataFim: new Date(),
        plataformas: resultado
      }
    });
  } catch (error) {
    logger.error('Erro ao gerar relatório de plataformas', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Relatório de tendências temporais
export async function getRelatorioTendencias(req: AuthRequest, res: Response) {
  try {
    const { periodo = '30d', nichoId, plataforma } = req.query;
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

    // Construir filtros
    const where: any = {
      createdAt: {
        gte: dataInicio
      },
      isActive: true
    };

    if (nichoId) where.nichoId = nichoId;
    if (plataforma) where.plataforma = plataforma;

    // Buscar ofertas com métricas
    const ofertas = await prisma.oferta.findMany({
      where,
      select: {
        id: true,
        titulo: true,
        createdAt: true,
        receita: true,
        nicho: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Agrupar por período (semana ou mês)
    const agrupamento = periodo === '7d' ? 'dia' : 'semana';
    const tendencias: any[] = [];

    if (agrupamento === 'dia') {
      // Agrupar por dia
      const dias = new Map();
      
      ofertas.forEach(oferta => {
        const data = oferta.createdAt.toISOString().split('T')[0];
        if (!dias.has(data)) {
          dias.set(data, {
            data,
            ofertas: [],
            totalReceita: 0
          });
        }
        
        const dia = dias.get(data);
        dia.ofertas.push(oferta);
        dia.totalReceita += oferta.receita || 0;
      });

      // Calcular médias
      dias.forEach(dia => {
        tendencias.push(dia);
      });
    } else {
      // Agrupar por semana
      const semanas = new Map();
      
      ofertas.forEach(oferta => {
        const data = new Date(oferta.createdAt);
        const semana = getWeekNumber(data);
        const chave = `${data.getFullYear()}-W${semana}`;
        
        if (!semanas.has(chave)) {
          semanas.set(chave, {
            semana: chave,
            ofertas: [],
            totalReceita: 0
          });
        }
        
        const semanaData = semanas.get(chave);
        semanaData.ofertas.push(oferta);
        semanaData.totalReceita += oferta.receita || 0;
      });

      // Calcular médias
      semanas.forEach(semana => {
        tendencias.push(semana);
      });
    }

    // Ordenar por data
    tendencias.sort((a, b) => {
      if (agrupamento === 'dia') {
        return new Date(a.data).getTime() - new Date(b.data).getTime();
      } else {
        return a.semana.localeCompare(b.semana);
      }
    });

    logger.info('Relatório de tendências gerado', {
      userId,
      periodo,
      agrupamento,
      totalPeriodos: tendencias.length
    });

    res.json({
      success: true,
      data: {
        periodo,
        agrupamento,
        dataInicio,
        dataFim: new Date(),
        filtros: {
          nichoId: nichoId || null,
          plataforma: plataforma || null
        },
        tendencias
      }
    });
  } catch (error) {
    logger.error('Erro ao gerar relatório de tendências', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Relatório de performance geral
export async function getRelatorioGeral(req: AuthRequest, res: Response) {
  try {
    const { periodo = '30d' } = req.query;
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

    // Buscar estatísticas gerais
    const [
      totalOfertas,
      ofertasAtivas,
      totalNichos,
      metricasGerais
    ] = await Promise.all([
      prisma.oferta.count({
        where: {
          createdAt: { gte: dataInicio }
        }
      }),
      prisma.oferta.count({
        where: {
          createdAt: { gte: dataInicio },
          isActive: true
        }
      }),
      prisma.nicho.count({
        where: {
          isActive: true
        }
      }),
      prisma.oferta.aggregate({
        where: {
          createdAt: { gte: dataInicio },
          isActive: true
        },
        _avg: {
          receita: true
        },
        _sum: {
          receita: true
        }
      })
    ]);

    // Buscar top 5 ofertas por receita
    const topOfertas = await prisma.oferta.findMany({
      where: {
        createdAt: { gte: dataInicio },
        isActive: true,
        receita: { gt: 0 }
      },
      select: {
        id: true,
        titulo: true,
        receita: true,
        nicho: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        receita: 'desc'
      },
      take: 5
    });

    logger.info('Relatório geral gerado', {
      userId,
      periodo,
      totalOfertas,
      ofertasAtivas
    });

    res.json({
      success: true,
      data: {
        periodo,
        dataInicio,
        dataFim: new Date(),
        resumo: {
          totalOfertas,
          ofertasAtivas,
          totalNichos,
          taxaAtivacao: totalOfertas > 0 ? (ofertasAtivas / totalOfertas) * 100 : 0
        },
        metricas: {
          receitaMedia: metricasGerais._avg?.receita || 0,
          totalReceita: metricasGerais._sum?.receita || 0
        },
        topOfertas
      }
    });
  } catch (error) {
    logger.error('Erro ao gerar relatório geral', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Função auxiliar para obter número da semana
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
} 