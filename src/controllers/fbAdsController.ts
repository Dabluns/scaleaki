import { Request, Response } from 'express';
import prisma from '../config/database';
import { syncAdsFromLibrary, enrichPageData, syncAdsFromApify, liveSearchFromApify, calcEscala, detectCheckoutFromUrl } from '../services/fbAdLibrary.service';
import { scanFunnel } from '../services/urlscan.service';
import logger from '../config/logger';
import { applyFreemium } from '../utils/freemium';
import { hasPaidAccess } from '../utils/access';
import { countGarimposToday, recordGarimpo } from '../utils/dailyGarimpo';

/** Carrega user + subscription pra decisão de entitlement. */
async function loadFreemiumUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } });
}

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

    const searchUser = await loadFreemiumUser((req as any).user.userId);
    const searchData = await applyFreemium(dbResults as any, searchUser as any);

    res.json({
      data: searchData,
      total,
      query,
      source: 'database',
      miningStarted,
      paid: hasPaidAccess(searchUser as any),
    });
  } catch (err: any) {
    logger.error('[FbAds] Erro na busca ao vivo:', err);
    res.status(500).json({ error: err.message || 'Erro na busca' });
  }
}

// ─── Receber anúncios da Extensão do Chrome ──────────────────────────────────

export async function syncExtension(req: Request, res: Response) {
  try {
    const { ads } = req.body;
    if (!Array.isArray(ads)) {
      return res.status(400).json({ error: 'Formato inválido. Esperado um array "ads".' });
    }

    let created = 0;
    let updated = 0;

    for (const item of ads) {
      if (!item.fbAdId) continue;

      const duplicatas = item.duplicatas || 0;
      const deliveryStartTime = item.deliveryStartTime ? new Date(item.deliveryStartTime) : null;
      const isActive = item.isActive !== false;

      const escala = calcEscala({ duplicatas, deliveryStartTime, isActive });

      const data = {
        pageName: item.pageName || null,
        pageProfilePic: item.pageProfilePic || null,
        adCopy: item.adCopy || null,
        adHeadline: item.adHeadline || null,
        adSnapshotUrl: item.adSnapshotUrl || null,
        destinationUrl: item.destinationUrl || null,
        deliveryStartTime,
        duplicatas,
        isActive,
        escala,
        checkout: detectCheckoutFromUrl(item.destinationUrl),
        scraperLastRun: new Date(),
      };

      const existing = await prisma.anuncioFacebook.findUnique({ where: { fbAdId: item.fbAdId } });
      if (existing) {
        await prisma.anuncioFacebook.update({ where: { fbAdId: item.fbAdId }, data });
        updated++;
      } else {
        await prisma.anuncioFacebook.create({ data: { fbAdId: item.fbAdId, ...data } });
        created++;
      }
    }

    res.json({ message: 'Sincronização da extensão concluída', created, updated });
  } catch (err: any) {
    logger.error('[FbAds] Erro ao sincronizar via extensão:', err);
    res.status(500).json({ error: err.message || 'Erro na sincronização' });
  }
}

// ─── Salvar anúncio individual via Extensão do Cliente ────────────────────────

