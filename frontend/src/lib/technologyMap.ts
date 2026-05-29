/**
 * Mapa de Tecnologias — Gateways, Checkouts & Players VSL
 * Base: dominios-gateways-vsl.pdf · Geek OS · 2026-05-29
 * 
 * Usado na seção Explorar do Scaleaki para:
 *  - Filtrar anúncios por tecnologia
 *  - Detectar automaticamente a plataforma a partir de uma URL de destino
 */

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export type TechCategory =
  | 'BR_CHECKOUT'     // Checkouts/Plataformas de infoproduto brasileiro
  | 'BR_ECOMMERCE'    // Checkouts de drop / e-commerce BR
  | 'BR_PSP'          // PSP genérico (API embutida em checkout custom)
  | 'LATAM'           // Gateways hispano-américanos
  | 'US_CHECKOUT'     // Plataformas US / globais
  | 'US_FUNNEL'       // Funnel builders US
  | 'VSL_PLAYER';     // Players de vídeo / CDN VSL

export interface Technology {
  name: string;
  category: TechCategory;
  color: string;           // Cor da marca (hex) para badges/ícones
  domains: string[];       // Match literal (lowercase)
  wildcards?: RegExp[];    // Match por regex para subdomínios dinâmicos
  note?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPA COMPLETO
// ─────────────────────────────────────────────────────────────────────────────

export const TECHNOLOGY_MAP: Technology[] = [

  // ── BR Checkout / Infoproduto ─────────────────────────────────────────────

  { name: 'Kiwify',     category: 'BR_CHECKOUT', color: '#00B37E',
    domains: ['kiwify.com.br', 'kiwify.app', 'pay.kiwify.com.br', 'pay.kiwify.com'] },

  { name: 'PerfectPay', category: 'BR_CHECKOUT', color: '#0EA5E9',
    domains: ['perfectpay.com.br', 'pay.perfectpay.com.br', 'checkout.perfectpay.com.br'] },

  { name: 'Braip',      category: 'BR_CHECKOUT', color: '#7C3AED',
    domains: ['braip.com', 'braip.com.br', 'checkout.braip.com'],
    wildcards: [/\.braip\.com$/] },

  { name: 'Kirvano',   category: 'BR_CHECKOUT', color: '#F59E0B',
    domains: ['kirvano.com', 'pay.kirvano.com', 'checkout.kirvano.com'] },

  { name: 'Hotmart',   category: 'BR_CHECKOUT', color: '#F04E23',
    domains: ['hotmart.com', 'hotmart.com.br', 'pay.hotmart.com', 'checkout.hotmart.com', 'purchase.hotmart.com'] },

  { name: 'Monetizze', category: 'BR_CHECKOUT', color: '#1E40AF',
    domains: ['monetizze.com.br', 'app.monetizze.com.br', 'checkout.monetizze.com.br', 'adm.monetizze.com.br'] },

  { name: 'Eduzz',     category: 'BR_CHECKOUT', color: '#FF3D00',
    domains: ['eduzz.com', 'sun.eduzz.com', 'chk.eduzz.com', 'myeduzz.com'] },

  { name: 'Ticto',     category: 'BR_CHECKOUT', color: '#0F766E',
    domains: ['ticto.com.br', 'tickto.com.br', 'checkout.ticto.com.br', 'pay.ticto.app'] },

  { name: 'Pepper',    category: 'BR_CHECKOUT', color: '#DC2626',
    domains: ['pepper.com.br', 'usepepper.com.br', 'checkout.pepper.com.br'] },

  { name: 'Payt',      category: 'BR_CHECKOUT', color: '#2563EB',
    domains: ['payt.com.br', 'checkout.payt.com.br', 'app.payt.com.br'] },

  { name: 'TriboPay',  category: 'BR_CHECKOUT', color: '#9333EA',
    domains: ['tribopay.com.br', 'checkout.tribopay.com.br', 'pay.tribopay.com.br'] },

  { name: 'Cakto',     category: 'BR_CHECKOUT', color: '#16A34A',
    domains: ['cakto.com.br', 'pay.cakto.com.br', 'checkout.cakto.com.br'] },

  { name: 'Lastlink',  category: 'BR_CHECKOUT', color: '#6366F1',
    domains: ['lastlink.com', 'checkout.lastlink.com'] },

  { name: 'Hubla',     category: 'BR_CHECKOUT', color: '#0891B2',
    domains: ['hub.la', 'hubla.com.br', 'checkout.hub.la'] },

  { name: 'Greenn',    category: 'BR_CHECKOUT', color: '#15803D',
    domains: ['greenn.com.br', 'checkout.greenn.com.br', 'app.greenn.com.br'] },

  { name: 'Doppus',    category: 'BR_CHECKOUT', color: '#7C3AED',
    domains: ['doppus.com', 'doppus.app', 'checkout.doppus.com'] },

  { name: 'Guru',      category: 'BR_CHECKOUT', color: '#10B981',
    domains: ['digitalmanager.guru', 'checkout.digitalmanager.guru', 'app.digitalmanager.guru'] },

  { name: 'Voomp',     category: 'BR_CHECKOUT', color: '#F97316',
    domains: ['voomp.com.br', 'voompay.com.br', 'checkout.voomp.com.br'] },

  // ── BR Drop / E-Commerce ─────────────────────────────────────────────────

  { name: 'Yampi',     category: 'BR_ECOMMERCE', color: '#6D28D9',
    domains: ['yampi.com.br', 'checkout.yampi.com.br', 'api.dooki.com.br'],
    wildcards: [/\.catalog\.yampi\.com\.br$/] },

  { name: 'CartPanda', category: 'BR_ECOMMERCE', color: '#FF5A1F',
    domains: ['cartpanda.com', 'accounts.cartpanda.com'],
    wildcards: [/\.mycartpanda\.com$/] },

  { name: 'AppMax',    category: 'BR_ECOMMERCE', color: '#1D4ED8',
    domains: ['appmax.com.br', 'admin.appmax.com.br', 'api.appmax.com.br'] },

  { name: 'Adoorei',   category: 'BR_ECOMMERCE', color: '#BE185D',
    domains: ['adoorei.com.br', 'checkout.adoorei.com.br'] },

  { name: 'Nuvemshop', category: 'BR_ECOMMERCE', color: '#38BDF8',
    domains: ['nuvemshop.com.br', 'checkout.nuvemshop.com.br'],
    wildcards: [/\.lojavirtualnuvem\.com\.br$/] },

  { name: 'Zippify',   category: 'BR_ECOMMERCE', color: '#8B5CF6',
    domains: ['zippify.com.br', 'checkout.zippify.com.br'] },

  { name: 'Mundpay',   category: 'BR_ECOMMERCE', color: '#0284C7',
    domains: ['mundpay.com', 'checkout.mundpay.com'] },

  // ── BR PSP Genérico ───────────────────────────────────────────────────────

  { name: 'Pagar.me',       category: 'BR_PSP', color: '#059669',
    domains: ['pagar.me', 'api.pagar.me', 'checkout.pagar.me'] },

  { name: 'Mercado Pago',   category: 'BR_PSP', color: '#009EE3',
    domains: ['mercadopago.com.br', 'api.mercadopago.com', 'sdk.mercadopago.com'] },

  { name: 'PagSeguro',      category: 'BR_PSP', color: '#00C853',
    domains: ['pagseguro.uol.com.br', 'pagbank.com.br', 'api.pagseguro.com'] },

  { name: 'Asaas',          category: 'BR_PSP', color: '#5B21B6',
    domains: ['asaas.com', 'api.asaas.com'] },

  { name: 'EBANX',          category: 'BR_PSP', color: '#00B0FF',
    domains: ['ebanx.com', 'pay.ebanx.com'] },

  // ── LATAM ─────────────────────────────────────────────────────────────────

  { name: 'dLocal',         category: 'LATAM', color: '#3B82F6',
    domains: ['dlocal.com', 'dlocalgo.com', 'pay.dlocalgo.com'] },

  { name: 'PayU LatAm',     category: 'LATAM', color: '#FF6D00',
    domains: ['payu.com', 'secure.payu.com', 'checkout.payulatam.com', 'gateway.payulatam.com'] },

  { name: 'Conekta',        category: 'LATAM', color: '#0070F3',
    domains: ['conekta.com', 'api.conekta.io', 'pay.conekta.com'] },

  { name: 'Wompi',          category: 'LATAM', color: '#00C073',
    domains: ['wompi.co', 'checkout.wompi.co', 'api.wompi.co'] },

  // ── US / Global ───────────────────────────────────────────────────────────

  { name: 'ClickBank',      category: 'US_CHECKOUT', color: '#1D4ED8',
    domains: ['clickbank.com'],
    wildcards: [/\.clickbank\.net$/, /\.pay\.clickbank\.net$/] },

  { name: 'Digistore24',    category: 'US_CHECKOUT', color: '#F59E0B',
    domains: ['digistore24.com', 'checkout-ds24.com'],
    wildcards: [/\.digistore24-app\.com$/] },

  { name: 'BuyGoods',       category: 'US_CHECKOUT', color: '#DC2626',
    domains: ['buygoods.com'],
    wildcards: [/\.buygoods\.com$/] },

  { name: 'SamCart',        category: 'US_CHECKOUT', color: '#7C3AED',
    domains: ['samcart.com'],
    wildcards: [/\.samcart\.com$/] },

  { name: 'ThriveCart',     category: 'US_CHECKOUT', color: '#0891B2',
    domains: ['thrivecart.com'],
    wildcards: [/\.thrivecart\.com$/] },

  { name: 'Kajabi',         category: 'US_CHECKOUT', color: '#6D28D9',
    domains: ['kajabi.com', 'checkout.kajabi.com'],
    wildcards: [/\.mykajabi\.com$/] },

  { name: 'Gumroad',        category: 'US_CHECKOUT', color: '#F43F5E',
    domains: ['gumroad.com', 'app.gumroad.com'],
    wildcards: [/\.gumroad\.com$/] },

  { name: 'Paddle',         category: 'US_CHECKOUT', color: '#14B8A6',
    domains: ['paddle.com', 'checkout.paddle.com', 'buy.paddle.com', 'pay.paddle.io'] },

  { name: 'Stripe',         category: 'US_CHECKOUT', color: '#6366F1',
    domains: ['stripe.com', 'checkout.stripe.com', 'buy.stripe.com', 'js.stripe.com'] },

  { name: 'Whop',           category: 'US_CHECKOUT', color: '#8B5CF6',
    domains: ['whop.com'],
    wildcards: [/\.whop\.com$/] },

  // ── US Funnel Builders ────────────────────────────────────────────────────

  { name: 'ClickFunnels',   category: 'US_FUNNEL', color: '#F97316',
    domains: ['clickfunnels.com'],
    wildcards: [/\.myclickfunnels\.com$/, /\.clickfunnels\.com$/] },

  { name: 'Systeme.io',     category: 'US_FUNNEL', color: '#0EA5E9',
    domains: ['systeme.io'],
    wildcards: [/\.systeme\.io$/] },

  { name: 'GoHighLevel',    category: 'US_FUNNEL', color: '#16A34A',
    domains: ['gohighlevel.com'],
    wildcards: [/\.leadconnectorhq\.com$/, /\.msgsndr\.com$/] },

  { name: 'Shopify',        category: 'US_FUNNEL', color: '#96BF48',
    domains: ['shopify.com', 'checkout.shopify.com', 'cdn.shopify.com'],
    wildcards: [/\.myshopify\.com$/] },

  { name: 'Kartra',         category: 'US_FUNNEL', color: '#7C3AED',
    domains: ['kartra.com'],
    wildcards: [/\.kartra\.com$/] },

  // ── VSL Players ───────────────────────────────────────────────────────────

  { name: 'VTurb',    category: 'VSL_PLAYER', color: '#F97316',
    domains: ['vturb.com.br', 'vturb.com', 'scripts.converteai.net', 'cdn.converteai.net', 'player.converteai.net'],
    note: 'Player carrega de converteai.net, não vturb' },

  { name: 'Panda Video', category: 'VSL_PLAYER', color: '#EF4444',
    domains: ['pandavideo.com.br', 'player.pandavideo.com.br'],
    wildcards: [/\.tv\.pandavideo\.com\.br$/, /b-vz-.*\.tv\.pandavideo\.com\.br/] },

  { name: 'Wistia',   category: 'VSL_PLAYER', color: '#54BAB9',
    domains: ['wistia.com', 'fast.wistia.net', 'fast.wistia.com', 'embed.wistia.com'] },

  { name: 'Vimeo',    category: 'VSL_PLAYER', color: '#1AB7EA',
    domains: ['vimeo.com', 'player.vimeo.com', 'vimeocdn.com'] },

  { name: 'Bunny CDN', category: 'VSL_PLAYER', color: '#F59E0B',
    domains: ['iframe.mediadelivery.net', 'video.bunnycdn.com'],
    wildcards: [/\.b-cdn\.net$/],
    note: 'CDN ≠ nome da marca' },

  { name: 'Cloudflare Stream', category: 'VSL_PLAYER', color: '#F97316',
    domains: ['cloudflarestream.com', 'videodelivery.net'],
    wildcards: [/customer-.*\.cloudflarestream\.com/],
    note: 'videodelivery.net é o domínio real' },

  { name: 'Mux',      category: 'VSL_PLAYER', color: '#6366F1',
    domains: ['mux.com', 'stream.mux.com', 'image.mux.com'] },

  { name: 'Vidalytics', category: 'VSL_PLAYER', color: '#DC2626',
    domains: ['vidalytics.com', 'quick.vidalytics.com'] },

  { name: 'JW Player', category: 'VSL_PLAYER', color: '#FF6D00',
    domains: ['jwplayer.com', 'cdn.jwplayer.com', 'content.jwplatform.com'] },

  { name: 'Kinescope', category: 'VSL_PLAYER', color: '#7C3AED',
    domains: ['kinescope.io'],
    wildcards: [/\.kinescope\.io$/] },

  { name: 'Spotlightr', category: 'VSL_PLAYER', color: '#0891B2',
    domains: ['spotlightr.com', 'cdn.spotlightr.com'],
    wildcards: [/\.cdn\.spotlightr\.com$/] },
];

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÕES DE DETECÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detecta qual tecnologia está presente em uma URL de destino.
 * Retorna o objeto Technology ou null se não encontrado.
 */
export function detectTechnology(url: string | null | undefined): Technology | null {
  if (!url) return null;

  let hostname = '';
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    hostname = url.toLowerCase();
  }

