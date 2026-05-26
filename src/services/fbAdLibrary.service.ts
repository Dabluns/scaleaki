import axios from 'axios';
import prisma from '../config/database';
import logger from '../config/logger';

const FB_BASE = `https://graph.facebook.com/${process.env.FB_API_VERSION || 'v25.0'}`;
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN!;

/**
 * Calcula o índice de escala de 0 a 100 com base em:
 *  - Duplicatas (peso 50): escala logarítmica, saturando em ~20 cópias
 *  - Dias no ar (peso 30): linear, satura em 90 dias
 *  - Anúncio ativo (peso 20): bônus fixo
 */
export function calcEscala(params: {
  duplicatas: number;
  deliveryStartTime: Date | string | null;
  isActive: boolean;
}): number {
  const { duplicatas, deliveryStartTime, isActive } = params;

  // ── Duplicatas (0–50 pts) ──────────────────────────────────────
  // log(1+n)/log(21) normaliza de 0 a 1 para n em [0,20]
  const dupScore = Math.min(Math.log(1 + duplicatas) / Math.log(21), 1) * 50;

  // ── Dias no ar (0–30 pts) ─────────────────────────────────────
  let diasScore = 0;
  if (deliveryStartTime) {
    const start = new Date(deliveryStartTime).getTime();
    if (!isNaN(start)) {
      const daysOnAir = Math.max(0, (Date.now() - start) / 86_400_000);
      diasScore = Math.min(daysOnAir / 90, 1) * 30;
    }
  }

  // ── Ativo (0–20 pts) ─────────────────────────────────────────
  const ativoScore = isActive ? 20 : 0;

  return Math.round(dupScore + diasScore + ativoScore);
}


export interface FbAdResult {
  id: string;
  page_id?: string;
  page_name?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_descriptions?: string[];
  ad_snapshot_url?: string;
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  publisher_platforms?: string[];
  spend?: { lower_bound: string; upper_bound: string };
  impressions?: { lower_bound: string; upper_bound: string };
  currency?: string;
}

/**
 * Busca anúncios da Ad Library API oficial.
 * Usa upsert com fbAdId como chave — nunca cria duplicatas.
 */
export async function syncAdsFromLibrary(params: {
  searchTerms?: string;
  adType?: string;
  countries?: string[];
  adActiveStatus?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  pageIds?: string[];
  limit?: number;
}) {
  const {
    adType = 'ALL',
    countries = ['BR'],
    adActiveStatus = 'ACTIVE',
    pageIds,
    limit = 50,
  } = params;

  let searchTerms = params.searchTerms || '';
  if (!searchTerms.trim() && (!pageIds || pageIds.length === 0)) {
    searchTerms = 'oferta';
  }

  const fields = [
    'id',
    'page_id',
    'page_name',
    'ad_creative_bodies',
    'ad_creative_link_titles',
    'ad_creative_link_captions',
    'ad_creative_link_descriptions',
    'ad_snapshot_url',
    'ad_delivery_start_time',
    'ad_delivery_stop_time',
    'publisher_platforms',
    'spend',
    'impressions',
    'currency',
  ].join(',');

  const queryParams: Record<string, string> = {
    access_token: ACCESS_TOKEN,
    ad_type: adType,
    ad_reached_countries: JSON.stringify(countries),
    ad_active_status: adActiveStatus,
    fields,
    limit: String(limit),
  };

  if (searchTerms) queryParams.search_terms = searchTerms;
  if (pageIds?.length) queryParams.search_page_ids = pageIds.join(',');

  logger.info('[FbAdLibrary] Iniciando sync com Ad Library API', { searchTerms, adActiveStatus });

  const response = await axios.get(`${FB_BASE}/ads_archive`, { params: queryParams });
  const ads: FbAdResult[] = response.data?.data || [];

  logger.info(`[FbAdLibrary] ${ads.length} anúncios recebidos da API`);

  let created = 0;
  let updated = 0;

  for (const ad of ads) {
    const data = {
      pageId: ad.page_id,
      pageName: ad.page_name,
      adCopy: ad.ad_creative_bodies?.[0] ?? null,
      adHeadline: ad.ad_creative_link_titles?.[0] ?? null,
      adCaption: ad.ad_creative_link_captions?.[0] ?? null,
      adDescription: ad.ad_creative_link_descriptions?.[0] ?? null,
      adSnapshotUrl: ad.ad_snapshot_url ?? null,
      deliveryStartTime: ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time) : null,
      deliveryStopTime: ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : null,
      publisherPlatforms: ad.publisher_platforms ? JSON.stringify(ad.publisher_platforms) : null,
      spendRange: ad.spend ? `${ad.spend.lower_bound}-${ad.spend.upper_bound}` : null,
      impressionsRange: ad.impressions ? `${ad.impressions.lower_bound}-${ad.impressions.upper_bound}` : null,
      currency: ad.currency ?? null,
    };

    const existing = await prisma.anuncioFacebook.findUnique({ where: { fbAdId: ad.id } });

    if (existing) {
      await prisma.anuncioFacebook.update({ where: { fbAdId: ad.id }, data });
      updated++;
    } else {
      await prisma.anuncioFacebook.create({ data: { fbAdId: ad.id, ...data } });
      created++;

      // Enriquecer com dados da página em background (não bloqueia)
      enrichPageData(ad.id, ad.page_id).catch(() => {});
    }
  }

  logger.info(`[FbAdLibrary] Sync concluído — criados: ${created}, atualizados: ${updated}`);
  return { created, updated, total: ads.length };
}

