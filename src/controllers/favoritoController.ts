import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';
import logger from '../config/logger';

// Adicionar oferta aos favoritos
export async function addFavorito(req: AuthRequest, res: Response) {
  try {
    const { ofertaId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    if (!ofertaId) {
      return res.status(400).json({
        success: false,
        error: 'ID da oferta é obrigatório'
      });
    }

    // Verificar se a oferta existe
    const oferta = await prisma.oferta.findUnique({
      where: { id: ofertaId }
    });

    if (!oferta) {
      return res.status(404).json({
        success: false,
        error: 'Oferta não encontrada'
      });
    }

    // Verificar se já é favorito
    const favoritoExistente = await prisma.favorito.findUnique({
      where: {
        userId_ofertaId: {
          userId,
          ofertaId
        }
      }
    });

    if (favoritoExistente) {
      return res.status(400).json({
        success: false,
        error: 'Oferta já está nos favoritos'
      });
    }

    // Adicionar aos favoritos
    const favorito = await prisma.favorito.create({
      data: {
        userId,
        ofertaId
      },
      include: {
        oferta: {
          include: {
            nicho: true
          }
        }
      }
    });

    logger.info('Favorito adicionado', {
      userId,
      ofertaId,
      favoritoId: favorito.id
    });

    res.status(201).json({
      success: true,
      data: favorito
    });
  } catch (error) {
    logger.error('Erro ao adicionar favorito', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId,
      ofertaId: req.body.ofertaId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Remover oferta dos favoritos
export async function removeFavorito(req: AuthRequest, res: Response) {
  try {
    const { ofertaId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    if (!ofertaId) {
      return res.status(400).json({
        success: false,
        error: 'ID da oferta é obrigatório'
      });
    }

    // Verificar se o favorito existe
    const favorito = await prisma.favorito.findUnique({
      where: {
        userId_ofertaId: {
          userId,
          ofertaId
        }
      }
    });

    if (!favorito) {
      return res.status(404).json({
        success: false,
        error: 'Favorito não encontrado'
      });
    }

    // Remover favorito
    await prisma.favorito.delete({
      where: {
        userId_ofertaId: {
          userId,
          ofertaId
        }
      }
    });

    logger.info('Favorito removido', {
      userId,
      ofertaId
    });

    res.json({
      success: true,
      message: 'Favorito removido com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao remover favorito', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId,
      ofertaId: req.params.ofertaId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Listar favoritos do usuário
export async function getFavoritos(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    // Buscar favoritos com paginação
    const [favoritos, total] = await Promise.all([
      prisma.favorito.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          oferta: {
            include: {
              nicho: true
            }
          }
        }
      }),
      prisma.favorito.count({
        where: { userId }
      })
    ]);

    // Processar dados das ofertas
    const ofertasProcessadas = favoritos.map(fav => ({
      ...fav.oferta,
      links: JSON.parse(fav.oferta.links),
      tags: fav.oferta.tags ? JSON.parse(fav.oferta.tags) : undefined,
      metricas: fav.oferta.metricas ? JSON.parse(fav.oferta.metricas) : undefined,
      favoritadoEm: fav.createdAt
    }));

    const totalPages = Math.ceil(total / limit);

    logger.info('Favoritos listados', {
      userId,
      page,
      limit,
      total,
      totalPages
    });

    res.json({
      success: true,
      data: ofertasProcessadas,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Erro ao listar favoritos', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Verificar se oferta é favorita
export async function checkFavorito(req: AuthRequest, res: Response) {
  try {
    const { ofertaId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    if (!ofertaId) {
      return res.status(400).json({
        success: false,
        error: 'ID da oferta é obrigatório'
      });
    }

    // Verificar se é favorito
    const favorito = await prisma.favorito.findUnique({
      where: {
        userId_ofertaId: {
          userId,
          ofertaId
        }
      }
    });

    res.json({
      success: true,
      data: {
        isFavorito: !!favorito,
        favoritoId: favorito?.id
      }
    });
  } catch (error) {
    logger.error('Erro ao verificar favorito', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId,
      ofertaId: req.params.ofertaId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Contar favoritos do usuário
export async function countFavoritos(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const count = await prisma.favorito.count({
      where: { userId }
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    logger.error('Erro ao contar favoritos', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
} 