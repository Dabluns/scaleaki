/**
 * Scraper AliExpress — produtos em alta no BR (dropshipping).
 * fn/search-pc exige pageVersion dinâmico (quebra fora do browser) → renderiza
 * a busca e lê o runParams JSON embutido na página; fallback pro DOM.
 * Grava em ScaledProduct (source=aliexpress). R$0.
 *
 * Uso: node scrapers/aliexpress.js [--keywords="caneca,led"] [--max-pages=2] [--headless]
 */
const { launchBrowser, upsertByKeys, calcEscalaProduto, countRows, sleep, getArg } = require('./lib');

const args = process.argv.slice(2);
const HEADLESS = args.includes('--headless');
const MAX_PAGES = parseInt(getArg(args, 'max-pages', '2'), 10);
const CLI_KEYWORDS = getArg(args, 'keywords', '');
const TABLE = 'ScaledProduct';
const SOURCE = 'aliexpress';

const DEFAULT_KEYWORDS = [
  'gadgets', 'kitchen tools', 'organizer', 'led light', 'phone holder',
  'massager', 'pet supplies', 'car accessories', 'beauty tools', 'home decor',
];

/** Lê runParams.mods.itemList.content (JSON embutido) no contexto da página. */
function extractFromRunParams() {
  try {
    const rp = (window.runParams && window.runParams.mods) || (window._dida_config_ && window._dida_config_.data);
    const items = rp && rp.itemList && rp.itemList.content;
    if (!Array.isArray(items)) return null;
    return items.map((it) => {
      const price = it.prices && it.prices.salePrice ? parseFloat(it.prices.salePrice.minPrice) : null;
      const orig = it.prices && it.prices.originalPrice ? parseFloat(it.prices.originalPrice.minPrice) : null;
      let sold = 0;
      const tradeText = (it.trade && (it.trade.tradeDesc || it.trade.realTradeDesc)) || '';
      const sm = String(tradeText).match(/([\d.,]+)\s*([kK]|mil)?/);
      if (sm) {
        let n = parseFloat(sm[1].replace(/\./g, '').replace(',', '.'));
        if (/k|mil/i.test(sm[2] || '')) n *= 1000;
        sold = Math.round(n) || 0;
      }
      return {
        externalId: String(it.productId || it.product_id || ''),
        title: (it.title && it.title.displayTitle) || it.title || '',
        productUrl: it.productDetailUrl ? (it.productDetailUrl.startsWith('http') ? it.productDetailUrl : 'https:' + it.productDetailUrl) : null,
        imageUrl: it.image && it.image.imgUrl ? (it.image.imgUrl.startsWith('http') ? it.image.imgUrl : 'https:' + it.image.imgUrl) : null,
        price, originalPrice: orig,
        rating: it.evaluation && it.evaluation.starRating ? parseFloat(it.evaluation.starRating) : null,
        soldCount: sold,
        storeName: it.store && it.store.storeName ? it.store.storeName : null,
      };
    }).filter((x) => x.externalId && x.title && x.productUrl);
  } catch { return null; }
}

/** Fallback (caminho principal desde que runParams morreu): extrai cards do DOM.
 * Preço vem do param pdp_npi no href (BRL!orig!sale), vendas do texto do card. */
function extractFromDom() {
  const seen = new Map();
  document.querySelectorAll('a[href*="/item/"]').forEach((a) => {
    try {
      const href = a.href;
      const m = href.match(/\/item\/(\d{6,})\.html/);
      if (!m) return;
      const externalId = m[1];
      const card = a.closest('div[class]') || a.closest('div') || a;
      const img = card ? card.querySelector('img') : a.querySelector('img');
      const title = (a.getAttribute('title') || (img && img.getAttribute('alt')) || (a.querySelector('h1,h2,h3') ? a.querySelector('h1,h2,h3').textContent : '') || a.textContent || '').trim();
      if (!title) return;
      const imageUrl = img ? (img.getAttribute('src') || img.getAttribute('data-src')) : null;

      // preço: pdp_npi=...BRL!<a>!<b>!... → orig=max, sale=min
      let price = null, originalPrice = null;
      const npi = decodeURIComponent(href).match(/pdp_npi=[^&]*?BRL!([\d.]+)!([\d.]+)/);
      if (npi) {
        const x = parseFloat(npi[1]), y = parseFloat(npi[2]);
        if (!isNaN(x) && !isNaN(y)) { originalPrice = Math.max(x, y); price = Math.min(x, y); }
      }

      // vendas: texto "1.234 vendidos" / "1.2k sold" no card
      let soldCount = 0;
      const ctext = (card && card.textContent || '').replace(/\s+/g, ' ');
      const sm = ctext.match(/([\d.,]+)\s*([kK]|mil)?\+?\s*(?:vendidos?|sold|orders?|pedidos?)/i);
      if (sm) {
        let n = parseFloat(sm[1].replace(/\./g, '').replace(',', '.'));
        if (/k|mil/i.test(sm[2] || '')) n *= 1000;
        soldCount = Math.round(n) || 0;
      }

      seen.set(externalId, {
        externalId,
        title: title.slice(0, 300),
        productUrl: href.split('?')[0],
        imageUrl: imageUrl && imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl,
        price, originalPrice, rating: null, soldCount, storeName: null,
      });
    } catch {}
  });
  return [...seen.values()];
}