/**
 * Busca curtidas e foto da página via Graph API e salva no registro.
 */
export async function enrichPageData(fbAdId: string, pageId?: string) {
  if (!pageId) return;

  try {
    const response = await axios.get(`${FB_BASE}/${pageId}`, {
      params: {
        fields: 'fan_count,picture',
        access_token: ACCESS_TOKEN,
      },
    });

    const { fan_count, picture } = response.data;

    await prisma.anuncioFacebook.update({
      where: { fbAdId },
      data: {
        pageLikes: fan_count ?? null,
        pageProfilePic: picture?.data?.url ?? null,
      },
    });

    logger.info(`[FbAdLibrary] Página enriquecida: ${pageId} — likes: ${fan_count}`);
  } catch (err: any) {
    logger.warn(`[FbAdLibrary] Falha ao enriquecer página ${pageId}: ${err.message}`);
  }
}

/**
 * Polling para aguardar a execução do scraper do Apify concluir.
 */
async function pollApifyRun(runId: string, token: string): Promise<string> {
  const maxRetries = 60; // 60 * 5s = 300s max
  for (let i = 0; i < maxRetries; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      const res = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
      const status = res.data?.data?.status;
      logger.info(`[Apify] Checando status da execução ${runId}: ${status}`);
      if (status === 'SUCCEEDED') {
        return res.data?.data?.defaultDatasetId;
      }
      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`A execução do Apify terminou com status: ${status}`);
      }
    } catch (err: any) {
      logger.error(`[Apify] Erro ao obter status da execução: ${err.message}`);
      if (i === maxRetries - 1) throw err;
    }
  }
  throw new Error('A execução do Apify expirou (timeout de 300 segundos).');
}

/**
 * Executa uma busca ao vivo na biblioteca do Facebook via Apify.
 * Aguarda a conclusão e retorna os itens mapeados (sem salvar no banco).
 */
export async function liveSearchFromApify(params: {
  searchTerms: string;
  countries?: string[];
  limit?: number;
}): Promise<any[]> {
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('APIFY_TOKEN não configurado.');

  const { searchTerms, countries = ['BR'], limit = 30 } = params;
  const country = countries[0] || 'BR';
  const searchUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&q=${encodeURIComponent(searchTerms)}&media_type=all`;

  logger.info('[Apify][LiveSearch] Iniciando busca ao vivo', { searchTerms, limit });

  const runRes = await axios.post(
    `https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/runs?token=${token}`,
    { urls: [{ url: searchUrl }], limit }
  );

  const runId = runRes.data?.data?.id;
  if (!runId) throw new Error('Falha ao iniciar execução no Apify.');

  // Aguarda conclusão (síncrono, max 5 min)
  const datasetId = await pollApifyRun(runId, token);
  const itemsRes = await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`);
  const items: any[] = itemsRes.data || [];

  logger.info(`[Apify][LiveSearch] ${items.length} anúncios recebidos para "${searchTerms}"`);

  // Mapeia para o formato do frontend (sem salvar no banco)
  return items
    .filter(item => item.ad_archive_id || item.id)
    .map(item => {
      const fbAdId = String(item.ad_archive_id || item.id);
      return {
        id: fbAdId,
        fbAdId,
        pageName: item.page_name || item.pageName || item.snapshot?.page_name || null,
        pageId: item.page_id || item.pageId || null,
        pageProfilePic: item.snapshot?.page_profile_picture_url || null,
        pageLikes: item.snapshot?.page_like_count || null,
        adCopy: item.snapshot?.body?.text || item.body_text || item.text || null,
        adHeadline: item.snapshot?.title || item.title || null,
        adSnapshotUrl: item.ad_snapshot_url || item.snapshotUrl || null,
        destinationUrl: item.snapshot?.link_url || item.link_url || item.landing_page_url || null,
        libraryUrl: item.ad_library_url || null,
        publisherPlatforms: item.publisher_platform
          ? JSON.stringify(item.publisher_platform)
          : item.publisher_platforms
            ? JSON.stringify(item.publisher_platforms)
            : null,
        deliveryStartTime: item.start_date_formatted
          ? new Date(item.start_date_formatted).toISOString()
          : item.start_date
            ? new Date(item.start_date * 1000).toISOString()
            : null,
        deliveryStopTime: null,
        spendRange: null,
        currency: item.currency || null,
        duplicatas: item.collation_count || 0,
        escala: null,
        isActive: true,
        checkout: null,
        tecnologia: null,
        activePixels: null,
        funnelSubdomains: null,
        externalServices: null,
        landingScreenshot: null,
        urlscanUuid: null,
        urlscanLastRun: null,
        scraperLastRun: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // flag para indicar que é resultado ao-vivo, não está no BD
        _isLive: true,
      };
    });
}