export async function saveAdFromUser(req: Request, res: Response) {
  try {
    const { ad } = req.body;
    if (!ad || !ad.fbAdId) {
      return res.status(400).json({ error: 'Dados do anúncio inválidos ou faltando fbAdId.' });
    }

    const authReq = req as any;
    const userId: string | undefined = authReq.user?.userId;
    const featureLimit: number | null = authReq.featureLimit ?? null; // null = ilimitado (pago/admin)

    // Cota diária de garimpo para free. Re-garimpar anúncio já salvo não consome cota.
    if (userId && featureLimit !== null) {
      const jaGarimpado = await prisma.garimpoLog.findUnique({
        where: { userId_fbAdId: { userId, fbAdId: ad.fbAdId } },
      });
      if (!jaGarimpado) {
        const usadosHoje = await countGarimposToday(userId);
        if (usadosHoje >= featureLimit) {
          return res.status(403).json({
            error: 'garimpo_limit_reached',
            limit: featureLimit,
            used: usadosHoje,
            message: `Você atingiu o limite de ${featureLimit} garimpos por dia do plano Free. Assine para garimpar sem limite.`,
          });
        }
      }
    }

    const duplicatas = ad.duplicatas || 1;
    const deliveryStartTime = ad.deliveryStartTime ? new Date(ad.deliveryStartTime) : new Date();
    const isActive = ad.isActive !== false;

    const escala = calcEscala({ duplicatas, deliveryStartTime, isActive });

    const data = {
      pageName: ad.pageName || null,
      pageProfilePic: ad.pageProfilePic || null,
      adCopy: ad.adCopy || null,
      adHeadline: ad.adHeadline || null,
      adSnapshotUrl: ad.adSnapshotUrl || null,
      destinationUrl: ad.destinationUrl || null,
      deliveryStartTime,
      duplicatas,
      isActive,
      escala,
      checkout: detectCheckoutFromUrl(ad.destinationUrl),
      scraperLastRun: new Date(),
    };

    const existing = await prisma.anuncioFacebook.findUnique({ where: { fbAdId: ad.fbAdId } });

    if (existing) {
      await prisma.anuncioFacebook.update({ where: { fbAdId: ad.fbAdId }, data });
    } else {
      await prisma.anuncioFacebook.create({ data: { fbAdId: ad.fbAdId, ...data } });
    }

    // Registra o garimpo para a cota diária (idempotente por usuário+anúncio).
    if (userId) {
      await recordGarimpo(userId, ad.fbAdId);
    }

    res.json({ success: true, message: 'Anúncio salvo com sucesso no Scaleaki.' });
  } catch (err: any) {
    logger.error('[FbAds] Erro ao salvar anúncio do usuário:', err);
    res.status(500).json({ error: 'Erro interno ao salvar anúncio.' });
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

// ─── Atualizar Checkout de todos os anúncios existentes ───────────────────────

export async function backfillCheckouts(req: Request, res: Response) {
  try {
    const todos = await prisma.anuncioFacebook.findMany({
      where: {
        destinationUrl: { not: null },
        checkout: null
      },
      select: { id: true, destinationUrl: true },
    });

    let count = 0;
    for (const ad of todos) {
      const checkout = detectCheckoutFromUrl(ad.destinationUrl);
      if (checkout) {
        await prisma.anuncioFacebook.update({ where: { id: ad.id }, data: { checkout } });
        count++;
      }
    }

    res.json({ message: `Checkout detectado e atualizado em ${count} anúncios de ${todos.length} possíveis.`, count });
  } catch (err: any) {
    logger.error('[FbAds] Erro ao atualizar checkouts:', err);
    res.status(500).json({ error: 'Erro ao atualizar checkouts' });
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
      windowDays,
    } = req.query as Record<string, string>;

    const take = Math.min(Number(limit), 100);
    const skip = (Number(page) - 1) * take;

    const authReq = req as any; // tipagem rápida para pegar user
    const isAdmin = authReq.user?.role === 'admin';

    // Para usuários comuns (não-admins), forçamos escalaMin >= 30 (somente ofertas escaladas)
    let finalEscalaMin = escalaMin ? Number(escalaMin) : undefined;
    if (!isAdmin) {
      if (!finalEscalaMin || finalEscalaMin < 30) {
        finalEscalaMin = 30;
      }
    }

    const where: any = { isActive: status !== 'inactive' };
    if (checkout) where.checkout = checkout;
    if (finalEscalaMin !== undefined) where.escala = { gte: finalEscalaMin };
    if (duplicatasMin) where.duplicatas = { gte: Number(duplicatasMin) };

    // ── Janela de atividade ("busca ativa") ──────────────────────────────────
    // scraperLastRun = última vez que o garimpo CONFIRMOU o anúncio rodando na
    // biblioteca. Janela 3/7d mostra só o que está comprovadamente no ar agora.
    // Quem some da biblioteca para de ser re-confirmado e cai fora da janela.
    const allowedWindows = [3, 7, 14, 30];
    const win = windowDays ? Number(windowDays) : undefined;
    if (win && allowedWindows.includes(win)) {
      const cutoff = new Date(Date.now() - win * 86_400_000);
      where.scraperLastRun = { gte: cutoff };
    }

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

    const listUser = await loadFreemiumUser(authReq.user.userId);
    const listData = await applyFreemium(anuncios as any, listUser as any);

    res.json({
      data: listData,
      meta: { total, page: Number(page), limit: take, pages: Math.ceil(total / take) },
      paid: hasPaidAccess(listUser as any),
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

    const detailUser = await loadFreemiumUser((req as any).user.userId);
    const [detailData] = await applyFreemium([anuncio as any], detailUser as any);

    res.json(detailData);
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
