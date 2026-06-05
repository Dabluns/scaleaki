/**
 * Scraper autônomo da Meta Ad Library — R$0, sem API externa.
 * Abre Chrome (Puppeteer), busca cada nicho, auto-scroll, extrai anúncios
 * e grava direto no Supabase via Prisma. Roda diário via Task Scheduler (9h).
 *
 * Uso: node scraper-auto.js [--keywords="emagrecimento,calvicie"] [--max-scrolls=25] [--headless]
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let puppeteer;
try {
  puppeteer = require('puppeteer-extra');
  puppeteer.use(require('puppeteer-extra-plugin-stealth')());
} catch { puppeteer = require('puppeteer'); }
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const TABLE = 'AnuncioFacebook';

// ───────── Config ─────────
const args = process.argv.slice(2);
const getArg = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
const COUNTRY = getArg('country', 'BR');
const MAX_SCROLLS = parseInt(getArg('max-scrolls', '25'), 10);
const SCROLL_WAIT = parseInt(getArg('scroll-wait', '2500'), 10);
const HEADLESS = args.includes('--headless');
const CLI_KEYWORDS = getArg('keywords', '');
const NICHE = getArg('niche', '');
const KEYWORDS_FILE = path.join(__dirname, 'keywords.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ───────── Checkout signatures (espelho do service) ─────────
const SIG = [
  [/hotmart\.com|pay\.hotmart\.com|go\.hotmart\.com|hotm\.art/i, 'Hotmart'],
  [/kiwify\.com\.br|pay\.kiwify\.com\.br/i, 'Kiwify'],
  [/myshopify\.com|checkout\.shopify\.com|shopify\.com/i, 'Shopify'],
  [/yampi\.com\.br|checkout\.yampi\.com\.br/i, 'Yampi'],
  [/cartpanda\.com|pay\.cartpanda\.com/i, 'CartPanda'],
  [/perfectpay\.com\.br|pay\.perfectpay\.com\.br/i, 'PerfectPay'],
  [/eduzz\.com|pay\.eduzz\.com|nutror\.com/i, 'Eduzz'],
  [/monetizze\.com\.br|ev\.monetizze\.com\.br/i, 'Monetizze'],
  [/herospark\.com|pay\.herospark\.com/i, 'HeroSpark'],
  [/guru\.com\.br|checkout\.guru\.com\.br/i, 'Guru'],
  [/braip\.com|checkout\.braip\.com/i, 'Braip'],
  [/ticto\.com\.br|pay\.ticto\.com\.br/i, 'Ticto'],
  [/lastlink\.com/i, 'Lastlink'], [/doppus\.com/i, 'Doppus'], [/pepper\.com\.br/i, 'Pepper'],
  [/appmax\.com\.br/i, 'Appmax'], [/payt\.com\.br/i, 'Payt'], [/tribopay\.com\.br/i, 'TriboPay'],
  [/intellipay\.com\.br/i, 'IntelliPay'], [/mercadopago\.com/i, 'Mercado Pago'],
  [/buy\.stripe\.com|checkout\.stripe\.com/i, 'Stripe'],
];
const detectCheckout = (url) => { if (!url) return null; for (const [re, n] of SIG) if (re.test(url)) return n; return null; };
const calcEscala = ({ duplicatas, deliveryStartTime, isActive }) => {
  const dup = Math.min(Math.log(1 + duplicatas) / Math.log(21), 1) * 50;
  let dias = 0;
  if (deliveryStartTime) { const s = new Date(deliveryStartTime).getTime(); if (!isNaN(s)) dias = Math.min(Math.max(0, (Date.now() - s) / 86400000) / 90, 1) * 30; }
  return Math.round(dup + dias + (isActive ? 20 : 0));
};

// ───────── Extração do DOM (roda no contexto da página) ─────────
function extractAdsInPage() {
  const PT_MONTHS = { jan:0, fev:1, mar:2, abr:3, mai:4, jun:5, jul:6, ago:7, set:8, out:9, nov:10, dez:11,
    janeiro:0, fevereiro:1, março:2, marco:2, abril:3, maio:4, junho:5, julho:6, agosto:7, setembro:8, outubro:9, novembro:10, dezembro:11 };
  function parseStart(text) {
    const m = text.match(/Veicula[çc][ãa]o iniciada em\s+(\d{1,2})\s+de\s+([a-zç]+)\.?\s+de\s+(\d{4})/i);
    if (!m) return null;
    const d = parseInt(m[1], 10); const mo = PT_MONTHS[m[2].toLowerCase()]; const y = parseInt(m[3], 10);
    if (mo === undefined) return null;
    return new Date(Date.UTC(y, mo, d)).toISOString();
  }
  const LIB_RE = /(?:Identifica[çc][ãa]o da biblioteca|Library ID|Identificador de la biblioteca)\s*[:：]/i;
  const DETAIL_RE = /(Ver detalhes do an[úu]ncio|See ad details|Ver detalles del anuncio|Veicula[çc][ãa]o iniciada|Started running|Empez[óo] a publicarse)/i;
  const ads = [];
  const els = document.querySelectorAll('span, div');
  els.forEach(el => {
    const text = el.innerText;
    if (!text || text.length > 80 || !LIB_RE.test(text)) return;
    if (el.children.length > 1) return;
    const fbAdId = text.replace(/[^\d]/g, '');
    if (!fbAdId) return;
    let container = el, found = false;
    for (let i = 0; i < 18; i++) {
      if (!container.parentElement) break;
      container = container.parentElement;
      const t = container.innerText || '';
      if (DETAIL_RE.test(t) && t.length > 250 && t.length < 6000) { found = true; break; }
    }
    if (!found) return;
    const allText = container.innerText;
    let pageName = 'Desconhecido';
    const links = container.querySelectorAll('a[href*="facebook.com/"]');
    for (const link of links) {
      if (link.innerText && !link.href.includes('/ads/library') && link.innerText.length > 2) { pageName = link.innerText.trim(); break; }
    }
    if (pageName === 'Desconhecido') {
      const lines = allText.split('\n');
      for (let i = 0; i < lines.length; i++) { if (/Patrocinado|Sponsored|Patrocinad/.test(lines[i]) && i > 0) { pageName = lines[i - 1].trim(); break; } }
    }
    const isActive = !/\bInativo\b|\bInactive\b|\bInactivo\b/.test(allText);
    let duplicatas = 1;
    const dup = allText.match(/(\d+)\s+(?:an[úu]ncios?\s+usam|ads?\s+use|anuncios?\s+usan)/i);
    if (dup) duplicatas = parseInt(dup[1], 10);
    let adCopy = '';
    const spIdx = allText.search(/\b(Patrocinado|Sponsored|Patrocinad\w*)\b/);
    if (spIdx >= 0) adCopy = allText.slice(spIdx).replace(/^\S+\s*/, '').trim();
    if (adCopy.length < 20) {
      let best = '';
      container.querySelectorAll('div[dir="auto"], span[dir="auto"]').forEach(p => { const t = (p.innerText || '').trim(); if (t.length > best.length && !LIB_RE.test(t)) best = t; });
      adCopy = best;
    }
    adCopy = adCopy.split(/\n(?:Ver detalhes|See ad details|Saiba mais|Learn more|Comprar agora|Shop now|Enviar mensagem|Send message|Cadastre-se|Sign up|Abrir menu)/i)[0].trim();
    // criativo = maior imagem fbcdn (exclui avatar 60x60); fallback video poster
    let adSnapshotUrl = null, bestW = 0;
    container.querySelectorAll('img').forEach(im => {
      const w = im.naturalWidth || im.clientWidth || 0;
      if (im.src && im.src.includes('fbcdn') && w >= 120 && w > bestW) { bestW = w; adSnapshotUrl = im.src; }
    });
    if (!adSnapshotUrl) { const v = container.querySelector('video'); if (v && v.poster) adSnapshotUrl = v.poster; }
    let destinationUrl = null;
    const ext = container.querySelector('a[href*="l.facebook.com/l.php"], a[href^="http"]:not([href*="facebook.com"])');
    if (ext) {
      try { const u = new URL(ext.href); destinationUrl = u.searchParams.get('u') ? decodeURIComponent(u.searchParams.get('u')) : ext.href; } catch { destinationUrl = ext.href; }
    }
    ads.push({ fbAdId, pageName: pageName.substring(0, 100), adCopy: adCopy.trim().substring(0, 4000), adSnapshotUrl, destinationUrl, libraryUrl: 'https://www.facebook.com/ads/library/?id=' + fbAdId, isActive, duplicatas, deliveryStartTime: parseStart(allText) });
  });
  return ads;
}

