export interface Nicho {
  id: string;
  nome: string;
  icone: string;
  descricao?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Oferta {
  id: string;
  titulo: string;
  imagem?: string;
  texto: string;
  nichoId: string;
  nicho?: Nicho;
  plataforma: 'facebook_ads' | 'google_ads' | 'tiktok_ads' | 'instagram_ads' | 'linkedin_ads' | 'twitter_ads' | 'pinterest_ads' | 'snapchat_ads';
  tipoOferta: 'ecommerce' | 'lead_generation' | 'app_install' | 'brand_awareness' | 'video_views' | 'conversions' | 'traffic';
  status: 'ativa' | 'pausada' | 'arquivada' | 'teste';
  tags?: string[];
  linguagem: 'pt_BR' | 'en_US' | 'es_ES' | 'fr_FR';
  links: string[];
  metricas?: any;
  vsl?: string;
  vslDescricao?: string;
  receita?: number;
  // Marketing Metrics
  roi?: number;
  ctr?: number;
  cpc?: number;
  conversoes?: number;
  custoTotal?: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface OfertasFilters {
  search?: string;
  plataforma?: string;
  tipoOferta?: string;
  status?: string;
  nichoId?: string;
  linguagem?: string;
}

export interface OfertasSortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface OfertasResponse {
  data: Oferta[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} 