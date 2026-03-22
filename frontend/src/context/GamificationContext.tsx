'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { UserProgress, BADGES, XP_TABLE, XP_ACTIONS } from '@/types/gamification';
import { useConfetti } from '@/lib/confetti';
import { useAuth } from './AuthContext';

interface GamificationContextType {
  progress: UserProgress | null;
  addXP: (action: keyof typeof XP_ACTIONS) => void;
  checkAndUnlockBadges: () => void;
  incrementStreak: () => void;
  updateStats: (stats: Partial<UserProgress['stats']>) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  
  const { fireworks, premium } = useConfetti();

  const initializeProgress = useCallback(() => {
    if (!user?.id) return;

    const newProgress: UserProgress = {
      userId: user.id,
      level: 1,
      xp: 0,
      xpToNextLevel: XP_TABLE[1],
      streak: 0,
      lastActiveDate: new Date().toISOString(),
      badges: [],
      stats: {
        totalFavoritos: 0,
        ofertasVisualizadas: 0,
        diasConsecutivos: 0,
        nichosExplorados: 0,
        achievements: [],
        reelsVisualizados: 0,
        reelsFavoritados: 0,
      },
    };
    
    setProgress(newProgress);
    // Salvar imediatamente no localStorage
    localStorage.setItem(`gamification_${user.id}`, JSON.stringify(newProgress));
  }, [user?.id]);

