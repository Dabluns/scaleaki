import nookies from 'nookies';

/**
 * Cliente das features Scaleaki+ (commit backend 88d7eec).
 * Endpoints: /marketplace, /adspy, /funil, /criativo, /scaleflix, /placa.
 * Todos exigem Bearer token. Fonte de verdade do gating = backend + /account/access.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'auth_token';

// ── Tipos espelhando o schema Prisma ────────────────────────────────

export type ProductSource = 'dropshipping' | 'mercadolivre' | 'aliexpress' | 'shopee' | 'shein';
export type AdPlatform = 'youtube' | 'tiktok';
export type PlacaStatus = 'pendente' | 'aprovada' | 'enviada' | 'rejeitada';
export type Veredito = 'aprovado' | 'risco' | 'reprovado';

export interface ScaledProduct {
  id: string;
  source: ProductSource;
  externalId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  productUrl: string;
  storeName: string | null;
  price: number | null;
  originalPrice: number | null;
  discountPct: number | null;
  currency: string | null;
  soldCount: number | null;
  rating: number | null;
  reviewCount: number | null;
  category: string | null;
  escala: number | null;
  createdAt: string;
}

export interface ScaledAd {
  id: string;
  platform: AdPlatform;
  externalId: string;
  advertiser: string | null;
  title: string | null;
  adCopy: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  landingUrl: string | null;
  views: number | null;
  likes: number | null;
  shares: number | null;
  ctaText: string | null;
  region: string | null;
  firstSeen: string | null;
  lastSeen: string | null;
  escala: number | null;
  createdAt: string;
}

export interface FunnelExtraction {
  id: string;
  domain: string;
  checkout: string | null;
  tecnologia: string | null;
  activePixels: string[];
  subdomains: string[];
  externalServices: string[];
  screenshot: string | null;
  redirectChain: string[];
  urlscanUuid: string | null;
  estimatedVisits: number | null;
  status: 'pending' | 'done' | 'failed';
  createdAt: string;
}

export interface PreaproveResult {
  veredito: Veredito;
  score: number;
  motivos: string[];
  ajustes: string[];
  termosProblema: string[];
}

export interface ScaleflixVideo {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl: string;
  durationSec: number | null;
  module: string | null;
  ordem: number;
}

export interface PlacaRequest {
  id: string;
  faturamento: number;
  periodo: string;
  comprovante: string | null;
  observacao: string | null;
  status: PlacaStatus;
  adminNote: string | null;
  trackingUrl: string | null;
  createdAt: string;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Helper de fetch autenticado ──────────────────────────────────────

function authHeaders(json = false): HeadersInit {
  const token = nookies.get(null)[TOKEN_KEY];
  const h: HeadersInit = {};
  if (json) h['Content-Type'] = 'application/json';
  if (token && token !== 'undefined' && token !== 'null') h['Authorization'] = `Bearer ${token}`;
  return h;
}

export class PlusApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, code?: string, message?: string) {
    super(message || code || `Erro ${status}`);
    this.status = status;
    this.code = code;
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new PlusApiError(res.status, body.error, body.message);
  }
  return res.json();
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new PlusApiError(res.status, body.error, body.message);
  }
  return res.json();
}

// ── Marketplace ──────────────────────────────────────────────────────

export interface MarketplaceQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  discountMin?: number;
  orderBy?: 'escala' | 'soldCount' | 'discountPct' | 'price' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface MarketplaceListResponse {
  data: ScaledProduct[];
  meta: PageMeta;
  limitReached: boolean;
  source: ProductSource;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const marketplaceApi = {
  list: (source: ProductSource, q: MarketplaceQuery = {}) =>
    get<MarketplaceListResponse>(`/marketplace/${source}${qs(q as any)}`),
  categories: (source: ProductSource) =>
    get<{ data: string[] }>(`/marketplace/${source}/meta/categories`),
  detail: (source: ProductSource, id: string) =>
    get<{ data: ScaledProduct }>(`/marketplace/${source}/${id}`),
};

// ── AdSpy ────────────────────────────────────────────────────────────

export interface AdspyQuery {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: 'escala' | 'views' | 'likes' | 'createdAt' | 'lastSeen';
  order?: 'asc' | 'desc';
}

export interface AdspyListResponse {
  data: ScaledAd[];
  meta: PageMeta;
  platform: AdPlatform;
}

export const adspyApi = {
  list: (platform: AdPlatform, q: AdspyQuery = {}) =>
    get<AdspyListResponse>(`/adspy/${platform}${qs(q as any)}`),
  detail: (platform: AdPlatform, id: string) =>
    get<{ data: ScaledAd }>(`/adspy/${platform}/${id}`),
};

// ── Funil ────────────────────────────────────────────────────────────

export const funilApi = {
  extract: (domain: string) => post<{ data: FunnelExtraction }>(`/funil`, { domain }),
  list: (page = 1, limit = 20) =>
    get<{ data: FunnelExtraction[]; meta: PageMeta }>(`/funil${qs({ page, limit })}`),
  detail: (id: string) => get<{ data: FunnelExtraction }>(`/funil/${id}`),
};

// ── Pré-aprovador ────────────────────────────────────────────────────

export interface PreaproveInput {
  headline?: string;
  copy?: string;
  descricao?: string;
  plataforma?: 'meta' | 'google';
}

export interface RewriteInput extends PreaproveInput {
  termosProblema?: string[];
}

export interface RewriteResult {
  headline: string;
  copy: string;
  descricao: string;
  mudancas: string[];
  anguloSchwartz: string;
}

export const preaprovadorApi = {
  run: (input: PreaproveInput) => post<{ data: PreaproveResult }>(`/criativo/pre-aprovar`, input),
  rewrite: (input: RewriteInput) => post<{ data: RewriteResult }>(`/criativo/reescrever`, input),
};

// ── Scaleflix ────────────────────────────────────────────────────────

export const scaleflixApi = {
  list: (module?: string) => get<{ data: ScaleflixVideo[] }>(`/scaleflix${qs({ module })}`),
  detail: (id: string) => get<{ data: ScaleflixVideo }>(`/scaleflix/${id}`),
};

// ── Placa ────────────────────────────────────────────────────────────

export interface PlacaInput {
  faturamento: number;
  periodo: string;
  comprovante?: string;
  observacao?: string;
}

export const placaApi = {
  request: (input: PlacaInput) => post<{ data: PlacaRequest }>(`/placa`, input),
  mine: () => get<{ data: PlacaRequest[] }>(`/placa/me`),
};
