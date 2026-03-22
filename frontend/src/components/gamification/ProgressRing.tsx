'use client';

import React, { useEffect, useState } from 'react';
import { useGamification } from '@/context/GamificationContext';
import clsx from 'clsx';

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  showLevel?: boolean;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 120,
  strokeWidth = 8,
  showLevel = true,
  className,
}) => {
  const { progress } = useGamification();
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (!progress) return;

    const duration = 1000;
    const steps = 60;
    const targetProgress = progress.xpToNextLevel > 0 
      ? (progress.xp / progress.xpToNextLevel) * 100 
      : 0;
    
    let currentStep = 0;
    const startProgress = animatedProgress;
    const diff = targetProgress - startProgress;

    const interval = setInterval(() => {
      currentStep++;
      const eased = easeOutCubic(currentStep / steps);
      setAnimatedProgress(Math.min(startProgress + diff * eased, targetProgress));
      
      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [progress?.xp, progress?.xpToNextLevel]);

  const easeOutCubic = (t: number) => {
    return (--t) * t * t + 1;
  };

  if (!progress) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-surface-secondary"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Level indicator */}
      {showLevel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold bg-gradient-to-r from-green-500 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
            {progress.level}
          </div>
          <div className="text-xs text-text-secondary mt-1">Nível</div>
        </div>
      )}
    </div>
  );
};

