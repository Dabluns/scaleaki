export interface Nicho {
  id?: string; // para CRUD futuro
  nome: string;
  slug: string;
  icone: string; // nome do ícone Lucide ou caminho SVG
  descricao?: string;
  cor?: string; // cor do nicho
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
} 