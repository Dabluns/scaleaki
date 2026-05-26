import { Request, Response } from 'express';
import prisma from '../config/database';
import { syncAdsFromLibrary, enrichPageData, syncAdsFromApify, liveSearchFromApify, calcEscala } from '../services/fbAdLibrary.service';
import { scanFunnel } from '../services/urlscan.service';
import logger from '../config/logger';

// ─── Busca ao vivo na Ad Library via Apify ────────────────────────────────────

export async function liveSearch(req: Request, res: Response) {
  try {
    const { q, countries, limit } = req.body as {
      q?: string;
      countries?: string[];
      limit?: number;
    };

    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Parâmetro de busca "q" é obrigatório.' });
    }

    const query = q.trim();
    const take = Math.min(limit || 50, 100);

    // ── 1. Busca imediata no banco de dados ──────────────────────────────────
    const where: any = {
      isActive: true,
      OR: [
        { pageName:    { contains: query, mode: 'insensitive' } },
        { adCopy:      { contains: query, mode: 'insensitive' } },
        { adHeadline:  { contains: query, mode: 'insensitive' } },
        { destinationUrl: { contains: query, mode: 'insensitive' } },
      ],
    };

    const [dbResults, total] = await Promise.all([
      prisma.anuncioFacebook.findMany({
        where,
        take,
        orderBy: [{ escala: 'desc' }, { duplicatas: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.anuncioFacebook.count({ where }),
    ]);

    // ── 2. Dispara mining em background via Apify (fire & forget) ────────────
    let miningStarted = false;
    const hasApify = !!(process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN);
    if (hasApify) {
      syncAdsFromApify({
        searchTerms: query,
        countries: countries || ['BR'],
        limit: 50,
      }).catch((err: any) => {
        logger.warn(`[FbAds/LiveSearch] Apify indisponível (${err.message}) — usando apenas BD`);
      });
      miningStarted = true;
    }

    res.json({
      data: dbResults,
      total,
      query,
      source: 'database',
      miningStarted,
    });
  } catch (err: any) {
    logger.error('[FbAds] Erro na busca ao vivo:', err);
    res.status(500).json({ error: err.message || 'Erro na busca' });
  }
}


// ─── Recalcular escala de todos os anúncios existentes ──────────────────────────

export async function recalcEscalaAll(req: Request, res: Response) {
  try {
    const todos = await prisma.anuncioFacebook.findMany({
      select: { id: true, duplicatas: true, deliveryStartTime: true, deliveryStopTime: true, isActive: true },
    });

    let count = 0;
    for (const ad of todos) {
      const isActive = ad.isActive ?? !ad.deliveryStopTime;
      const escala = calcEscala({
        duplicatas: ad.duplicatas ?? 0,
        deliveryStartTime: ad.deliveryStartTime,
        isActive,
      });
      await prisma.anuncioFacebook.update({ where: { id: ad.id }, data: { escala, isActive } });
      count++;
    }

    res.json({ message: `Escala recalculada para ${count} anúncios.`, count });
  } catch (err: any) {
    logger.error('[FbAds] Erro ao recalcular escala:', err);
    res.status(500).json({ error: 'Erro ao recalcular escala' });
  }
}

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

    if (!process.env.URLSCAN_API_KEY) {
      return res.status(400).json({ error: 'A chave de API URLSCAN_API_KEY não está configurada no servidor (.env).' });
    }

    const anuncio = await prisma.anuncioFacebook.findUnique({ where: { id } });
    if (!anuncio) return res.status(404).json({ error: 'Anúncio não encontrado' });
    if (!anuncio.destinationUrl) return res.status(400).json({ error: 'Anúncio sem URL de destino' });

    const destUrlLower = anuncio.destinationUrl.toLowerCase();
    if (destUrlLower.includes('instagram.com') || destUrlLower.includes('facebook.com') || destUrlLower.includes('wa.me') || destUrlLower.includes('whatsapp.com')) {
      return res.status(400).json({ error: 'Links de redes sociais (Instagram, WhatsApp, etc) não podem ser mapeados pelo URLscan.' });
    }

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
