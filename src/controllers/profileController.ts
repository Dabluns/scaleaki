import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';
import logger from '../config/logger';

// Obter perfil do usuário
export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        isActive: true,
        createdAt: true,
        profile: {
          select: {
            avatar: true,
            avatarType: true,
            phone: true,
            company: true,
            position: true,
            bio: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user,
        profile: user.profile
      }
    });
  } catch (error) {
    logger.error('Erro ao obter perfil', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Atualizar perfil do usuário
export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { name, avatar, avatarType, phone, company, position, bio } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    // Atualizar dados do usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name })
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        isActive: true,
      }
    });

    // Atualizar ou criar perfil
    const profileData: any = {};
    if (avatar !== undefined) profileData.avatar = avatar;
    if (avatarType !== undefined) profileData.avatarType = avatarType;
    if (phone !== undefined) profileData.phone = phone;
    if (company !== undefined) profileData.company = company;
    if (position !== undefined) profileData.position = position;
    if (bio !== undefined) profileData.bio = bio;

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData
      },
      select: {
        avatar: true,
        avatarType: true,
        phone: true,
        company: true,
        position: true,
        bio: true,
      }
    });

    res.json({
      success: true,
      data: {
        user: updatedUser,
        profile: updatedProfile
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar perfil', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}

// Obter estatísticas de atividade do usuário
export async function getUserActivityStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    // Calcular datas
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Buscar dados em paralelo
    const [
      totalFavoritos,
      favoritosEstaSemana,
      favoritosSemanaPassada,
      nichosExplorados,
      ofertasVisualizadasEstaSemana,
      ofertasVisualizadasSemanaPassada,
    ] = await Promise.all([
      // Total de favoritos
      prisma.favorito.count({
        where: { userId }
      }),
      
      // Favoritos desta semana
      prisma.favorito.count({
        where: {
          userId,
          createdAt: { gte: weekAgo }
        }
      }),
      
      // Favoritos semana passada
      prisma.favorito.count({
        where: {
          userId,
          createdAt: { 
            gte: twoWeeksAgo,
            lt: weekAgo
          }
        }
      }),
      
      // Nichos únicos explorados (baseado nos favoritos)
      prisma.favorito.findMany({
        where: { userId },
        select: {
          oferta: {
            select: {
              nichoId: true
            }
          }
        }
      }).then(favoritos => {
        const nichoIds = new Set<string>();
        favoritos.forEach(fav => {
          if (fav.oferta?.nichoId) {
            nichoIds.add(fav.oferta.nichoId);
          }
        });
        return nichoIds.size;
      }),

      // Atividade desta semana (favoritos + visualizações estimadas)
      prisma.favorito.count({
        where: {
          userId,
          createdAt: { gte: weekAgo }
        }
      }),

      // Atividade semana passada
      prisma.favorito.count({
        where: {
          userId,
          createdAt: { 
            gte: twoWeeksAgo,
            lt: weekAgo
          }
        }
      }),
    ]);

    // Calcular crescimento de atividade
    const atividadeEstaSemana = favoritosEstaSemana + (ofertasVisualizadasEstaSemana || 0);
    const atividadeSemanaPassada = favoritosSemanaPassada + (ofertasVisualizadasSemanaPassada || 0);
    
    let percentualCrescimento = 0;
    let tendencia: 'up' | 'down' = 'up';
    
    if (atividadeSemanaPassada > 0) {
      percentualCrescimento = Math.round(
        ((atividadeEstaSemana - atividadeSemanaPassada) / atividadeSemanaPassada) * 100
      );
      tendencia = percentualCrescimento >= 0 ? 'up' : 'down';
    } else if (atividadeEstaSemana > 0) {
      percentualCrescimento = 100;
      tendencia = 'up';
    }

    const stats = {
      totalFavoritos,
      nichosExplorados: await Promise.resolve(nichosExplorados),
      tendencia,
      percentualCrescimento: Math.abs(percentualCrescimento),
      atividadeEstaSemana,
      atividadeSemanaPassada,
    };

    logger.info('Estatísticas de atividade do usuário obtidas', {
      userId,
      stats
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas de atividade', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.userId
    });

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}
