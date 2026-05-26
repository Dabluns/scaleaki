import { Request, Response } from 'express';
import prisma from '../config/database';
import { syncAdsFromLibrary, enrichPageData, syncAdsFromApify } from '../services/fbAdLibrary.service';
import { scanFunnel } from '../services/urlscan.service';
import logger from '../config/logger';

// ─── Listagem com filtros e paginação ─────────────────────────────────────────

export async function listAnuncios(req: Request, res: Response) {
  try {
    const {
      page = '1',
      limit = '24',
      checkout,
      escalaMin,
      duplicatasMin,
      status = 'active',
      search,
      orderBy = 'createdAt',
      order = 'desc',
    } = req.query as Record<string, string>;

    const take = Math.min(Number(limit), 100);
    const skip = (Number(page) - 1) * take;

    const where: any = { isActive: status !== 'inactive' };
    if (checkout) where.checkout = checkout;
    if (escalaMin) where.escala = { gte: Number(escalaMin) };
    if (duplicatasMin) where.duplicatas = { gte: Number(duplicatasMin) };
    if (search) {
      where.OR = [
        { pageName: { contains: search, mode: 'insensitive' } },
        { adCopy: { contains: search, mode: 'insensitive' } },
      ];
    }

    const validOrderFields = ['createdAt', 'escala', 'duplicatas', 'deliveryStartTime', 'pageLikes'];
    const sortField = validOrderFields.includes(orderBy) ? orderBy : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [anuncios, total] = await Promise.all([
      prisma.anuncioFacebook.findMany({
        where,
        skip,
        take,
        orderBy: { [sortField]: sortOrder },
        select: {
          id: true,
          fbAdId: true,
          pageName: true,
          pageProfilePic: true,
          pageLikes: true,
          adCopy: true,
          adHeadline: true,
          adSnapshotUrl: true,
          destinationUrl: true,
          publisherPlatforms: true,
          deliveryStartTime: true,
          deliveryStopTime: true,
          checkout: true,
          tecnologia: true,
          escala: true,
          duplicatas: true,
          landingScreenshot: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.anuncioFacebook.count({ where }),
    ]);

    res.json({
      data: anuncios,
      meta: { total, page: Number(page), limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err: any) {
    logger.error('[FbAds] Erro ao listar anúncios:', err);
    res.status(500).json({ error: 'Erro ao listar anúncios' });
  }
}

// ─── Detalhe completo de um anúncio ───────────────────────────────────────────

export async function getAnuncio(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const anuncio = await prisma.anuncioFacebook.findFirst({
      where: { OR: [{ id }, { fbAdId: id }] },
    });

    if (!anuncio) return res.status(404).json({ error: 'Anúncio não encontrado' });

    res.json(anuncio);
  } catch (err: any) {
    logger.error('[FbAds] Erro ao buscar anúncio:', err);
    res.status(500).json({ error: 'Erro ao buscar anúncio' });
  }
}

// ─── Sync com Facebook Ad Library API ─────────────────────────────────────────

export async function syncAds(req: Request, res: Response) {
  try {
    const { searchTerms, adType, countries, adActiveStatus, pageIds, limit } = req.body;

    const useApify = !!(process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN);

    if (useApify) {
      const result = await syncAdsFromApify({
        searchTerms,
        countries,
        limit,
      });
      return res.json({
        message: 'Sincronização via Scraper (Apify) iniciada em segundo plano. Os anúncios serão minerados e aparecerão em instantes.',
        runId: result.runId,
        isApify: true
      });
    }

    const result = await syncAdsFromLibrary({
      searchTerms,
      adType,
      countries,
      adActiveStatus,
      pageIds,
      limit,
    });

    res.json({ message: 'Sync concluído', ...result });
  } catch (err: any) {
    logger.error('[FbAds] Erro no sync:', err);
    
    let details = err.message;
    let statusCode = 500;
    
    if (err.response?.data?.error) {
      statusCode = err.response.status || 400;
      const metaError = err.response.data.error;
      details = metaError.message;
      
      // Personalizar mensagens comuns da API do Facebook para o usuário final
      if (metaError.error_subcode === 2332002 || metaError.code === 10) {
        details = 'Autorização necessária no Meta: acesse facebook.com/ads/library/api e siga as etapas para confirmar sua identidade e liberar o acesso ao aplicativo.';
      } else if (metaError.code === 190) {
        details = 'O Token de Acesso do Facebook Ad Library expirou ou é inválido. Por favor, gere um novo token no Meta Developers.';
      }
    }
    
    res.status(statusCode).json({ error: 'Erro ao sincronizar anúncios', details });
  }
}

// ─── Atualização manual de escala (curadoria) ─────────────────────────────────

export async function updateEscala(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { escala } = req.body;

    if (typeof escala !== 'number' || escala < 0 || escala > 100) {
      return res.status(400).json({ error: 'Escala deve ser um número entre 0 e 100' });
    }

    const updated = await prisma.anuncioFacebook.update({
      where: { id },
      data: { escala },
      select: { id: true, fbAdId: true, escala: true },
    });

    res.json(updated);
  } catch (err: any) {
    logger.error('[FbAds] Erro ao atualizar escala:', err);
    res.status(500).json({ error: 'Erro ao atualizar escala' });
  }
}

// ─── Análise de funil via URLscan ─────────────────────────────────────────────

export async function triggerFunnelScan(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const anuncio = await prisma.anuncioFacebook.findUnique({ where: { id } });
    if (!anuncio) return res.status(404).json({ error: 'Anúncio não encontrado' });
    if (!anuncio.destinationUrl) return res.status(400).json({ error: 'Anúncio sem URL de destino' });

    // Dispara em background — responde imediatamente
    scanFunnel(anuncio.fbAdId, anuncio.destinationUrl).catch(() => {});

    res.json({ message: 'Análise de funil iniciada. Resultados disponíveis em ~60s.' });
  } catch (err: any) {
    logger.error('[FbAds] Erro ao iniciar scan de funil:', err);
    res.status(500).json({ error: 'Erro ao iniciar análise de funil' });
  }
}

// ─── Enriquecimento de página (likes + foto) ──────────────────────────────────

export async function triggerPageEnrich(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const anuncio = await prisma.anuncioFacebook.findUnique({ where: { id } });
    if (!anuncio) return res.status(404).json({ error: 'Anúncio não encontrado' });

    enrichPageData(anuncio.fbAdId, anuncio.pageId ?? undefined).catch(() => {});

    res.json({ message: 'Enriquecimento de página iniciado.' });
  } catch (err: any) {
    logger.error('[FbAds] Erro ao enriquecer página:', err);
    res.status(500).json({ error: 'Erro ao enriquecer página' });
  }
}

// ─── Ativar/Desativar anúncio ─────────────────────────────────────────────────

export async function toggleAnuncio(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const anuncio = await prisma.anuncioFacebook.findUnique({ where: { id } });
    if (!anuncio) return res.status(404).json({ error: 'Anúncio não encontrado' });

    const updated = await prisma.anuncioFacebook.update({
      where: { id },
      data: { isActive: !anuncio.isActive },
      select: { id: true, isActive: true },
    });

    res.json(updated);
  } catch (err: any) {
    logger.error('[FbAds] Erro ao alternar status:', err);
    res.status(500).json({ error: 'Erro ao alternar status do anúncio' });
  }
}
