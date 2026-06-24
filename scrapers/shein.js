/**
 * Scraper SHEIN BR — produtos em alta (categorias femininas/casa/etc).
 * Páginas de busca (/pdsearch) disparam risk/challenge; páginas de CATEGORIA não.
 * Renderiza a categoria e intercepta o XHR bff-api/category/real_category_goods_list
 * (120 produtos por carga, JSON rico). Fallback pro DOM se o XHR não vier.
 * Grava em ScaledProduct (source=shein). R$0, sem API paga.
 *
 * Uso: node scrapers/shein.js [--categories="2030:Women,1733:Home"] [--max-scroll=8] [--headless]
 */
const { launchBrowser, upsertByKeys, calcEscalaProduto, countRows, sleep, getArg } = require('./lib');

const args = process.argv.slice(2);
const HEADLESS = args.includes('--headless');
const MAX_SCROLL = parseInt(getArg(args, 'max-scroll', '8'), 10);
const CLI_CATS = getArg(args, 'categories', '');
const TABLE = 'ScaledProduct';
const SOURCE = 'shein';

// catId:slug — categorias campeãs de venda no BR. slug só rotula o log/URL.
const DEFAULT_CATEGORIES = [
  '2030:Women-Clothing',
  '1733:Home-Kitchen',
  '4438:Beauty-Health',
  '2237:Jewelry-Accessories',
  '1888:Shoes',
];

const num = (v) => {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
};
const toHttps = (u) => (!u ? null : u.startsWith('//') ? 'https:' + u : u.startsWith('http') ? u : 'https://br.shein.com' + (u.startsWith('/') ? '' : '/') + u);

/** Mapeia um produto do payload bff-api → linha ScaledProduct. */
function mapApiItem(it) {
  const price = num(it.salePrice && it.salePrice.amount);
  const originalPrice = num(it.retailPrice && it.retailPrice.amount);
  let discountPct = num(it.unit_discount) || num(it.retailDiscountPercent);
  if (!discountPct && price && originalPrice && originalPrice > price) {
    discountPct = Math.round((1 - price / originalPrice) * 100);
  }
  const id = String(it.goods_id || it.productRelationID || '');
  const slug = it.goods_url_name || 'product';
  return {
    externalId: id,
    title: (it.goods_name || it.cate_name || '').slice(0, 500),
    imageUrl: toHttps(it.goods_img || it.goodsColorImage),
    productUrl: id ? `https://br.shein.com/${slug}-p-${id}.html` : null,
    storeName: it.store_code ? `store_${it.store_code}` : null,
    price,
    originalPrice,
    discountPct: discountPct || null,
    rating: num(it.comment_rank_average),
    reviewCount: parseInt(num(it.comment_num) || 0, 10),
    soldCount: 0, // SHEIN não expõe vendas no card
  };
}

/** Fallback DOM: cards <a href="...-p-<id>.html"> com img + título. */
function extractFromDom() {
  const seen = new Map();
  document.querySelectorAll('a[href*="-p-"]').forEach((a) => {
    try {
      const m = a.href.match(/-p-(\d{4,})\.html/);
      if (!m) return;
      const externalId = m[1];
      const img = a.querySelector('img');
      const title = (a.getAttribute('title') || (img && img.getAttribute('alt')) || '').trim();
      if (!title) return;
      const imageUrl = img ? (img.getAttribute('src') || img.getAttribute('data-src')) : null;
      // preço do card: primeiro texto "R$xx,xx"
      const ctext = (a.closest('section,div') ? a.closest('section,div').textContent : a.textContent) || '';
      const pm = [...ctext.matchAll(/R\$\s?([\d.]+,\d{2})/g)].map((x) => parseFloat(x[1].replace(/\./g, '').replace(',', '.')));
      let price = null, originalPrice = null;
      if (pm.length) { price = Math.min(...pm); if (pm.length > 1) originalPrice = Math.max(...pm); }
      seen.set(externalId, {
        externalId, title: title.slice(0, 500),
        productUrl: a.href.split('?')[0],
        imageUrl: imageUrl && imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl,
        price, originalPrice, discountPct: null, rating: null, reviewCount: 0, soldCount: 0, storeName: null,
      });
    } catch {}
  });
  return [...seen.values()];
}

