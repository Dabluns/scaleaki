import axios from 'axios';
import prisma from '../config/database';
import logger from '../config/logger';

const FB_BASE = `https://graph.facebook.com/${process.env.FB_API_VERSION || 'v25.0'}`;
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN!;

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