async function scrapeKeyword(page, kw) {
  const seen = new Map();
  for (let p = 1; p <= MAX_PAGES; p++) {
    const url = `https://pt.aliexpress.com/w/wholesale-${encodeURIComponent(kw.replace(/\s+/g, '-'))}.html?page=${p}&SortType=total_tranpro_desc&shipFromCountry=CN`;
    try {
      let items = null;
      // render é intermitente (anti-bot) → até 3 tentativas até aparecerem cards
      for (let attempt = 1; attempt <= 3; attempt++) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 50000 });
        await sleep(3000 + Math.floor(Math.random() * 2500));
        // detecta muro anti-bot (_____tmd_____/punish?x5sec) → recua e aborta keyword
        if (/_____tmd_____|punish|x5sec|captcha/i.test(page.url())) {
          console.error(`  🚧 "${kw}" p${p}: anti-bot wall (punish) — backoff 30s`);
          await sleep(30000);
          break;
        }
        await page.evaluate(async () => { for (let i = 0; i < 8; i++) { window.scrollBy(0, 1400); await new Promise((r) => setTimeout(r, 500)); } });
        await sleep(1000);
        const linkCount = await page.evaluate(() => document.querySelectorAll('a[href*="/item/"]').length);
        if (linkCount >= 3) {
          items = await page.evaluate(extractFromRunParams);
          if (!items || items.length === 0) items = await page.evaluate(extractFromDom);
          if (items && items.length) break;
        }
        await sleep(2000 + Math.floor(Math.random() * 2000));
      }
      (items || []).forEach((it) => seen.set(it.externalId, it));
      if (!items || items.length === 0) break;
      await sleep(2500 + Math.floor(Math.random() * 2500));
    } catch (e) { console.error(`  ❌ "${kw}" p${p}: ${e.message}`); break; }
  }
  return [...seen.values()];
}

function mapRow(it) {
  let discountPct = null;
  if (it.price && it.originalPrice && it.originalPrice > it.price) discountPct = Math.round((1 - it.price / it.originalPrice) * 100);
  return {
    source: SOURCE,
    externalId: it.externalId,
    title: it.title.slice(0, 500),
    imageUrl: it.imageUrl || null,
    productUrl: it.productUrl,
    storeName: it.storeName || null,
    price: it.price ?? null,
    originalPrice: it.originalPrice ?? null,
    discountPct,
    currency: 'BRL',
    rating: it.rating ?? null,
    reviewCount: 0,
    soldCount: it.soldCount ?? 0,
    escala: calcEscalaProduto({ soldCount: it.soldCount || 0, discountPct: discountPct || 0, reviewCount: 0 }),
    isActive: true,
    scraperLastRun: new Date().toISOString(),
  };
}

(async () => {
  const t0 = Date.now();
  let keywords = CLI_KEYWORDS ? CLI_KEYWORDS.split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_KEYWORDS;
  keywords = [...new Set(keywords)];
  console.log(`🌏 AliExpress — headless=${HEADLESS} pages=${MAX_PAGES} keywords=[${keywords.join(', ')}]`);

  const { browser, page } = await launchBrowser(HEADLESS);
  let allCreated = 0, allUpdated = 0, allCollected = 0;
  for (const kw of keywords) {
    try {
      const items = await scrapeKeyword(page, kw);
      allCollected += items.length;
      const rows = items.map(mapRow);
      const { created, updated } = await upsertByKeys(TABLE, rows, ['source', 'externalId']);
      allCreated += created; allUpdated += updated;
      console.log(`  💾 "${kw}": ${created} novos, ${updated} atualizados (${items.length} coletados)`);
    } catch (e) { console.error(`  ❌ "${kw}": ${e.message}`); }
  }
  await browser.close();
  const total = await countRows(TABLE);
  console.log(`\n✅ Ali FIM em ${Math.round((Date.now() - t0) / 1000)}s — coletados=${allCollected} criados=${allCreated} atualizados=${allUpdated} | tabela total=${total}`);
})().catch((e) => { console.error('❌ Fatal:', e.message); process.exit(1); });