export async function syncAdsFromApify(params: {
  searchTerms?: string;
  countries?: string[];
  limit?: number;
}) {
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('APIFY_TOKEN não está configurado nas variáveis de ambiente.');
  }

  const { searchTerms = 'oferta', countries = ['BR'], limit = 50 } = params;

  logger.info('[Apify] Iniciando execução do scraper da Ad Library (curious_coder)', { searchTerms, countries, limit });

  const country = countries[0] || 'BR';
  const searchUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&q=${encodeURIComponent(searchTerms)}&media_type=all`;

  // Inicia a execução do actor curious_coder/facebook-ads-library-scraper
  const runRes = await axios.post(`https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/runs?token=${token}`, {
    urls: [{ url: searchUrl }],
    limit: limit,
  });

  const runId = runRes.data?.data?.id;
  const defaultDatasetId = runRes.data?.data?.defaultDatasetId;

  if (!runId || !defaultDatasetId) {
    throw new Error('Falha ao iniciar execução no Apify (runId ou datasetId inválidos).');
  }

  logger.info(`[Apify] Scraper iniciado com sucesso. RunID: ${runId}. Aguardando conclusão...`);

  // Executa o processamento do dataset em background
  (async () => {
    try {
      const datasetId = await pollApifyRun(runId, token);
      logger.info(`[Apify] Execução concluída. Dataset ID: ${datasetId}. Baixando itens...`);

      const itemsRes = await axios.get(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`);
      const items = itemsRes.data || [];
      logger.info(`[Apify] ${items.length} itens recebidos do dataset.`);

      let created = 0;
      let updated = 0;

      for (const item of items) {
        if (!item.ad_archive_id && !item.id) continue;

        const fbAdId = String(item.ad_archive_id || item.id);
        const duplicatas = item.collation_count || item.duplicatas || 0;
        const deliveryStartTime = item.start_date_formatted
          ? new Date(item.start_date_formatted)
          : item.start_date
            ? new Date(item.start_date * 1000)
            : item.ad_delivery_start_time
              ? new Date(item.ad_delivery_start_time)
              : null;
        const isActive = !item.end_date && !item.end_date_formatted && !item.ad_delivery_stop_time;

        const escala = calcEscala({ duplicatas, deliveryStartTime, isActive });

        const data = {
          pageId: item.page_id || item.pageId || item.snapshot?.page_id || null,
          pageName: item.page_name || item.pageName || item.snapshot?.page_name || null,
          adCopy: item.snapshot?.body?.text || item.body_text || item.text || item.ad_body_text || null,
          adHeadline: item.snapshot?.title || item.title || item.ad_headline || item.ad_creative_link_titles?.[0] || null,
          adCaption: item.snapshot?.caption || item.ad_creative_link_captions?.[0] || null,
          adDescription: item.snapshot?.link_description || item.ad_creative_link_descriptions?.[0] || null,
          adSnapshotUrl: item.ad_snapshot_url || item.snapshotUrl || item.ad_library_url || null,
          destinationUrl: item.snapshot?.link_url || item.link_url || item.landing_page_url || null,
          libraryUrl: item.ad_library_url || item.library_url || null,
          publisherPlatforms: item.publisher_platform ? JSON.stringify(item.publisher_platform) : item.publisher_platforms ? JSON.stringify(item.publisher_platforms) : null,
          deliveryStartTime,
          deliveryStopTime: item.end_date_formatted
            ? new Date(item.end_date_formatted)
            : item.end_date
              ? new Date(item.end_date * 1000)
              : item.ad_delivery_stop_time
                ? new Date(item.ad_delivery_stop_time)
                : null,
          spendRange: item.spend ? (typeof item.spend === 'object' ? `${item.spend.lower_bound}-${item.spend.upper_bound}` : String(item.spend)) : null,
          impressionsRange: item.impressions ? (typeof item.impressions === 'object' ? `${item.impressions.lower_bound}-${item.impressions.upper_bound}` : String(item.impressions)) : null,
          currency: item.currency || null,
          pageProfilePic: item.snapshot?.page_profile_picture_url || item.pageProfilePic || null,
          pageLikes: item.snapshot?.page_like_count || item.pageLikes || null,
          duplicatas,
          isActive,
          escala,
          scraperLastRun: new Date(),
        };

        const existing = await prisma.anuncioFacebook.findUnique({ where: { fbAdId } });
        if (existing) {
          await prisma.anuncioFacebook.update({ where: { fbAdId }, data });
          updated++;
        } else {
          await prisma.anuncioFacebook.create({ data: { fbAdId, ...data } });
          created++;
          enrichPageData(fbAdId, data.pageId).catch(() => {});
        }
      }

      logger.info(`[Apify] Sincronização concluída via Scraper: ${created} criados, ${updated} atualizados.`);
    } catch (err: any) {
      logger.error(`[Apify] Erro na execução em segundo plano do scraper: ${err.message}`);
    }
  })();

  return { runId, defaultDatasetId };
}
