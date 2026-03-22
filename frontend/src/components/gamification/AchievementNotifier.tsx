'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGamification } from '@/context/GamificationContext';
import { Badge } from '@/types/gamification';
import { AchievementPopup } from './AchievementPopup';

export const AchievementNotifier: React.FC = () => {
  const { progress } = useGamification();
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const previouslyUnlockedBadgesRef = useRef<Set<string>>(new Set());
  const lastCheckRef = useRef<number>(0);
  const lastBadgesLengthRef = useRef<number>(0);

  // Detectar novos badges desbloqueados
  useEffect(() => {
    if (!progress) return;

    // Throttle: evitar verificações muito frequentes
    const now = Date.now();
    if (now - lastCheckRef.current < 500) return;
    lastCheckRef.current = now;

    // Verificar se realmente há mudança no número de badges
    const currentBadgesLength = progress.badges.length;
    if (currentBadgesLength === lastBadgesLengthRef.current) return;
    lastBadgesLengthRef.current = currentBadgesLength;

    const currentBadgeIds = new Set(progress.badges.map(b => b.id));
    
    // Encontrar badges que foram desbloqueados recentemente
    const newlyUnlocked = progress.badges.filter(
      badge => badge.unlockedAt && 
      !previouslyUnlockedBadgesRef.current.has(badge.id)
    );

    // Verificar se há badges novos com unlockedAt recente (últimos 5 segundos)
    if (newlyUnlocked.length > 0) {
      const mostRecent = newlyUnlocked
        .filter(badge => {
          if (!badge.unlockedAt) return false;
          const unlockedTime = new Date(badge.unlockedAt).getTime();
          const now = Date.now();
          return (now - unlockedTime) < 5000; // 5 segundos
        })
        .sort((a, b) => {
          const timeA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
          const timeB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
          return timeB - timeA;
        })[0];

      if (mostRecent) {
        setNewBadge(mostRecent);
        previouslyUnlockedBadgesRef.current = new Set(progress.badges.map(b => b.id));
      }
    }
    
    // Atualizar set de badges conhecidos
    previouslyUnlockedBadgesRef.current = new Set(progress.badges.map(b => b.id));
  }, [progress?.badges?.length]); // Apenas length como dependência estável

  const handleClose = () => {
    setNewBadge(null);
  };

  return <AchievementPopup badge={newBadge} onClose={handleClose} />;
};
