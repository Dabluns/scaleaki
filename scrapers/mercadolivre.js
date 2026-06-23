/**
 * Scraper Mercado Livre — produtos escalados/em alta (ofertas + mais vendidos).
 * API pública fechou (403/OAuth) E a busca por keyword (lista.mercadolivre)
 * cai em /gz/account-verification em IP datacenter. Caminho que funciona:
 * páginas curadas /ofertas e /mais-vendidos renderizam sem wall e já trazem
 * exatamente o que interessa (deals + best-sellers). Extrai do DOM (.poly-card).
 * Grava em ScaledProduct (source=mercadolivre). R$0.
 *
 * Uso: node scrapers/mercadolivre.js [--pages=ofertas,mais-vendidos] [--headless]
 */
const { launchBrowser, upsertByKeys, calcEscalaProduto, countRows, sleep, getArg } = require('./lib');

const args = process.argv.slice(2);
const HEADLESS = args.includes('--headless');
const CLI_PAGES = getArg(args, 'pages', '');
const TABLE = 'ScaledProduct';
const SOURCE = 'mercadolivre';

// Páginas curadas que renderizam sem verification wall (IP datacenter).
// /ofertas = grid de produtos (.poly-card). /mais-vendidos é hub de categorias
// (precisa crawl por categoria) → fora do default; passar via --pages se quiser.
const DEFAULT_PAGES = [
  { label: 'ofertas', url: 'https://www.mercadolivre.com.br/ofertas' },
];
const ALL_PAGES = {
  ofertas: 'https://www.mercadolivre.com.br/ofertas',
  'mais-vendidos': 'https://www.mercadolivre.com.br/mais-vendidos',
};

/** Extrai cards de produto da página do ML (roda no contexto da página). */
function extractProductsInPage() {
  const out = [];
  const cards = document.querySelectorAll('.poly-card, li.ui-search-layout__item, div.ui-search-result__wrapper');
  cards.forEach((card) => {
    try {
      const link = card.querySelector('a[href*="/MLB"], a.poly-component__title, a.ui-search-link');
      const productUrl = link ? link.href : null;
      if (!productUrl) return;
      // IDs vêm como /p/MLB26070781 ou /MLB-1234567890
      const m = productUrl.match(/\/p\/(MLB\d{6,})|(MLB-?\d{6,})/i);
      const externalId = m ? (m[1] || m[2]).replace('-', '') : null;
      if (!externalId) return;

      const titleEl = card.querySelector('.poly-component__title, .ui-search-item__title, h2');
      const title = titleEl ? titleEl.textContent.trim() : null;
      if (!title) return;

      const priceFrac = card.querySelector('.andes-money-amount__fraction');
      const price = priceFrac ? parseFloat(priceFrac.textContent.replace(/\./g, '').replace(',', '.')) : null;

      // preço cheio (riscado) quando há desconto
      const prevEl = card.querySelector('s .andes-money-amount__fraction, .andes-money-amount--previous .andes-money-amount__fraction');
      const originalPrice = prevEl ? parseFloat(prevEl.textContent.replace(/\./g, '').replace(',', '.')) : null;

      const discEl = card.querySelector('.andes-money-amount__discount, .ui-search-price__discount');
      let discountPct = null;
      if (discEl) { const dm = discEl.textContent.match(/(\d{1,3})\s*%/); if (dm) discountPct = parseInt(dm[1], 10); }
      if (discountPct == null && price && originalPrice && originalPrice > price) {
        discountPct = Math.round((1 - price / originalPrice) * 100);
      }

      const img = card.querySelector('img.poly-component__picture, img.ui-search-result-image__element, img');
      const imageUrl = img ? (img.getAttribute('data-src') || img.src) : null;

      // vendas / reviews (quando o card mostra)
      const soldEl = card.querySelector('.poly-reviews__total, .ui-search-reviews__amount');
      let reviewCount = null;
      if (soldEl) { const rm = soldEl.textContent.match(/(\d[\d.]*)/); if (rm) reviewCount = parseInt(rm[1].replace(/\./g, ''), 10); }
      const ratingEl = card.querySelector('.poly-reviews__rating, .ui-search-reviews__rating-number');
      const rating = ratingEl ? parseFloat(ratingEl.textContent.replace(',', '.')) : null;

      const sellerEl = card.querySelector('.poly-component__seller');
      const storeName = sellerEl ? sellerEl.textContent.replace(/^Por\s+/i, '').trim() : null;

      out.push({ externalId, title, productUrl, imageUrl, price, originalPrice, discountPct, rating, reviewCount, storeName });
    } catch (e) { /* skip card */ }
  });
  return out;
}

async function scrapePage(page, label, url) {
  const seen = new Map();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(3000);
    if (/account-verification|\/gz\//.test(page.url())) {
      console.error(`  🚧 "${label}": verification wall — pulei`);
      return [];
    }
    await page.waitForSelector('.poly-card, li.ui-search-layout__item', { timeout: 15000 }).catch(() => {});
    // scroll pra carregar lazy imgs + cards extras
    await page.evaluate(async () => { for (let i = 0; i < 10; i++) { window.scrollBy(0, 1400); await new Promise((r) => setTimeout(r, 450)); } });
    const items = await page.evaluate(extractProductsInPage);
    items.forEach((it) => seen.set(it.externalId, it));
  } catch (e) { console.error(`  ❌ "${label}": ${e.message}`); }
  return [...seen.values()];
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
    soldCount: it.reviewCount ?? 0, // ML não expõe vendas; usa reviews como proxy
    escala: calcEscalaProduto({ soldCount: it.reviewCount || 0, discountPct: it.discountPct || 0, reviewCount: it.reviewCount || 0 }),
    isActive: true,
    scraperLastRun: new Date().toISOString(),
  };
}

(async () => {
  const t0 = Date.now();
  let pages = DEFAULT_PAGES;
  if (CLI_PAGES) {
    const want = CLI_PAGES.split(',').map((s) => s.trim()).filter(Boolean);
    pages = want.filter((w) => ALL_PAGES[w]).map((w) => ({ label: w, url: ALL_PAGES[w] }));
  }
  console.log(`🛒 Mercado Livre — headless=${HEADLESS} pages=[${pages.map((p) => p.label).join(', ')}]`);

  const { browser, page } = await launchBrowser(HEADLESS);
  let allCreated = 0, allUpdated = 0, allCollected = 0;
  for (const pg of pages) {
    try {
      const items = await scrapePage(page, pg.label, pg.url);
      allCollected += items.length;
      const rows = items.map(mapRow);
      const { created, updated } = rows.length ? await upsertByKeys(TABLE, rows, ['source', 'externalId']) : { created: 0, updated: 0 };
      allCreated += created; allUpdated += updated;
      console.log(`  💾 "${pg.label}": ${created} novos, ${updated} atualizados (${items.length} coletados)`);
    } catch (e) { console.error(`  ❌ "${pg.label}": ${e.message}`); }
    await sleep(2000 + Math.floor(Math.random() * 2000));
  }
  await browser.close();
  const total = await countRows(TABLE);
  console.log(`\n✅ ML FIM em ${Math.round((Date.now() - t0) / 1000)}s — coletados=${allCollected} criados=${allCreated} atualizados=${allUpdated} | tabela total=${total}`);
})().catch((e) => { console.error('❌ Fatal:', e.message); process.exit(1); });