async function scrapeKeyword(page, kw) {
  const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${COUNTRY}&q=${encodeURIComponent(kw)}&media_type=all&search_type=keyword_unordered`;
  console.log(`\n🔎 "${kw}" → ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
  await sleep(4000);
  const seen = new Map();
  let stale = 0;
  for (let i = 0; i < MAX_SCROLLS; i++) {
    let batch = [];
    try { batch = await page.evaluate(extractAdsInPage); } catch {}
    let novos = 0;
    for (const ad of batch) { if (!seen.has(ad.fbAdId)) { seen.set(ad.fbAdId, ad); novos++; } else { const prev = seen.get(ad.fbAdId); if ((ad.duplicatas || 0) > (prev.duplicatas || 0)) seen.set(ad.fbAdId, ad); } }
    process.stdout.write(`  scroll ${i + 1}/${MAX_SCROLLS} +${novos} (total ${seen.size})\r`);
    stale = novos === 0 ? stale + 1 : 0;
    if (stale >= 4) break;
    await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
    await sleep(SCROLL_WAIT);
  }
  console.log(`\n  ✓ "${kw}": ${seen.size} anúncios coletados`);
  if (seen.size === 0) {
    const diag = await page.evaluate(() => {
      const b = document.body ? document.body.innerText : '';
      return {
        title: document.title,
        url: location.href,
        loginWall: /Entrar no Facebook|Log in to Facebook|Iniciar sesión|You must log in|Conecte-se/i.test(b),
        libHits: (b.match(/biblioteca|Library ID/gi) || []).length,
        noResults: /Nenhum resultado|No results|0 resultados|Sem resultados/i.test(b),
        bodyLen: b.length,
        sample: b.slice(0, 200).replace(/\n/g, ' '),
      };
    }).catch(() => ({}));
    console.log(`  🔬 diag: ${JSON.stringify(diag)}`);
  }
  return [...seen.values()];
}