  for (const tech of TECHNOLOGY_MAP) {
    // Match literal de domínio (sufixo, ex: checkout.kiwify.com bate em kiwify.com)
    if (tech.domains.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
      return tech;
    }
    // Match por regex (wildcards dinâmicos)
    if (tech.wildcards?.some(rx => rx.test(hostname))) {
      return tech;
    }
  }

  return null;
}

/**
 * Detecta player VSL em uma string de texto (ex: adCopy, externalServices)
 * Útil quando a URL do destino é a landing page e não o player diretamente.
 */
export function detectPlayerFromText(text: string | null | undefined): Technology | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  return TECHNOLOGY_MAP
    .filter(t => t.category === 'VSL_PLAYER')
    .find(t =>
      t.domains.some(d => lower.includes(d)) ||
      t.wildcards?.some(rx => rx.test(lower))
    ) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS PARA FILTROS DE UI
// ─────────────────────────────────────────────────────────────────────────────

export const CHECKOUT_PLATFORMS = TECHNOLOGY_MAP.filter(
  t => t.category === 'BR_CHECKOUT' || t.category === 'BR_ECOMMERCE' || t.category === 'US_CHECKOUT' || t.category === 'US_FUNNEL'
);

export const VSL_PLATFORMS = TECHNOLOGY_MAP.filter(
  t => t.category === 'VSL_PLAYER'
);

export const CATEGORY_LABELS: Record<TechCategory, string> = {
  BR_CHECKOUT:  '🇧🇷 Checkout Brasil',
  BR_ECOMMERCE: '🛒 Drop / E-com BR',
  BR_PSP:       '🔌 PSP Genérico BR',
  LATAM:        '🌎 LATAM',
  US_CHECKOUT:  '🇺🇸 Checkout Global',
  US_FUNNEL:    '⚡ Funnel Builder',
  VSL_PLAYER:   '🎬 Player VSL',
};
