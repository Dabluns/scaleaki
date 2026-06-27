import axios from 'axios';
import prisma from '../config/database';
import logger from '../config/logger';

const URLSCAN_API = 'https://urlscan.io/api/v1';
const API_KEY = process.env.URLSCAN_API_KEY;

// Domínios conhecidos de checkout mapeados para nome da plataforma
const CHECKOUT_SIGNATURES: Record<string, string> = {
  'api.shopify.com': 'Shopify',
  'cdn.shopify.com': 'Shopify',
  'checkout.shopify.com': 'Shopify',
  'pay.kiwify.com.br': 'Kiwify',
  'kiwify.com.br': 'Kiwify',
  'checkout.hotmart.com': 'Hotmart',
  'hotmart.com': 'Hotmart',
  'pay.eduzz.com': 'Eduzz',
  'eduzz.com': 'Eduzz',
  'monetizze.com.br': 'Monetizze',
  'perfectpay.com.br': 'PerfectPay',
  'payt.com.br': 'Payt',
  'yampi.com.br': 'Yampi',
  'cartpanda.com': 'CartPanda',
  'pay.herospark.com': 'HeroSpark',
  'herospark.com': 'HeroSpark',
  'guru.com.br': 'Guru',
  'appmax.com.br': 'Appmax',
};

// Scripts/domínios conhecidos de tecnologia de site
const TECH_SIGNATURES: Record<string, string> = {
  'wordpress': 'Wordpress',
  'wp-content': 'Wordpress',
  'wp-includes': 'Wordpress',
  'vtex.com': 'VTEX',
  'webflow.com': 'Webflow',
  'webflow.io': 'Webflow',
  'wixstatic.com': 'Wix',
  'squarespace.com': 'Squarespace',
  'leadpages.net': 'Leadpages',
  'unbounce.com': 'Unbounce',
  'clickfunnels.com': 'ClickFunnels',
  'kartra.com': 'Kartra',
};

// Pixels de rastreamento conhecidos
const PIXEL_SIGNATURES: Record<string, string> = {
  'connect.facebook.net': 'Facebook Pixel',
  'facebook.com/tr': 'Facebook Pixel',
  'google-analytics.com': 'Google Analytics',
  'googletagmanager.com': 'Google Tag Manager',
  'analytics.google.com': 'Google Analytics 4',
  'ads.google.com': 'Google Ads',
  'analytics.tiktok.com': 'TikTok Pixel',
  'sc-static.net': 'Snapchat Pixel',
  'tr.snapchat.com': 'Snapchat Pixel',
  'pixel.taboola.com': 'Taboola',
  'outbrain.com': 'Outbrain',
};

/**
 * Submete uma URL para scan no URLscan.io e aguarda o resultado.
 * Atualiza os campos de funil do AnuncioFacebook no banco.
 */