async function scrapeCategory(page, catId, slug) {
  const collected = new Map();
  let challenged = false;
  const onResp = async (r) => {
    if (r.request().resourceType() !== 'xhr') return;
    if (!/real_category_goods_list/i.test(r.url())) return;
    try {
      const j = await r.json();
      const list = (j && j.info && j.info.products) || (j && j.data && j.data.products);
      if (Array.isArray(list)) list.forEach((it) => { const row = mapApiItem(it); if (row.externalId && row.title && row.productUrl) collected.set(row.externalId, row); });
    } catch {}
  };
  page.on('response', onResp);
  try {
    const url = `https://br.shein.com/${slug}-c-${catId}.html`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 50000 });
    await sleep(4000 + Math.floor(Math.random() * 2000));
    if (/risk\/challenge|captcha|robot/i.test(page.url())) { challenged = true; throw new Error('risk/challenge wall'); }
    // scroll incremental dispara cargas de mais produtos via XHR
    for (let i = 0; i < MAX_SCROLL; i++) {
      await page.evaluate(() => window.scrollBy(0, 1600));
      await sleep(700 + Math.floor(Math.random() * 500));
    }
    await sleep(2500);
    // se XHR não pegou nada, tenta DOM
    if (collected.size === 0) {
      const dom = await page.evaluate(extractFromDom);
      dom.forEach((row) => collected.set(row.externalId, row));
    }
  } catch (e) {
    console.error(`  ${challenged ? '🚧' : '❌'} cat ${catId} (${slug}): ${e.message}`);
  } finally {
    page.off('response', onResp);
  }
  return [...collected.values()];
}

function mapRow(it) {
  return {
    source: SOURCE,
    externalId: it.externalId,
    title: it.title.slice(0, 500),
    imageUrl: it.imageUrl || null,
    productUrl: it.productUrl,
    storeName: it.storeName || null,
    price: it.price ?? null,
    originalPrice: it.originalPrice ?? null,
    discountPct: it.discountPct ?? null,
    currency: 'BRL',
    rating: it.rating ?? null,
    reviewCount: it.reviewCount ?? 0,
    soldCount: it.soldCount ?? 0,
    escala: calcEscalaProduto({ soldCount: it.soldCount || 0, discountPct: it.discountPct || 0, reviewCount: it.reviewCount || 0 }),
    isActive: true,
    scraperLastRun: new Date().toISOString(),
  };
}

(async () => {
  const t0 = Date.now();
  let cats = (CLI_CATS ? CLI_CATS.split(',') : DEFAULT_CATEGORIES).map((s) => s.trim()).filter(Boolean);
  cats = [...new Set(cats)];
  console.log(`🛍️  SHEIN — headless=${HEADLESS} scroll=${MAX_SCROLL} cats=[${cats.join(', ')}]`);

  const { browser, page } = await launchBrowser(HEADLESS);
  let allCreated = 0, allUpdated = 0, allCollected = 0;
  for (const c of cats) {
    const [catId, slug = 'Category'] = c.split(':');
    try {
      const items = await scrapeCategory(page, catId, slug);
      allCollected += items.length;
      const rows = items.map(mapRow);
      const { created, updated } = await upsertByKeys(TABLE, rows, ['source', 'externalId']);
      allCreated += created; allUpdated += updated;
      console.log(`  💾 ${slug} (${catId}): ${created} novos, ${updated} atualizados (${items.length} coletados)`);
    } catch (e) { console.error(`  ❌ ${c}: ${e.message}`); }
    await sleep(3000 + Math.floor(Math.random() * 3000));
  }
  await browser.close();
  const total = await countRows(TABLE);
  console.log(`\n✅ SHEIN FIM em ${Math.round((Date.now() - t0) / 1000)}s — coletados=${allCollected} criados=${allCreated} atualizados=${allUpdated} | tabela total=${total}`);
})().catch((e) => { console.error('❌ Fatal:', e.message); process.exit(1); });
