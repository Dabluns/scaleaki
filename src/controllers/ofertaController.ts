import { Request, Response } from 'express';
import * as ofertaService from '../services/ofertaService';
import { 
  CreateOfertaInput, 
  UpdateOfertaInput, 
  OfertasFilters, 
  OfertasSortOptions,
  PlataformaAnuncio,
  TipoOferta,
  StatusOferta
} from '../types/oferta';
import logger from '../config/logger';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';

// Arrays de validação para substituir Object.values()
const PLATAFORMAS_VALIDAS: PlataformaAnuncio[] = [
  'facebook_ads',
  'google_ads',
  'tiktok_ads',
  'instagram_ads',
  'linkedin_ads',
  'twitter_ads',
  'pinterest_ads',
  'snapchat_ads'
];

const TIPOS_VALIDOS: TipoOferta[] = [
  'ecommerce',
  'lead_generation',
  'app_install',
  'brand_awareness',
  'video_views',
  'conversions',
  'traffic'
];

const STATUS_VALIDOS: StatusOferta[] = [
  'ativa',
  'pausada',
  'arquivada',
  'teste'
];

export async function getAllOfertas(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Máximo 100 por página
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    
    if (search) {
      // Se há termo de busca, usar busca específica
      const ofertas = await ofertaService.getAllOfertas(limit, offset, { search });
      res.json({ success: true, data: ofertas });
    } else {
      // Busca normal sem filtros
      const ofertas = await ofertaService.getAllOfertas(limit, offset);
      res.json({ success: true, data: ofertas });
    }
  } catch (error) {
    logger.error('Error in getAllOfertas controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getOfertasByNicho(req: Request, res: Response) {
  try {
    const { nichoId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;
    
    const ofertas = await ofertaService.getOfertasByNicho(nichoId, limit, offset);
    res.json({ success: true, data: ofertas });
  } catch (error) {
    logger.error('Error in getOfertasByNicho controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getOfertaById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const oferta = await ofertaService.getOfertaById(id);
    
    if (!oferta) {
      return res.status(404).json({ success: false, error: 'Oferta não encontrada' });
    }
    
    res.json({ success: true, data: oferta });
  } catch (error) {
    logger.error('Error in getOfertaById controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createOferta(req: Request, res: Response) {
  try {
    const data: CreateOfertaInput = req.body;
    
    // Validação básica
    if (!data.titulo || !data.texto || !data.nichoId || !data.links) {
      return res.status(400).json({ success: false, error: 'Título, texto, nicho e links são obrigatórios' });
    }
    
    // Validar se links é um array
    if (!Array.isArray(data.links)) {
      return res.status(400).json({ success: false, error: 'Links deve ser um array' });
    }
    
    const oferta = await ofertaService.createOferta(data);
    res.status(201).json({ success: true, data: oferta });
  } catch (error) {
    logger.error('Error in createOferta controller', { error: error instanceof Error ? error.message : String(error) });
    
    if (error instanceof Error && error.message === 'Nicho não encontrado') {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateOferta(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data: UpdateOfertaInput = req.body;
    
    // Validar se links é um array quando fornecido
    if (data.links && !Array.isArray(data.links)) {
      return res.status(400).json({ success: false, error: 'Links deve ser um array' });
    }
    
    const oferta = await ofertaService.updateOferta(id, data);
    res.json({ success: true, data: oferta });
  } catch (error) {
    logger.error('Error in updateOferta controller', { error: error instanceof Error ? error.message : String(error) });
    
    if (error instanceof Error && (error.message === 'Oferta não encontrada' || error.message === 'Nicho não encontrado')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deleteOferta(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await ofertaService.deleteOferta(id);
    res.json({ success: true, message: 'Oferta deletada com sucesso' });
  } catch (error) {
    logger.error('Error in deleteOferta controller', { error: error instanceof Error ? error.message : String(error) });
    
    if (error instanceof Error && error.message === 'Oferta não encontrada') {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deactivateOferta(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const oferta = await ofertaService.deactivateOferta(id);
    res.json({ success: true, data: oferta });
  } catch (error) {
    logger.error('Error in deactivateOferta controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ===== NOVOS MÉTODOS EXPANDIDOS =====

export async function getOfertasByPlataforma(req: Request, res: Response) {
  try {
    const { plataforma } = req.params;
    
    // Validar plataforma
    if (!PLATAFORMAS_VALIDAS.includes(plataforma as PlataformaAnuncio)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Plataforma inválida' 
      });
    }
    
    const ofertas = await ofertaService.getOfertasByPlataforma(plataforma as PlataformaAnuncio);
    res.json({ success: true, data: ofertas });
  } catch (error) {
    logger.error('Error in getOfertasByPlataforma controller', { 
      error: error instanceof Error ? error.message : String(error),
      plataforma: req.params.plataforma 
    });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getOfertasByTipo(req: Request, res: Response) {
  try {
    const { tipo } = req.params;
    
    // Validar tipo
    if (!TIPOS_VALIDOS.includes(tipo as TipoOferta)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de oferta inválido' 
      });
    }
    
    const ofertas = await ofertaService.getOfertasByTipo(tipo as TipoOferta);
    res.json({ success: true, data: ofertas });
  } catch (error) {
    logger.error('Error in getOfertasByTipo controller', { 
      error: error instanceof Error ? error.message : String(error),
      tipo: req.params.tipo 
    });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getOfertasByStatus(req: Request, res: Response) {
  try {
    const { status } = req.params;
    
    // Validar status
    if (!STATUS_VALIDOS.includes(status as StatusOferta)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status inválido' 
      });
    }
    
    const ofertas = await ofertaService.getOfertasByStatus(status as StatusOferta);
    res.json({ success: true, data: ofertas });
  } catch (error) {
    logger.error('Error in getOfertasByStatus controller', { 
      error: error instanceof Error ? error.message : String(error),
      status: req.params.status 
    });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getOfertasComMetricas(req: Request, res: Response) {
  try {
    const { 
      page = '1', 
      limit = '20', 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      plataforma,
      tipoOferta,
      nichoId,
      search
    } = req.query;

    const filters: OfertasFilters = {
      plataforma: plataforma as PlataformaAnuncio,
      tipoOferta: tipoOferta as TipoOferta,
      nichoId: nichoId as string,
      search: search as string
    };

    const sortOptions: OfertasSortOptions = {
      field: sortBy as any,
      order: sortOrder as 'asc' | 'desc'
    };

    const result = await ofertaService.getOfertasComMetricas({
      page: Number(page),
      limit: Number(limit),
      filters,
      sortOptions
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error in getOfertasComMetricas controller', { 
      error: error instanceof Error ? error.message : String(error),
      query: req.query 
    });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateMetricasOferta(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { ctr, cpc, cpm, conversoes, roi, receita } = req.body;
    
    const metricas = {
      ctr: ctr ? Number(ctr) : undefined,
      cpc: cpc ? Number(cpc) : undefined,
      cpm: cpm ? Number(cpm) : undefined,
      conversoes: conversoes ? Number(conversoes) : undefined,
      roi: roi ? Number(roi) : undefined,
      receita: receita ? Number(receita) : undefined
    };
    
    const oferta = await ofertaService.updateMetricasOferta(id, metricas);
    res.json({ success: true, data: oferta });
  } catch (error) {
    logger.error('Error in updateMetricasOferta controller', { 
      error: error instanceof Error ? error.message : String(error),
      ofertaId: req.params.id,
      metricas: req.body 
    });
    
    if (error instanceof Error && error.message === 'Oferta não encontrada') {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getOfertasDestaque(req: Request, res: Response) {
  try {
    const { limit = '6' } = req.query;
    const ofertas = await ofertaService.getOfertasDestaque(Number(limit));
    res.json({ success: true, data: ofertas });
  } catch (error) {
    logger.error('Error in getOfertasDestaque controller', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getEstatisticasOfertas(req: Request, res: Response) {
  try {
    const estatisticas = await ofertaService.getEstatisticasOfertas();
    res.json({ success: true, data: estatisticas });
  } catch (error) {
    logger.error('Error in getEstatisticasOfertas controller', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
} 

export async function getRecommendations(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { limit = '8' } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autenticado.' });
    }

    const ofertas = await ofertaService.getRecommendationsForUser(userId, Number(limit));
    res.json({ success: true, data: ofertas });
  } catch (error) {
    logger.error('Error in getRecommendations controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getDashboardData(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    
    // Buscar todos os dados do dashboard em paralelo
    const [ofertasDestaque, estatisticas] = await Promise.all([
      ofertaService.getOfertasDestaque(3), // Máximo 3 ofertas mais acessadas
      ofertaService.getEstatisticasOfertas()
    ]);
    
    const executionTime = Date.now() - startTime;
    
    logger.info('Dashboard data fetched successfully', { executionTime });
    
    res.json({
      success: true,
      data: {
        ofertasDestaque,
        estatisticas,
        executionTime
      }
    });
  } catch (error) {
    logger.error('Error in getDashboardData controller', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function registerOfertaView(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { ofertaId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autenticado.' });
    }

    if (!ofertaId) {
      return res.status(400).json({ success: false, error: 'ID da oferta é obrigatório.' });
    }

    // Verificar se a oferta existe
    const oferta = await prisma.oferta.findUnique({
      where: { id: ofertaId },
      select: { id: true }
    });

    if (!oferta) {
      return res.status(404).json({ success: false, error: 'Oferta não encontrada.' });
    }

    // Registrar visualização (usar upsert para evitar duplicatas)
    await prisma.ofertaView.upsert({
      where: {
        userId_ofertaId: {
          userId,
          ofertaId
        }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        userId,
        ofertaId,
        viewedAt: new Date()
      }
    });

    logger.info('Oferta view registered', { userId, ofertaId });

    res.json({ success: true, message: 'Visualização registrada com sucesso.' });
  } catch (error) {
    logger.error('Error in registerOfertaView controller', { 
      error: error instanceof Error ? error.message : String(error),
      ofertaId: req.params.ofertaId
    });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getOfertasComVSL(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50); // Máximo 50 por página
    const offset = (page - 1) * limit;
    
    const result = await ofertaService.getOfertasParaReels(limit, offset);
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error in getOfertasComVSL controller', { 
      error: error instanceof Error ? error.message : String(error),
      query: req.query 
    });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
} 