export async function scanFunnel(fbAdId: string, destinationUrl: string): Promise<void> {
  if (!API_KEY) {
    logger.warn('[URLscan] URLSCAN_API_KEY não configurada — funil não será analisado');
    return;
  }

  if (!destinationUrl) {
    logger.warn(`[URLscan] destinationUrl vazia para fbAdId: ${fbAdId}`);
    return;
  }

  try {
    logger.info(`[URLscan] Submetendo scan: ${destinationUrl}`);

    // 1. Submeter scan
    const submitRes = await axios.post(
      `${URLSCAN_API}/scan/`,
      { url: destinationUrl, visibility: 'unlisted' },
      { headers: { 'API-Key': API_KEY, 'Content-Type': 'application/json' } }
    );

    const uuid: string = submitRes.data.uuid;
    logger.info(`[URLscan] Scan submetido — UUID: ${uuid}`);

    // 2. Aguardar processamento (poll a cada 5s por até 60s)
    const result = await pollResult(uuid);
    if (!result) {
      logger.warn(`[URLscan] Timeout esperando resultado para UUID: ${uuid}`);
      return;
    }

    // 3. Extrair dados relevantes
    const requests: string[] = (result.data?.requests || []).map(
      (r: any) => r.request?.request?.url || ''
    ).filter(Boolean);

    // Extrair domínios reais do URLscan — suporta múltiplos formatos da API:
    // - result.lists?.domains   → array de strings (mais confiável)
    // - result.stats?.domainStats → objeto { "domain": {...} } ou array
    // - result.data?.requests   → fallback via hostname das URLs
    const domains: string[] = extractDomains(result, requests);

    const checkout = detectCheckout([...requests, ...domains]);
    const tecnologia = detectTech([...requests, ...domains]);
    const activePixels = detectPixels(requests);
    const funnelSubdomains = extractSubdomains(domains, destinationUrl);
    const externalServices = extractExternalServices(domains, destinationUrl);
    const landingScreenshot = `https://urlscan.io/screenshots/${uuid}.png`;

    // 4. Persistir no banco
    await prisma.anuncioFacebook.update({
      where: { fbAdId },
      data: {
        urlscanUuid: uuid,
        checkout,
        tecnologia,
        activePixels: JSON.stringify(activePixels),
        funnelSubdomains: JSON.stringify(funnelSubdomains),
        externalServices: JSON.stringify(externalServices),
        landingScreenshot,
        urlscanLastRun: new Date(),
      },
    });

    logger.info(`[URLscan] Funil analisado para ${fbAdId} — checkout: ${checkout}, tech: ${tecnologia}, pixels: ${activePixels.join(', ')}`);
  } catch (err: any) {
    logger.error(`[URLscan] Erro ao analisar funil para ${fbAdId}: ${err.message}`);
  }
}

export interface FunnelScanResult {
  uuid: string;
  checkout: string | null;
  tecnologia: string | null;
  activePixels: string[];
  subdomains: string[];
  externalServices: string[];
  screenshot: string;
  redirectChain: string[];
}

/**
 * Versão genérica do scanFunnel: roda o scan para uma URL arbitrária e
 * RETORNA os dados extraídos (sem gravar em AnuncioFacebook). Usado pela
 * feature de Tráfego & Funil do Scaleaki+. Reusa todos os detectores.
 */
export async function scanUrl(targetUrl: string): Promise<FunnelScanResult> {
  if (!API_KEY) throw new Error('URLSCAN_API_KEY não configurada');
  if (!targetUrl) throw new Error('URL vazia');

  const submitRes = await axios.post(
    `${URLSCAN_API}/scan/`,
    { url: targetUrl, visibility: 'unlisted' },
    { headers: { 'API-Key': API_KEY, 'Content-Type': 'application/json' } }
  );
  const uuid: string = submitRes.data.uuid;

  const result = await pollResult(uuid);
  if (!result) throw new Error('Timeout esperando resultado do URLscan');

  const requests: string[] = (result.data?.requests || [])
    .map((r: any) => r.request?.request?.url || '')
    .filter(Boolean);
  const domains: string[] = extractDomains(result, requests);

  const redirectChain: string[] = (result.data?.requests || [])
    .map((r: any) => r.response?.response?.redirectURL || '')
    .filter(Boolean)
    .slice(0, 20);

  return {
    uuid,
    checkout: detectCheckout([...requests, ...domains]),
    tecnologia: detectTech([...requests, ...domains]),
    activePixels: detectPixels(requests),
    subdomains: extractSubdomains(domains, targetUrl),
    externalServices: extractExternalServices(domains, targetUrl),
    screenshot: `https://urlscan.io/screenshots/${uuid}.png`,
    redirectChain,
  };
}

async function pollResult(uuid: string, maxAttempts = 24, intervalMs = 5000): Promise<any | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);
    try {
      const res = await axios.get(`${URLSCAN_API}/result/${uuid}/`, {
        headers: { 'API-Key': API_KEY }
      });
      if (res.status === 200) return res.data;
    } catch (err: any) {
      if (err.response?.status !== 404) throw err;
      // 404 = ainda processando, continua o loop
    }
  }
  return null;
}

