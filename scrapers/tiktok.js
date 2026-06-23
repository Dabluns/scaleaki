/**
 * Scraper TikTok Creative Center — Top Ads em alta no BR.
 * A API creative_radar_api exige token anti-bot (40101 sem ele, in-page fetch
 * NÃO funciona) → carrega a página do Creative Center com Puppeteer e intercepta
 * as respostas JSON que o próprio frontend dispara (token/cookies presentes).
 * Sem login o CC entrega só ~3 ads por combo de filtro → iteramos os períodos
 * (7/30/180d), cada navegação dispara XHR autenticado que interceptamos.
 * Grava em ScaledAd (platform=tiktok). R$0.
 *
 * Uso: node scrapers/tiktok.js [--periods=7,30,180] [--headless]
 */
const { launchBrowser, upsertByKeys, calcEscalaAd, countRows, sleep, getArg } = require('./lib');

const args = process.argv.slice(2);
const HEADLESS = args.includes('--headless');
const PERIODS = getArg(args, 'periods', '7,30,180').split(',').map((s) => s.trim()).filter(Boolean);
const TABLE = 'ScaledAd';
const PLATFORM = 'tiktok';
const CC_BASE = 'https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en';

/** Normaliza um item da resposta top_ads/v2/list.
 * Campos reais (jun/2026): ad_title, brand_name, like, cost, ctr, video_info{vid,cover,video_url}.
 * NÃO há view_count — usamos like como proxy de tração. */
function mapItem(it) {
  if (!it) return null;
  const v = it.video_info || {};
  const id = it.id || it.item_id || v.vid;
  if (!id) return null;
  const likes = Number(it.like || 0) || 0;
  return {
    platform: PLATFORM,
    externalId: String(id),
    advertiser: (it.brand_name && it.brand_name.trim()) || null,
    title: (it.ad_title || '').slice(0, 500) || null,
    adCopy: (it.ad_title || '').slice(0, 2000) || null,
    thumbnailUrl: v.cover || null,
    videoUrl: (v.video_url && (v.video_url['720p'] || v.video_url['480p'] || Object.values(v.video_url)[0])) || null,
    landingUrl: null,
    views: likes,            // proxy: TikTok CC não expõe views
    likes,
    shares: 0,
    ctaText: null,
    region: 'BR',
    isActive: true,
  };
}

async function run() {
  const t0 = Date.now();
  console.log(`🎵 TikTok Creative Center — headless=${HEADLESS} periods=[${PERIODS.join(',')}]`);
  const { browser, page } = await launchBrowser(HEADLESS);

  // Intercepta respostas da API em qualquer navegação.
  const collected = new Map();
  page.on('response', async (res) => {
    const url = res.url();
    if (!/creative_radar_api\/.*top_ads/.test(url)) return;
    try {
      const json = await res.json();
      const list = (json && json.data && (json.data.materials || json.data.list || json.data.ad_list)) || [];
      list.forEach((it) => { const m = mapItem(it); if (m) collected.set(m.externalId, m); });
    } catch {}
  });

  // Itera períodos. Cada navegação dispara XHR autenticado que interceptamos.
  for (const period of PERIODS) {
    const qs = new URLSearchParams({ period: String(period), region: 'BR', ad_format: '1', ad_language: 'pt' });
    const url = `${CC_BASE}?${qs}`;
    try {
      const before = collected.size;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await sleep(3000);
      await page.evaluate(() => window.scrollBy(0, 2000));
      await sleep(2500);
      console.log(`  • period=${period}d: +${collected.size - before} (total ${collected.size})`);
    } catch (e) {
      console.error(`  ❌ period=${period}d: ${e.message}`);
    }
    await sleep(2500 + Math.floor(Math.random() * 2000));
  }

  await browser.close();

  const items = [...collected.values()];
  const rows = items.map((it) => ({
    ...it,
    firstSeen: null,
    escala: calcEscalaAd({ views: it.views, firstSeen: null, isActive: it.isActive }),
    scraperLastRun: new Date().toISOString(),
  }));

  let created = 0, updated = 0;
  if (rows.length) ({ created, updated } = await upsertByKeys(TABLE, rows, ['platform', 'externalId']));
  const total = await countRows(TABLE);
  console.log(`\n✅ TikTok FIM em ${Math.round((Date.now() - t0) / 1000)}s — coletados=${items.length} criados=${created} atualizados=${updated} | tabela total=${total}`);
  if (items.length === 0) console.log('  🔬 zero itens — token anti-bot pode ter bloqueado; rodar sem --headless pra inspecionar.');
}

run().catch((e) => { console.error('❌ Fatal:', e.message); process.exit(1); });