  // Carregar progresso do localStorage
  useEffect(() => {
    if (!user?.id) return;

    const stored = localStorage.getItem(`gamification_${user.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Validar e corrigir dados carregados
        const validatedProgress: UserProgress = {
          userId: parsed.userId || user.id,
          level: Math.max(1, Math.min(parsed.level || 1, XP_TABLE.length)),
          xp: Math.max(0, parsed.xp || 0),
          xpToNextLevel: parsed.xpToNextLevel || XP_TABLE[parsed.level || 1] || XP_TABLE[1],
          streak: Math.max(0, parsed.streak || 0),
          lastActiveDate: parsed.lastActiveDate || new Date().toISOString(),
          badges: Array.isArray(parsed.badges) ? parsed.badges : [],
        stats: {
          totalFavoritos: Math.max(0, parsed.stats?.totalFavoritos || 0),
          ofertasVisualizadas: Math.max(0, parsed.stats?.ofertasVisualizadas || 0),
          diasConsecutivos: Math.max(0, parsed.stats?.diasConsecutivos || 0),
          nichosExplorados: Math.max(0, parsed.stats?.nichosExplorados || 0),
          achievements: Array.isArray(parsed.stats?.achievements) ? parsed.stats.achievements : [],
          reelsVisualizados: Math.max(0, parsed.stats?.reelsVisualizados || 0),
          reelsFavoritados: Math.max(0, parsed.stats?.reelsFavoritados || 0),
        },
        };
        
        // Garantir que o nível está correto baseado no XP
        let correctLevel = 1;
        for (let i = XP_TABLE.length - 1; i >= 1; i--) {
          if (validatedProgress.xp >= XP_TABLE[i]) {
            correctLevel = i + 1;
            break;
          }
        }
        
        // Se o nível estava incorreto, corrigir
        if (correctLevel !== validatedProgress.level) {
          validatedProgress.level = correctLevel;
          validatedProgress.xpToNextLevel = XP_TABLE[correctLevel] || XP_TABLE[XP_TABLE.length - 1];
        }
        
        // Sincronizar favoritos existentes com stats e XP (se necessário)
        if (user?.id) {
          try {
            const storedFavoritos = localStorage.getItem(`favoritos_${user.id}`);
            if (storedFavoritos) {
              const favoritosIds = JSON.parse(storedFavoritos);
              const totalFavoritos = Array.isArray(favoritosIds) ? favoritosIds.length : 0;
              
              // Se há favoritos mas o XP não reflete isso, calcular XP retroativo
              if (totalFavoritos > validatedProgress.stats.totalFavoritos) {
                const favoritosNovos = totalFavoritos - validatedProgress.stats.totalFavoritos;
                
                // Adicionar XP para favoritos que não foram contados
                // Primeiro favorito = 25 XP, demais = 10 XP cada
                let xpRetroativo = 0;
                if (validatedProgress.stats.totalFavoritos === 0 && totalFavoritos > 0) {
                  // Primeiro favorito
                  xpRetroativo += XP_ACTIONS.PRIMEIRO_FAVORITO;
                  xpRetroativo += (totalFavoritos - 1) * XP_ACTIONS.FAVORITAR_OFERTA;
                } else {
                  // Apenas favoritos adicionais
                  xpRetroativo = favoritosNovos * XP_ACTIONS.FAVORITAR_OFERTA;
                }
                
                validatedProgress.xp += xpRetroativo;
                validatedProgress.stats.totalFavoritos = totalFavoritos;
                
                // Recalcular nível baseado no novo XP
                let correctLevel = 1;
                for (let i = XP_TABLE.length - 1; i >= 1; i--) {
                  if (validatedProgress.xp >= XP_TABLE[i]) {
                    correctLevel = i + 1;
                    break;
                  }
                }
                validatedProgress.level = correctLevel;
                validatedProgress.xpToNextLevel = XP_TABLE[correctLevel] || XP_TABLE[XP_TABLE.length - 1];
              } else if (validatedProgress.stats.totalFavoritos !== totalFavoritos) {
                // Apenas atualizar stats se não houver diferença de XP
                validatedProgress.stats.totalFavoritos = totalFavoritos;
              }
            }
          } catch (error) {
            console.error('Erro ao sincronizar favoritos:', error);
          }
        }
        
        setProgress(validatedProgress);
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
        initializeProgress();
      }
    } else {
      initializeProgress();
    }
  }, [user?.id, initializeProgress]);

  // Salvar progresso no localStorage quando mudar
  useEffect(() => {
    if (!user?.id || !progress) return;
    
    try {
      // Garantir que os dados estão válidos antes de salvar
      const progressToSave = {
        ...progress,
        xp: Math.max(0, progress.xp),
        level: Math.max(1, Math.min(progress.level, XP_TABLE.length)),
        xpToNextLevel: XP_TABLE[progress.level] || XP_TABLE[XP_TABLE.length - 1],
      };
      
      localStorage.setItem(`gamification_${user.id}`, JSON.stringify(progressToSave));
    } catch (error) {
      console.error('Erro ao salvar progresso no localStorage:', error);
    }
  }, [progress, user?.id]);

  const addXP = useCallback((action: keyof typeof XP_ACTIONS) => {
    const xpGain = XP_ACTIONS[action];
    
    setProgress((prev) => {
      if (!prev) {
        console.warn('addXP chamado mas progress é null');
        return prev;
      }
      
      const newXP = prev.xp + xpGain;
      let newLevel = prev.level;
      let xpToNextLevel = prev.xpToNextLevel;
      let leveledUp = false;

      // Verificar level up
      while (newXP >= xpToNextLevel && newLevel < XP_TABLE.length) {
        newLevel++;
        xpToNextLevel = XP_TABLE[newLevel] || XP_TABLE[XP_TABLE.length - 1];
        leveledUp = true;
      }

      // Celebração de level up
      if (leveledUp) {
        setTimeout(() => fireworks(), 100);
      }

      const updatedProgress = {
        ...prev,
        xp: newXP,
        level: newLevel,
        xpToNextLevel,
      };

      // Salvar imediatamente no localStorage
      if (user?.id) {
        try {
          localStorage.setItem(`gamification_${user.id}`, JSON.stringify(updatedProgress));
        } catch (error) {
          console.error('Erro ao salvar XP no localStorage:', error);
        }
      }

      return updatedProgress;
    });
  }, [fireworks, user?.id]);

  const checkAndUnlockBadges = useCallback(() => {
    setProgress((prev) => {
      if (!prev) return prev;

      const newBadges = [...prev.badges];
      let hasNewBadge = false;

      // Verificar badges de favoritos
      const { totalFavoritos } = prev.stats;
      
      if (totalFavoritos >= 1 && !newBadges.find(b => b.id === 'primeiro_passo')) {
        newBadges.push({ ...BADGES.PRIMEIRO_PASSO, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }
      
      if (totalFavoritos >= 10 && !newBadges.find(b => b.id === 'explorador_iniciante')) {
        newBadges.push({ ...BADGES.EXPLORADOR_INICIANTE, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }
      
      if (totalFavoritos >= 50 && !newBadges.find(b => b.id === 'colecionador')) {
        newBadges.push({ ...BADGES.COLECIONADOR, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }
      
      if (totalFavoritos >= 100 && !newBadges.find(b => b.id === 'visionario')) {
        newBadges.push({ ...BADGES.VISIONARIO, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }
      
      if (totalFavoritos >= 500 && !newBadges.find(b => b.id === 'mestre_escalador')) {
        newBadges.push({ ...BADGES.MESTRE_ESCALADOR, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }

      // Verificar badges de streak
      const { streak } = prev;
      
      if (streak >= 7 && !newBadges.find(b => b.id === 'streak_7')) {
        newBadges.push({ ...BADGES.STREAK_7, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }
      
      if (streak >= 30 && !newBadges.find(b => b.id === 'streak_30')) {
        newBadges.push({ ...BADGES.STREAK_30, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }

      if (streak >= 100 && !newBadges.find(b => b.id === 'streak_100')) {
        newBadges.push({ ...BADGES.STREAK_100, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }

      // Verificar badges de exploração
      const { ofertasVisualizadas, nichosExplorados } = prev.stats;
      
      if (ofertasVisualizadas >= 50 && !newBadges.find(b => b.id === 'navegador')) {
        newBadges.push({ ...BADGES.NAVEGADOR, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }
      
      if (ofertasVisualizadas >= 200 && !newBadges.find(b => b.id === 'observador')) {
        newBadges.push({ ...BADGES.OBSERVADOR, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }
      
      if (ofertasVisualizadas >= 1000 && !newBadges.find(b => b.id === 'analista')) {
        newBadges.push({ ...BADGES.ANALISTA, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }

      if (nichosExplorados >= 20 && !newBadges.find(b => b.id === 'explorador_nichos')) {
        newBadges.push({ ...BADGES.EXPLORADOR_NICHOS, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }

      // Verificar badges de nível
      const { level } = prev;
      
      if (level >= 3 && !newBadges.find(b => b.id === 'iniciante')) {
        newBadges.push({ ...BADGES.INICIANTE, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }
      
      if (level >= 5 && !newBadges.find(b => b.id === 'avancado')) {
        newBadges.push({ ...BADGES.AVANCADO, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }
      
      if (level >= 7 && !newBadges.find(b => b.id === 'expert')) {
        newBadges.push({ ...BADGES.EXPERT, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }
      
      if (level >= 10 && !newBadges.find(b => b.id === 'mestre')) {
        newBadges.push({ ...BADGES.MESTRE, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }

      // Verificar badges de reels
      const { reelsVisualizados = 0, reelsFavoritados = 0 } = prev.stats;
      
      if (reelsFavoritados >= 1 && !newBadges.find(b => b.id === 'descobridor')) {
        newBadges.push({ ...BADGES.DESCOBRIDOR, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }
      
      if (reelsVisualizados >= 100 && !newBadges.find(b => b.id === 'reel_master')) {
        newBadges.push({ ...BADGES.REEL_MASTER, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }
      
      if (reelsVisualizados >= 500 && !newBadges.find(b => b.id === 'reel_legend')) {
        newBadges.push({ ...BADGES.REEL_LEGEND, unlockedAt: new Date().toISOString() });
        hasNewBadge = true;
      }

      // Celebração se houver novo badge
      if (hasNewBadge) {
        setTimeout(() => premium(), 100);
      }

      return {
        ...prev,
        badges: newBadges,
      };
    });
  }, [premium]);

  const incrementStreak = useCallback(() => {
    setProgress((prev) => {
      if (!prev) return prev;

      const today = new Date().toISOString().split('T')[0];
      const lastActive = new Date(prev.lastActiveDate).toISOString().split('T')[0];
      
      if (today === lastActive) return prev; // Já contado hoje

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = prev.streak;
      
      if (lastActive === yesterdayStr) {
        // Mantém streak
        newStreak++;
      } else {
        // Quebrou streak
        newStreak = 1;
      }

      return {
        ...prev,
        streak: newStreak,
        lastActiveDate: new Date().toISOString(),
        stats: {
          ...prev.stats,
          diasConsecutivos: Math.max(prev.stats.diasConsecutivos, newStreak),
        },
      };
    });
    
    // Verificar badges após incrementar streak
    checkAndUnlockBadges();
  }, [checkAndUnlockBadges]);

  const updateStats = useCallback((stats: Partial<UserProgress['stats']>) => {
    setProgress((prev) => {
      if (!prev) return prev;
      
      return {
        ...prev,
        stats: {
          ...prev.stats,
          ...stats,
        },
      };
    });
    
    // Verificar badges após atualizar stats
    setTimeout(() => checkAndUnlockBadges(), 100);
  }, [checkAndUnlockBadges]);

  // Sempre fornecer o contexto, mesmo quando progress é null
  // Isso garante que o contexto está disponível durante a inicialização
  // As funções têm verificação interna para progress null
  const contextValue: GamificationContextType = {
    progress,
    addXP,
    checkAndUnlockBadges,
    incrementStreak,
    updateStats,
  };

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}
    </GamificationContext.Provider>
  );
}

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) throw new Error('useGamification must be used within GamificationProvider');
  return context;
};