/**
 * Extrai lista de domínios do resultado do URLscan normalizando os diferentes
 * formatos que a API pode retornar (array, objeto indexado, objeto keyed, etc.)
 */
function extractDomains(result: any, requestUrls: string[]): string[] {
  const domainSet = new Set<string>();

  // Fonte 1 (mais confiável): result.lists.domains — array de strings puro
  const listDomains: any = result?.lists?.domains;
  if (Array.isArray(listDomains)) {
    listDomains.forEach((d: any) => { if (typeof d === 'string' && d) domainSet.add(d); });
  }

  // Fonte 2: result.stats.domainStats — pode ser objeto {"domain": {}} ou array
  const domainStats: any = result?.stats?.domainStats;
  if (domainStats && typeof domainStats === 'object') {
    if (Array.isArray(domainStats)) {
      // Array de objetos: [{domain: "example.com", ...}, ...]
      domainStats.forEach((entry: any) => {
        const d = entry?.domain || entry?.name;
        if (typeof d === 'string' && d) domainSet.add(d);
      });
    } else {
      // Objeto keyed: {"example.com": {...}}
      Object.keys(domainStats).forEach((key) => {
        // Garantir que a chave é um domínio real (não índice numérico)
        if (key && isNaN(Number(key))) domainSet.add(key);
      });
    }
  }

  // Fonte 3: extrair hostnames das URLs de request (fallback)
  if (domainSet.size === 0 && requestUrls.length > 0) {
    requestUrls.forEach((url) => {
      try {
        const hostname = new URL(url).hostname;
        if (hostname) domainSet.add(hostname);
      } catch { }
    });
  }

  return Array.from(domainSet).filter(Boolean);
}

function detectCheckout(urls: string[]): string | null {
  for (const url of urls) {
    for (const [signature, name] of Object.entries(CHECKOUT_SIGNATURES)) {
      if (url.includes(signature)) return name;
    }
  }
  return null;
}

function detectTech(urls: string[]): string | null {
  for (const url of urls) {
    const lower = url.toLowerCase();
    for (const [signature, name] of Object.entries(TECH_SIGNATURES)) {
      if (lower.includes(signature)) return name;
    }
  }
  return null;
}

function detectPixels(urls: string[]): string[] {
  const found = new Set<string>();
  for (const url of urls) {
    for (const [signature, name] of Object.entries(PIXEL_SIGNATURES)) {
      if (url.includes(signature)) found.add(name);
    }
  }
  return Array.from(found);
}

function extractSubdomains(domains: string[], destinationUrl: string): string[] {
  // Retorna toda a "Domain Tree" mapeada pelo URLscan:
  // todos os domínios externos carregados pelo site, já normalizados como strings reais.
  // Limita a 50 domínios para não sobrecarregar o banco.
  return domains.slice(0, 50);
}

function extractExternalServices(domains: string[], destinationUrl: string): string[] {
  const knownServices: Record<string, string> = {
    'activecampaign.com': 'ActiveCampaign',
    'mailchimp.com': 'Mailchimp',
    'brevo.com': 'Brevo',
    'rdstation.com': 'RD Station',
    'intercom.io': 'Intercom',
    'zendesk.com': 'Zendesk',
    'tidio.com': 'Tidio',
    'drift.com': 'Drift',
    'hotjar.com': 'Hotjar',
    'clarity.ms': 'Microsoft Clarity',
    'crazyegg.com': 'CrazyEgg',
    'zapier.com': 'Zapier',
  };

  const found = new Set<string>();
  for (const domain of domains) {
    for (const [sig, name] of Object.entries(knownServices)) {
      if (domain.includes(sig)) found.add(name);
    }
  }
  return Array.from(found);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
