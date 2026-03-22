// Script de migração para limpar dados antigos do localStorage
// Execute este script uma vez para migrar dados antigos

import { storage } from './storage';

/**
 * Migra dados antigos do localStorage para o novo sistema
 * Execute esta função uma vez na inicialização da aplicação
 */
export async function migrateOldStorageData(): Promise<void> {
  console.log('🔄 Iniciando migração de dados do localStorage...');

  try {
    // 1. Limpar dados deprecated
    storage.cleanupDeprecatedData();

    // 2. Migrar favoritos se necessário
    await storage.migrateFavoritesToDatabase();

    // 3. Verificar se há outras chaves antigas
    const oldKeys = [
      'ofertas-favoritas',
      'auth_token',
      'user_preferences',
      'search_history',
      'last_visited'
    ];

    oldKeys.forEach(key => {
      if (storage.has(key)) {
        console.warn(`⚠️ Chave antiga encontrada: ${key}`);
        // Você pode decidir se quer manter ou remover
        // storage.remove(key);
      }
    });

    console.log('✅ Migração de localStorage concluída');
  } catch (error) {
    console.error('❌ Erro na migração de localStorage:', error);
  }
}

/**
 * Verifica se há dados antigos no localStorage
 */
export function checkOldStorageData(): {
  hasOldFavorites: boolean;
  hasOldToken: boolean;
  hasOtherOldData: boolean;
  oldKeys: string[];
} {
  const oldKeys = [
    'ofertas-favoritas',
    'auth_token',
    'user_preferences',
    'search_history',
    'last_visited'
  ];

  const foundKeys = oldKeys.filter(key => storage.has(key));

  return {
    hasOldFavorites: storage.has('ofertas-favoritas'),
    hasOldToken: storage.has('auth_token'),
    hasOtherOldData: foundKeys.length > 0,
    oldKeys: foundKeys
  };
}

/**
 * Limpa todos os dados antigos do localStorage
 */
export function clearAllOldStorageData(): void {
  console.log('🧹 Limpando todos os dados antigos do localStorage...');

  const oldKeys = [
    'ofertas-favoritas',
    'auth_token',
    'user_preferences',
    'search_history',
    'last_visited'
  ];

  oldKeys.forEach(key => {
    if (storage.has(key)) {
      storage.remove(key);
      console.log(`🗑️ Removido: ${key}`);
    }
  });

  console.log('✅ Limpeza concluída');
}

// Executar migração automaticamente se estiver no browser
if (typeof window !== 'undefined') {
  // Executar apenas uma vez por sessão
  if (!sessionStorage.getItem('storage_migration_done')) {
    migrateOldStorageData().then(() => {
      sessionStorage.setItem('storage_migration_done', 'true');
    });
  }
} 