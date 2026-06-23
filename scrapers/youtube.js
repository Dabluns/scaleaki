/**
 * Scraper YouTube/Google Ads — criativos em veiculação no BR via Google Ads
 * Transparency Center (adstransparency.google.com). Não há API pública aberta
 * de YouTube ads; o Transparency Center é a base oficial do Google com todos os
 * anúncios veiculados, filtrável por região. É uma SPA cujos dados vêm de RPCs
 * internos (/anji/_/rpc/<Service>/<Method>) — mesma técnica do tiktok.js:
 * Puppeteer carrega a página (token/cookies presentes) e interceptamos o JSON.
 *
 * Fluxo:
 *  1. SearchService/SearchSuggestions por keyword → advertiserIds (AR...) do nicho.
 *  2. /advertiser/<AR>?region=BR → dispara SearchService/SearchCreatives → criativos.
 * Sem views públicas → escala = longevidade (firstSeen→lastSeen) + isActive.
 * Grava em ScaledAd (platform=youtube). R$0.
 *
 * Uso: node scrapers/youtube.js [--keywords=emagrecedor,relacionamento] [--perKeyword=3] [--maxAdvertisers=40] [--headless]
 */
const { launchBrowser, upsertByKeys, countRows, sleep, getArg } = require('./lib');

const args = process.argv.slice(2);
const HEADLESS = args.includes('--headless');
const KEYWORDS = getArg(args, 'keywords',
  'emagrecedor,relacionamento,renda extra,disfuncao,investimento,curso online,suplemento,beleza'
).split(',').map((s) => s.trim()).filter(Boolean);
const PER_KW = Number(getArg(args, 'perKeyword', '3')) || 3;       // anunciantes por keyword
const MAX_ADV = Number(getArg(args, 'maxAdvertisers', '40')) || 40; // teto total de segurança
const TABLE = 'ScaledAd';
const PLATFORM = 'youtube';
const BASE = 'https://adstransparency.google.com';

/** Extrai a primeira URL de imagem de um blob HTML "<img src=...>". */
function imgFromHtml(html) {
  if (!html || typeof html !== 'string') return null;
  const m = html.match(/src\s*=\s*"([^"]+)"/i);
  return m ? m[1] : null;
}

