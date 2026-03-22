import { Nicho } from './nicho';
import { PlataformaAnuncio, TipoOferta, StatusOferta, Linguagem } from '@prisma/client';

export { PlataformaAnuncio, TipoOferta, StatusOferta, Linguagem };

export interface MetricasOferta {
  conversoes?: number;
  receita?: number;
  alcance?: number;
  impressoes?: number;
  cliques?: number;
  gasto?: number;
}

export interface Oferta {
  id: string;
  titulo: string;
  imagem?: string | null;
  texto: string;
  nichoId: string;
  nicho?: Nicho;
  plataforma: PlataformaAnuncio;
  tipoOferta: TipoOferta;
  status: StatusOferta;
  tags?: string | null;
  linguagem: Linguagem;
  links: string[];
  metricas?: MetricasOferta | null;
  vsl?: string | null;
  vslDescricao?: string | null;
  // Campos de performance diretos
  receita?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOfertaInput {
  titulo: string;
  imagem?: string;
  texto: string;
  nichoId: string;
  plataforma: PlataformaAnuncio;
  tipoOferta: TipoOferta;
  status?: StatusOferta;
  tags?: string[];
  linguagem?: Linguagem;
  links: string[];
  metricas?: MetricasOferta;
  vsl?: string;
  vslDescricao?: string;
  // Campos de performance
  receita?: number;
}

export interface UpdateOfertaInput extends Partial<CreateOfertaInput> {
  id: string;
}

export interface OfertasFilters {
  plataforma?: PlataformaAnuncio;
  tipoOferta?: TipoOferta;
  status?: StatusOferta;
  nichoId?: string;
  linguagem?: Linguagem;
  tags?: string[];
  search?: string;
}

export interface OfertasSortOptions {
  field: 'createdAt' | 'conversoes' | 'receita' | 'titulo';
  order: 'asc' | 'desc';
}

export interface OfertasPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface OfertasResponse {
  data: Oferta[];
  pagination: OfertasPagination;
}

// Tipos para relatórios
export interface RelatorioNichos {
  nichoId: string;
  nichoNome: string;
  totalOfertas: number;
  totalReceita: number;
  totalConversoes: number;
}

export interface RelatorioPlataformas {
  plataforma: PlataformaAnuncio;
  totalOfertas: number;
  totalReceita: number;
  totalConversoes: number;
}

export interface RelatorioTendencias {
  data: string;
  ofertasCriadas: number;
  totalReceita: number;
  totalConversoes: number;
} 