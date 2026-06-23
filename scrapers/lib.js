/**
 * Lib compartilhada dos scrapers Scaleaki+ (marketplace + adspy).
 * Espelha o padrão do scraper-auto.js: Supabase REST (IPv4), UUID client-side,
 * upsert por chave única. R$0, sem API paga.
 */
require('dotenv').config();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let puppeteer;
try {
  puppeteer = require('puppeteer-extra');
  puppeteer.use(require('puppeteer-extra-plugin-stealth')());
} catch {
  puppeteer = require('puppeteer');
}

/** Lança browser stealth com locale pt-BR (mesmo setup do scraper-auto). */
async function launchBrowser(headless) {
  const browser = await puppeteer.launch({
    headless: headless ? 'new' : false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  const page = (await browser.pages())[0] || await browser.newPage();
  await page.setUserAgent(UA);
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8' });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'language', { get: () => 'pt-BR' });
    Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en'] });
  });
  return { browser, page };
}

/**
 * Upsert genérico por chave única composta.
 * @param table  nome da tabela ('ScaledProduct' | 'ScaledAd')
 * @param rows   registros já mapeados (sem id/createdAt/updatedAt)
 * @param keys   colunas da unique (ex: ['source','externalId'])
 */
async function upsertByKeys(table, rows, keys) {
  let created = 0, updated = 0;
  const now = new Date().toISOString();

  // Carrega existentes para decidir insert vs update (batch por externalId)
  const extIds = [...new Set(rows.map((r) => r.externalId))];
  const existing = new Set();
  for (let i = 0; i < extIds.length; i += 300) {
    const slice = extIds.slice(i, i + 300);
    const { data } = await supabase.from(table).select(keys.join(',')).in('externalId', slice);
    (data || []).forEach((r) => existing.add(keys.map((k) => r[k]).join('|')));
  }

  for (const row of rows) {
    const sig = keys.map((k) => row[k]).join('|');
    if (existing.has(sig)) {
      const filter = {};
      keys.forEach((k) => (filter[k] = row[k]));
      let q = supabase.from(table).update({ ...row, updatedAt: now });
      Object.entries(filter).forEach(([k, v]) => { q = q.eq(k, v); });
      const { error } = await q;
      if (!error) updated++;
    } else {
      const { error } = await supabase
        .from(table)
        .insert({ id: crypto.randomUUID(), ...row, createdAt: now, updatedAt: now });
      if (!error) created++;
      else if (/duplicate|unique/i.test(error.message)) {
        // corrida: vira update
        const filter = {};
        keys.forEach((k) => (filter[k] = row[k]));
        let q = supabase.from(table).update({ ...row, updatedAt: now });
        Object.entries(filter).forEach(([k, v]) => { q = q.eq(k, v); });
        await q;
        updated++;
      } else {
        console.error('  insert err:', error.message);
      }
    }
  }
  return { created, updated };
}

/** Score de escala para produto: vendas (log) + desconto + avaliação. 0-100. */
function calcEscalaProduto({ soldCount = 0, discountPct = 0, reviewCount = 0 }) {
  const vendas = Math.min(Math.log(1 + soldCount) / Math.log(10001), 1) * 55; // 0-55
  const desc = Math.min(Math.max(0, discountPct) / 80, 1) * 25;              // 0-25
  const rev = Math.min(Math.log(1 + reviewCount) / Math.log(5001), 1) * 20;  // 0-20
  return Math.round(vendas + desc + rev);
}

/** Score de escala para anúncio: views (log) + recência. 0-100. */
function calcEscalaAd({ views = 0, firstSeen = null, isActive = true }) {
  const v = Math.min(Math.log(1 + views) / Math.log(1e7), 1) * 60; // 0-60
  let recencia = 0;
  if (firstSeen) {
    const s = new Date(firstSeen).getTime();
    if (!isNaN(s)) recencia = Math.min(Math.max(0, (Date.now() - s) / 86400000) / 90, 1) * 20; // longevidade 0-20
  }
  return Math.round(v + recencia + (isActive ? 20 : 0));
}

async function countRows(table) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return count || 0;
}

const getArg = (args, k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split('=')[1] : d;
};

module.exports = {
  supabase, UA, sleep, launchBrowser, upsertByKeys,
  calcEscalaProduto, calcEscalaAd, countRows, getArg,
};
