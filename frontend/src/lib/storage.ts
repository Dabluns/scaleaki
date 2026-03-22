// Sistema centralizado para gerenciar localStorage
// Evita duplicação e garante consistência

// ===== CONSTANTES DE CHAVES =====
export const STORAGE_KEYS = {
  THEME_MODE: 'theme-mode',
  FAVORITES: 'ofertas-favoritas', // DEPRECATED - usar sistema de favoritos
  AUTH_TOKEN: 'auth_token', // DEPRECATED - usar cookies
} as const;

// ===== TIPOS =====
export type ThemeMode = 'dark' | 'light';

// ===== CLASSE STORAGE MANAGER =====
class StorageManager {
  private static instance: StorageManager;
  
  private constructor() {}
  
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // ===== MÉTODOS GENÉRICOS =====
  
  /**
   * Obtém um valor do localStorage
   */
  get(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Erro ao ler localStorage[${key}]:`, error);
      return null;
    }
  }

  /**
   * Define um valor no localStorage
   */
  set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erro ao escrever localStorage[${key}]:`, error);
    }
  }

  /**
   * Remove um item do localStorage
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erro ao remover localStorage[${key}]:`, error);
    }
  }

  /**
   * Verifica se uma chave existe no localStorage
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Limpa todo o localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
  }

  // ===== MÉTODOS ESPECÍFICOS =====

  /**
   * Gerenciamento de tema
   */
  getThemeMode(): ThemeMode | null {
    return this.get(STORAGE_KEYS.THEME_MODE);
  }

  setThemeMode(mode: ThemeMode): void {
    this.set(STORAGE_KEYS.THEME_MODE, mode);
  }

  /**
   * Gerenciamento de favoritos (DEPRECATED)
   * @deprecated Use o sistema de favoritos do banco de dados
   */
  getFavorites(): string[] {
    return this.get(STORAGE_KEYS.FAVORITES) || [];
  }

  setFavorites(favorites: string[]): void {
    this.set(STORAGE_KEYS.FAVORITES, favorites);
  }

  addFavorite(ofertaId: string): void {
    const favorites = this.getFavorites();
    if (!favorites.includes(ofertaId)) {
      favorites.push(ofertaId);
      this.setFavorites(favorites);
    }
  }

  removeFavorite(ofertaId: string): void {
    const favorites = this.getFavorites();
    const filtered = favorites.filter(id => id !== ofertaId);
    this.setFavorites(filtered);
  }

  isFavorite(ofertaId: string): boolean {
    return this.getFavorites().includes(ofertaId);
  }

  /**
   * Gerenciamento de token (DEPRECATED)
   * @deprecated Use o sistema de cookies em lib/auth.ts
   */
  getAuthToken(): string | null {
    return this.get(STORAGE_KEYS.AUTH_TOKEN);
  }

  setAuthToken(token: string): void {
    this.set(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  removeAuthToken(): void {
    this.remove(STORAGE_KEYS.AUTH_TOKEN);
  }

  // ===== MIGRAÇÃO DE DADOS =====

  /**
   * Migra favoritos do localStorage para o sistema de favoritos
   * @deprecated Função temporária para migração
   */
  async migrateFavoritesToDatabase(): Promise<void> {
    const favorites = this.getFavorites();
    if (favorites.length === 0) return;

    try {
      // Aqui você pode implementar a migração para o banco
      console.log('Migrando favoritos para banco de dados:', favorites);
      
      // Após migração bem-sucedida, limpar localStorage
      this.remove(STORAGE_KEYS.FAVORITES);
    } catch (error) {
      console.error('Erro na migração de favoritos:', error);
    }
  }

  /**
   * Limpa dados deprecated do localStorage
   */
  cleanupDeprecatedData(): void {
    // Remover favoritos antigos
    if (this.has(STORAGE_KEYS.FAVORITES)) {
      console.warn('Removendo favoritos antigos do localStorage');
      this.remove(STORAGE_KEYS.FAVORITES);
    }

    // Remover token antigo
    if (this.has(STORAGE_KEYS.AUTH_TOKEN)) {
      console.warn('Removendo token antigo do localStorage');
      this.remove(STORAGE_KEYS.AUTH_TOKEN);
    }
  }
}

// ===== INSTÂNCIA SINGLETON =====
export const storage = StorageManager.getInstance();

// ===== EXPORTS PARA COMPATIBILIDADE =====
export default storage; 