/** unix seconds (string|number) → ISO, ou null. */
function unixToIso(sec) {
  const n = Number(sec);
  if (!n || isNaN(n)) return null;
  const d = new Date(n * 1000);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Escala de criativo do Transparency Center. Não há views públicas; o sinal de
 * vencedor é LONGEVIDADE de veiculação (firstSeen→lastSeen) + se ainda está ativo
 * (visto nos últimos 7 dias). 0-100.
 *  - duração: 0-70, satura em ~120 dias de veiculação (log).
 *  - frescor: +30 se lastSeen nos últimos 7d (ainda rodando = ainda lucrando). */
function calcEscalaYoutube({ firstSeen, lastSeen }) {
  const first = firstSeen ? new Date(firstSeen).getTime() : NaN;
  const last = lastSeen ? new Date(lastSeen).getTime() : NaN;
  let duracao = 0;
  if (!isNaN(first) && !isNaN(last) && last >= first) {
    const dias = (last - first) / 86400000;
    duracao = Math.min(Math.log(1 + dias) / Math.log(1 + 120), 1) * 70; // 0-70
  }
  let frescor = 0;
  if (!isNaN(last)) {
    const diasDesdeUltimo = (Date.now() - last) / 86400000;
    if (diasDesdeUltimo <= 7) frescor = 30;
    else if (diasDesdeUltimo <= 30) frescor = 15;
  }
  return Math.round(duracao + frescor);
}

/** Normaliza um item de SearchCreatives (protobuf numerado).
 * 1=advertiserId, 2=creativeId, 3.3.2=html<img>, 6.1=firstSeen unix,
 * 7.1=lastSeen unix, 12=advertiser name. */
function mapCreative(it) {
  if (!it) return null;
  const advId = it['1'];
  const crId = it['2'];
  if (!crId) return null;
  const fmtBlock = it['3'] || {};
  const html = (fmtBlock['3'] && fmtBlock['3']['2']) || (fmtBlock['2'] && fmtBlock['2']['2']) || null;
  const firstSeen = it['6'] && unixToIso(it['6']['1']);
  const lastSeen = it['7'] && unixToIso(it['7']['1']);
  const advertiser = (it['12'] && String(it['12']).trim()) || null;
  const creativeUrl = advId ? `${BASE}/advertiser/${advId}/creative/${crId}?region=BR` : null;
  // ativo = visto nos últimos 30 dias (ainda em veiculação)
  const lastMs = lastSeen ? new Date(lastSeen).getTime() : NaN;
  const isActive = !isNaN(lastMs) ? (Date.now() - lastMs) / 86400000 <= 30 : false;
  return {
    platform: PLATFORM,
    externalId: String(crId),
    advertiser,
    title: advertiser ? `${advertiser} — criativo` : null,
    adCopy: null,
    thumbnailUrl: imgFromHtml(html),
    videoUrl: creativeUrl,   // página pública do criativo (player do Google)
    landingUrl: creativeUrl,
    views: 0,                // Transparency Center não expõe views
    likes: 0,
    shares: 0,
    ctaText: null,
    region: 'BR',
    firstSeen,
    lastSeen,
    isActive,
  };
}

/** Lê o array de itens de uma resposta RPC, tolerante a formatos. */
function itemsFrom(json, key) {
  const arr = json && json['1'];
  return Array.isArray(arr) ? arr : [];
}

async function run() {
  const t0 = Date.now();
  console.log(`🎬 YouTube/Google Ads Transparency — headless=${HEADLESS} keywords=[${KEYWORDS.join(', ')}] perKw=${PER_KW} maxAdv=${MAX_ADV}`);
  const { browser, page } = await launchBrowser(HEADLESS);

  const byKeyword = new Map();   // keyword → [{id,name}] na ordem retornada
  let currentKw = null;
  const creatives = new Map();
  page.on('response', async (res) => {
    const url = res.url();
    if (!/\/anji\/_\/rpc\/SearchService\//.test(url)) return;
    try {
      const json = await res.json();
      if (/SearchSuggestions/.test(url)) {
        // 1[].1.2 = advertiserId quando o item é um anunciante
        const list = byKeyword.get(currentKw) || [];
        itemsFrom(json).forEach((row) => {
          const adv = row && row['1'];
          const id = adv && adv['2'];
          const name = adv && adv['1'];
          const region = adv && adv['3'];
          if (id && String(id).startsWith('AR') && (!region || region === 'BR')) {
            list.push({ id: String(id), name: name || null });
          }
        });
        byKeyword.set(currentKw, list);
      } else if (/SearchCreatives/.test(url)) {
        itemsFrom(json).forEach((it) => { const m = mapCreative(it); if (m) creatives.set(m.externalId, m); });
      }
    } catch {}
  });

  // ── Fase 1: keywords → advertiserIds (agrupados por keyword) ──────
  for (const kw of KEYWORDS) {
    currentKw = kw;
    try {
      await page.goto(`${BASE}/?region=BR`, { waitUntil: 'networkidle2', timeout: 60000 });
      await sleep(2500);
      await page.evaluate(() => { const i = document.querySelector('input'); if (i) i.focus(); });
      await page.keyboard.type(kw, { delay: 70 });
      await sleep(2500); // dispara SearchSuggestions
    } catch (e) {
      console.error(`  ❌ kw "${kw}": ${e.message}`);
    }
    await sleep(800 + Math.floor(Math.random() * 800));
  }

  // Fila justa: até PER_KW anunciantes por keyword, dedup global, teto MAX_ADV.
  const seen = new Set();
  const advertisers = [];
  for (const kw of KEYWORDS) {
    let taken = 0;
    for (const a of (byKeyword.get(kw) || [])) {
      if (taken >= PER_KW) break;
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      advertisers.push({ ...a, kw });
      taken++;
      if (advertisers.length >= MAX_ADV) break;
    }
    if (advertisers.length >= MAX_ADV) break;
  }
  const totalSug = [...byKeyword.values()].reduce((n, l) => n + l.length, 0);
  console.log(`  🔎 ${advertisers.length} anunciantes na fila (de ${totalSug} sugestões em ${byKeyword.size} keywords)`);

  // ── Fase 2: advertiser → criativos ────────────────────────────────
  for (const adv of advertisers) {
    try {
      const before = creatives.size;
      await page.goto(`${BASE}/advertiser/${adv.id}?region=BR`, { waitUntil: 'networkidle2', timeout: 60000 });
      await sleep(3500);
      for (let i = 0; i < 3; i++) { await page.evaluate(() => window.scrollBy(0, 2500)); await sleep(1500); }
      console.log(`  • [${adv.kw}] ${adv.name || adv.id}: +${creatives.size - before} (total ${creatives.size})`);
    } catch (e) {
      console.error(`  ❌ adv ${adv.id}: ${e.message}`);
    }
    await sleep(1200 + Math.floor(Math.random() * 1200));
  }

  await browser.close();

  const items = [...creatives.values()];
  const rows = items.map((it) => ({
    ...it,
    escala: calcEscalaYoutube({ firstSeen: it.firstSeen, lastSeen: it.lastSeen }),
    scraperLastRun: new Date().toISOString(),
  }));

  let created = 0, updated = 0;
  if (rows.length) ({ created, updated } = await upsertByKeys(TABLE, rows, ['platform', 'externalId']));
  const total = await countRows(TABLE);
  console.log(`\n✅ YouTube FIM em ${Math.round((Date.now() - t0) / 1000)}s — coletados=${items.length} criados=${created} atualizados=${updated} | tabela total=${total}`);
  if (items.length === 0) console.log('  🔬 zero criativos — rodar sem --headless pra inspecionar (layout/região pode ter mudado).');
}

run().catch((e) => { console.error('❌ Fatal:', e.message); process.exit(1); });
