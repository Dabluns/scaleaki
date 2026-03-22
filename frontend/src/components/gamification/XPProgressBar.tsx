'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGamification } from '@/context/GamificationContext';
import { XP_TABLE } from '@/types/gamification';
import clsx from 'clsx';

export const XPProgressBar: React.FC = () => {
  const { progress } = useGamification();
  const [animatedXP, setAnimatedXP] = useState(0);
  const previousProgressRef = useRef<{ xp: number; xpToNextLevel: number; level: number; currentLevelXP: number } | null>(null);
  const currentAnimatedRef = useRef(0);

  useEffect(() => {
    if (!progress) return;
    
    // Calcular XP do nível atual (XP total - XP necessário para o nível anterior)
    const xpForPreviousLevel = XP_TABLE[progress.level - 1] || 0;
    const currentLevelXP = Math.max(0, progress.xp - xpForPreviousLevel);
    
    // Calcular XP necessário para o próximo nível (diferença entre o próximo nível e o atual)
    const xpForCurrentLevel = XP_TABLE[progress.level] || XP_TABLE[XP_TABLE.length - 1];
    const xpNeededForNextLevel = xpForCurrentLevel - xpForPreviousLevel;
    
    // Calcular o percentual de progresso atual
    const currentProgress = xpNeededForNextLevel > 0 
      ? Math.min(currentLevelXP / xpNeededForNextLevel, 1)
      : 1;
    
    // Se é a primeira vez ou mudou o level, resetar
    if (!previousProgressRef.current || previousProgressRef.current.level !== progress.level) {
      previousProgressRef.current = {
        xp: progress.xp,
        xpToNextLevel: xpNeededForNextLevel,
        level: progress.level,
        currentLevelXP: currentLevelXP,
      };
      currentAnimatedRef.current = currentProgress;
      setAnimatedXP(currentProgress);
      return;
    }
    
    // Se só o XP mudou (dentro do mesmo nível), animar do valor anterior
    const previousProgress = previousProgressRef.current.xpToNextLevel > 0
      ? Math.min(previousProgressRef.current.currentLevelXP / previousProgressRef.current.xpToNextLevel, 1)
      : 1;
    
    // Se não houve mudança real, não animar
    if (Math.abs(previousProgress - currentProgress) < 0.001) {
      return;
    }
    
    // Atualizar referência
    previousProgressRef.current = {
      xp: progress.xp,
      xpToNextLevel: xpNeededForNextLevel,
      level: progress.level,
      currentLevelXP: currentLevelXP,
    };
    
    // Animar do valor atual animado para o novo valor
    const duration = 800;
    const startValue = currentAnimatedRef.current;
    const targetValue = currentProgress;
    const difference = targetValue - startValue;
    
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progressRatio, 3);
      
      const newValue = startValue + (difference * eased);
      const clampedValue = Math.max(0, Math.min(newValue, 1));
      currentAnimatedRef.current = clampedValue;
      setAnimatedXP(clampedValue);
      
      if (progressRatio >= 1) {
        currentAnimatedRef.current = targetValue;
        setAnimatedXP(targetValue);
        clearInterval(interval);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [progress?.xp, progress?.level]);

  if (!progress) return null;

  // Recalcular valores para exibição
  const xpForPreviousLevel = XP_TABLE[progress.level - 1] || 0;
  const currentLevelXP = Math.max(0, progress.xp - xpForPreviousLevel);
  const xpForCurrentLevel = XP_TABLE[progress.level] || XP_TABLE[XP_TABLE.length - 1];
  const xpNeededForNextLevel = xpForCurrentLevel - xpForPreviousLevel;

  const percentage = Math.min((animatedXP * 100), 100).toFixed(0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">
          Nível {progress.level}
        </span>
        <span className="font-semibold text-text-primary">
          {currentLevelXP} / {xpNeededForNextLevel} XP
        </span>
      </div>
      
      <div className="relative h-3 bg-surface-secondary rounded-full overflow-hidden border border-border">
        {/* Background verde neon forte */}
        <div
          className={clsx(
            'absolute inset-0 transition-transform duration-300 ease-out origin-left',
            'shadow-[0_0_10px_rgba(57,255,20,0.8),0_0_20px_rgba(57,255,20,0.6)]'
          )}
          style={{
            backgroundColor: '#39ff14',
            transform: `scaleX(${animatedXP})`,
            transformOrigin: 'left',
          }}
        />
        
        {/* Shine effect */}
        <div className="absolute inset-0 shimmer" />
      </div>
      
      <div className="text-xs text-text-tertiary text-right">
        {percentage}% para o próximo nível
      </div>
    </div>
  );
};

