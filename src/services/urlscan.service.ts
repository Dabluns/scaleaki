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
    );
    const domains: string[] = Object.keys(result.stats?.domainStats || {});

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

async function pollResult(uuid: string, maxAttempts = 12, intervalMs = 5000): Promise<any | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);
    try {
      const res = await axios.get(`${URLSCAN_API}/result/${uuid}/`);
      if (res.status === 200) return res.data;
    } catch (err: any) {
      if (err.response?.status !== 404) throw err;
      // 404 = ainda processando, continua o loop
    }
  }
  return null;
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
  try {
    const base = new URL(destinationUrl).hostname.replace(/^www\./, '');
    return domains.filter(d => d.endsWith(base) && d !== base && d !== `www.${base}`);
  } catch {
    return [];
  }
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
