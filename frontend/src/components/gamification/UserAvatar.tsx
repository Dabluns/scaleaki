'use client';

import React, { useState, useEffect } from 'react';
import { useGamification } from '@/context/GamificationContext';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLevel?: boolean;
  animated?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  size = 'md',
  showLevel = true,
  animated = true,
  className,
}) => {
  const { progress } = useGamification();
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Buscar avatar do perfil
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) return;
      
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${API_URL}/profile`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.profile?.avatar && data.data.profile.avatarType === 'upload') {
            setAvatarUrl(data.data.profile.avatar);
          }
        }
      } catch (error) {
        // Silenciar erro
      }
    };

    fetchAvatar();

    // Ouvir eventos de atualização de avatar
    const handleAvatarUpdate = (e: CustomEvent) => {
      if (e.detail?.avatarUrl) {
        setAvatarUrl(e.detail.avatarUrl);
      } else {
        setAvatarUrl(null);
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    };
  }, [user?.id]);

  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl',
    xl: 'w-32 h-32 text-6xl',
  };

  const levelBadgeSize = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
    xl: 'w-10 h-10 text-base',
  };

  // Avatar baseado no nível
  const getAvatarEmoji = (level: number) => {
    if (level >= 10) return '🚀'; // Mestre
    if (level >= 7) return '⭐'; // Expert
    if (level >= 5) return '💎'; // Avançado
    if (level >= 3) return '🔥'; // Intermediário
    return '🌱'; // Iniciante
  };

  // Cores do gradiente baseado no nível
  const getGradientClass = (level: number) => {
    if (level >= 10) return 'from-yellow-500 to-orange-500'; // Mestre
    if (level >= 7) return 'from-purple-500 to-pink-500'; // Expert
    if (level >= 5) return 'from-cyan-500 to-blue-500'; // Avançado
    if (level >= 3) return 'from-green-500 to-emerald-500'; // Intermediário
    return 'from-green-400 to-green-500'; // Iniciante
  };

  if (!progress) {
    return (
      <div
        className={clsx(
          'relative rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-gray-400 to-gray-500',
          'shadow-lg',
          sizeClasses[size],
          {
            'animate-float': animated,
          },
          className
        )}
      >
        <span className="relative z-10">👤</span>
      </div>
    );
  }

  return (
    <div className={clsx('relative inline-block', className)}>
      {/* Avatar */}
      <div
        className={clsx(
          'relative rounded-full flex items-center justify-center overflow-hidden',
          !avatarUrl && `bg-gradient-to-br ${getGradientClass(progress.level)}`,
          'shadow-lg',
          sizeClasses[size],
          {
            'animate-float': animated,
            'hover:scale-110 transition-transform duration-300': animated,
          }
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Foto de perfil"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="relative z-10">
            {getAvatarEmoji(progress.level)}
          </span>
        )}
        
        {/* Glow effect */}
        {!avatarUrl && (
          <div
            className={clsx(
              'absolute inset-0 rounded-full blur-xl opacity-50 animate-glow-pulse',
              `bg-gradient-to-br ${getGradientClass(progress.level)}`
            )}
          />
        )}
      </div>

      {/* Level Badge */}
      {showLevel && (
        <div
          className={clsx(
            'absolute -bottom-1 -right-1',
            'rounded-full flex items-center justify-center',
            'bg-gradient-to-r from-purple-500 to-pink-500',
            'text-white font-bold',
            'border-2 border-surface',
            'shadow-lg',
            'animate-elastic-bounce',
            levelBadgeSize[size]
          )}
        >
          {progress.level}
        </div>
      )}
    </div>
  );
};

