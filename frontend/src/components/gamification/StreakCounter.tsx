'use client';

import React, { useEffect, useState } from 'react';
import { useGamification } from '@/context/GamificationContext';
import { Flame } from 'lucide-react';
import clsx from 'clsx';

export const StreakCounter: React.FC = () => {
  const { progress } = useGamification();
  const [isFlaming, setIsFlaming] = useState(false);

  useEffect(() => {
    if (!progress || progress.streak === 0) return;

    // Animar fogo periodicamente
    const interval = setInterval(() => {
      setIsFlaming(true);
      setTimeout(() => setIsFlaming(false), 500);
    }, 3000);

    return () => clearInterval(interval);
  }, [progress]);

  if (!progress || progress.streak === 0) return null;

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full',
        'bg-gradient-to-r from-orange-500/20 to-yellow-500/20',
        'border border-orange-500/30',
        'transition-all duration-300',
        {
          'animate-glow-pulse shadow-[0_0_20px_rgba(249,115,22,0.5)]': isFlaming,
        }
      )}
    >
      <Flame
        className={clsx('text-orange-500 transition-transform duration-300', {
          'animate-float scale-110': isFlaming,
        })}
        size={24}
      />
      <div>
        <div className="text-2xl font-bold text-orange-500">{progress.streak}</div>
        <div className="text-xs text-orange-500/80">dias seguidos</div>
      </div>
    </div>
  );
};