async function countAds(filter) {
  let q = supabase.from(TABLE).select('*', { count: 'exact', head: true });
  if (filter === 'e30') q = q.gte('escala', 30);
  const { count } = await q;
  return count || 0;
}

const BUCKET = 'ad-creatives';
const STORE_PREFIX = `/storage/v1/object/public/${BUCKET}/`;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Baixa o criativo do FB CDN (URL expira) e salva no Supabase Storage -> URL persistente.
async function storeImage(fbAdId, url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': 'https://www.facebook.com/' } });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || 'image/jpeg';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 1500) return null; // descarta placeholder/erro
    const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg';
    const path = `${fbAdId}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: ct, upsert: true });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch { return null; }
}

// Grava via Supabase REST (IPv4 — funciona local e no GitHub Actions).
// id nao tem default no DB (Prisma gera client-side) -> geramos uuid pra inserts.
async function upsertAds(ads) {
  let created = 0, updated = 0, imgs = 0;
  const ids = ads.map(a => a.fbAdId);
  const existing = new Map(); // fbAdId -> adSnapshotUrl atual
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await supabase.from(TABLE).select('fbAdId,adSnapshotUrl').in('fbAdId', ids.slice(i, i + 300));
    (data || []).forEach(r => existing.set(r.fbAdId, r.adSnapshotUrl));
  }

  const mapData = (ad, storedImg) => ({
    pageName: ad.pageName || null,
    adCopy: ad.adCopy || null,
    adSnapshotUrl: storedImg || null,
    destinationUrl: ad.destinationUrl || null,
    libraryUrl: ad.libraryUrl || null,
    deliveryStartTime: ad.deliveryStartTime ? new Date(ad.deliveryStartTime).toISOString() : null,
    duplicatas: ad.duplicatas || 0,
    isActive: ad.isActive !== false,
    escala: calcEscala({ duplicatas: ad.duplicatas || 0, deliveryStartTime: ad.deliveryStartTime, isActive: ad.isActive !== false }),
    checkout: detectCheckout(ad.destinationUrl),
    scraperLastRun: new Date().toISOString(),
  });

  for (const a of ads) {
    const isNew = !existing.has(a.fbAdId);
    const cur = existing.get(a.fbAdId);
    const alreadyStored = cur && cur.includes(STORE_PREFIX);
    // baixa criativo se: tem url raw do FB e ainda nao salvamos esse anuncio
    let storedImg = alreadyStored ? cur : null;
    if (!storedImg && a.adSnapshotUrl && a.adSnapshotUrl.includes('fbcdn')) {
      storedImg = await storeImage(a.fbAdId, a.adSnapshotUrl);
      if (storedImg) imgs++;
    }
    if (isNew) {
      const { error } = await supabase.from(TABLE).insert({ id: crypto.randomUUID(), fbAdId: a.fbAdId, ...mapData(a, storedImg), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      if (!error) created++; else console.error('  insert err:', error.message);
    } else {
      const { error } = await supabase.from(TABLE).update({ ...mapData(a, storedImg), updatedAt: new Date().toISOString() }).eq('fbAdId', a.fbAdId);
      if (!error) updated++;
    }
  }
  return { created, updated, imgs };
}

(async () => {
  const t0 = Date.now();
  let keywords;
  if (CLI_KEYWORDS) {
    keywords = CLI_KEYWORDS.split(',').map(s => s.trim()).filter(Boolean);
  } else {
    const bank = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));
    if (NICHE) {
      const key = Object.keys(bank).find(k => k.toLowerCase() === NICHE.toLowerCase());
      keywords = key ? bank[key] : [];
    } else {
      keywords = Object.values(bank).flat();
    }
  }
  keywords = [...new Set(keywords)];
  console.log(`🤖 Scraper Ad Library — país=${COUNTRY} headless=${HEADLESS} keywords=[${keywords.join(', ')}]`);

  const browser = await puppeteer.launch({ headless: HEADLESS ? 'new' : false, defaultViewport: null, args: ['--start-maximized', '--no-sandbox'] });
  const page = (await browser.pages())[0] || await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36');
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8' });
  await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'language', { get: () => 'pt-BR' }); Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en'] }); });

  let allCreated = 0, allUpdated = 0, allCollected = 0;
  for (const kw of keywords) {
    try {
      const ads = await scrapeKeyword(page, kw);
      allCollected += ads.length;
      const { created, updated, imgs } = await upsertAds(ads);
      allCreated += created; allUpdated += updated;
      console.log(`  💾 "${kw}": ${created} novos, ${updated} atualizados, ${imgs} imgs`);
    } catch (e) { console.error(`  ❌ "${kw}": ${e.message}`); }
  }

  await browser.close();
  const total = await countAds();
  const e30 = await countAds('e30');
  console.log(`\n✅ FIM em ${Math.round((Date.now() - t0) / 1000)}s — coletados=${allCollected} criados=${allCreated} atualizados=${allUpdated} | banco total=${total} escala>=30=${e30}`);
})().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
