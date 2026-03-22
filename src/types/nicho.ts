export interface Nicho {
  id: string;
  nome: string;
  slug: string;
  icone: string;
  descricao?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNichoInput {
  nome: string;
  slug: string;
  icone: string;
  descricao?: string;
}

export interface UpdateNichoInput {
  nome?: string;
  slug?: string;
  icone?: string;
  descricao?: string;
  isActive?: boolean;
} 