export interface UserProgress {
  userId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  lastActiveDate: string;
  badges: Badge[];
  stats: UserStats;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
}

export interface UserStats {
  totalFavoritos: number;
  ofertasVisualizadas: number;
  diasConsecutivos: number;
  nichosExplorados: number;
  achievements: string[];
  reelsVisualizados: number;
  reelsFavoritados: number;
}

export const BADGES: Record<string, Badge> = {
  // Conquistas de Favoritos
  EXPLORADOR_INICIANTE: {
    id: 'explorador_iniciante',
    name: 'Explorador Iniciante',
    description: 'Favoritou 10 ofertas',
    icon: '🔍',
    rarity: 'common',
  },
  COLECIONADOR: {
    id: 'colecionador',
    name: 'Colecionador',
    description: 'Favoritou 50 ofertas',
    icon: '📚',
    rarity: 'rare',
  },
  VISIONARIO: {
    id: 'visionario',
    name: 'Visionário',
    description: 'Favoritou 100 ofertas',
    icon: '🔮',
    rarity: 'epic',
  },
  MESTRE_ESCALADOR: {
    id: 'mestre_escalador',
    name: 'Mestre Escalador',
    description: 'Favoritou 500 ofertas',
    icon: '🚀',
    rarity: 'legendary',
  },
  // Conquistas de Streak
  STREAK_7: {
    id: 'streak_7',
    name: 'Dedicado',
    description: '7 dias consecutivos',
    icon: '🔥',
    rarity: 'common',
  },
  STREAK_30: {
    id: 'streak_30',
    name: 'Comprometido',
    description: '30 dias consecutivos',
    icon: '💎',
    rarity: 'rare',
  },
  STREAK_100: {
    id: 'streak_100',
    name: 'Lendário',
    description: '100 dias consecutivos',
    icon: '👑',
    rarity: 'legendary',
  },
  // Conquistas de Exploração
  EXPLORADOR_NICHOS: {
    id: 'explorador_nichos',
    name: 'Explorador de Nichos',
    description: 'Explorou 20 nichos diferentes',
    icon: '🗺️',
    rarity: 'epic',
  },
  NAVEGADOR: {
    id: 'navegador',
    name: 'Navegador',
    description: 'Visualizou 50 ofertas',
    icon: '👁️',
    rarity: 'common',
  },
  OBSERVADOR: {
    id: 'observador',
    name: 'Observador',
    description: 'Visualizou 200 ofertas',
    icon: '🔭',
    rarity: 'rare',
  },
  ANALISTA: {
    id: 'analista',
    name: 'Analista',
    description: 'Visualizou 1000 ofertas',
    icon: '📊',
    rarity: 'epic',
  },
  // Conquistas de Nível
  INICIANTE: {
    id: 'iniciante',
    name: 'Iniciante',
    description: 'Alcançou o nível 3',
    icon: '⭐',
    rarity: 'common',
  },
  AVANCADO: {
    id: 'avancado',
    name: 'Avançado',
    description: 'Alcançou o nível 5',
    icon: '🌟',
    rarity: 'rare',
  },
  EXPERT: {
    id: 'expert',
    name: 'Expert',
    description: 'Alcançou o nível 7',
    icon: '💫',
    rarity: 'epic',
  },
  MESTRE: {
    id: 'mestre',
    name: 'Mestre',
    description: 'Alcançou o nível 10',
    icon: '🏆',
    rarity: 'legendary',
  },
  // Conquistas Especiais
  PRIMEIRO_PASSO: {
    id: 'primeiro_passo',
    name: 'Primeiro Passo',
    description: 'Favoritou sua primeira oferta',
    icon: '🎯',
    rarity: 'common',
  },
  EXPLORADOR_PLATAFORMAS: {
    id: 'explorador_plataformas',
    name: 'Explorador de Plataformas',
    description: 'Explorou ofertas de 5 plataformas diferentes',
    icon: '🌐',
    rarity: 'rare',
  },
  CAZADOR_DE_OFERTAS: {
    id: 'cazador_ofertas',
    name: 'Caçador de Ofertas',
    description: 'Visualizou ofertas de todos os nichos',
    icon: '🎪',
    rarity: 'epic',
  },
  // Conquistas de Reels
  DESCOBRIDOR: {
    id: 'descobridor',
    name: 'Descobridor',
    description: 'Favoritou seu primeiro reel',
    icon: '✨',
    rarity: 'common',
  },
  REEL_MASTER: {
    id: 'reel_master',
    name: 'Reel Master',
    description: 'Visualizou 100 reels',
    icon: '🎬',
    rarity: 'rare',
  },
  REEL_LEGEND: {
    id: 'reel_legend',
    name: 'Lenda dos Reels',
    description: 'Visualizou 500 reels',
    icon: '👑',
    rarity: 'legendary',
  },
  VICIADO_EM_REELS: {
    id: 'viciado_reels',
    name: 'Viciado em Reels',
    description: 'Visualizou 50 reels em um dia',
    icon: '🔥',
    rarity: 'epic',
  },
};

export const XP_TABLE = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  500,   // Level 4
  1000,  // Level 5
  2000,  // Level 6
  3500,  // Level 7
  5500,  // Level 8
  8000,  // Level 9
  12000, // Level 10
];

export const XP_ACTIONS = {
  FAVORITAR_OFERTA: 10,
  VISUALIZAR_OFERTA: 5,
  EXPLORAR_NICHO: 15,
  LOGIN_DIARIO: 20,
  COMPLETAR_PERFIL: 50,
  PRIMEIRO_FAVORITO: 25,
  VISUALIZAR_REEL: 8,
  FAVORITAR_REEL: 15,
  PRIMEIRO_REEL: 30,
  DOWNLOAD_LANDING: 20,
};

