'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/types/gamification';
import { Modal } from '@/components/ui/Modal';
import { BadgeAnimated } from '@/components/ui/BadgeAnimated';
import clsx from 'clsx';

interface AchievementPopupProps {
  badge: Badge | null;
  onClose: () => void;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({ badge, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (badge) {
      setIsVisible(true);
      // Auto-fechar após 5 segundos
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [badge, onClose]);

  if (!badge) return null;

  const rarityColors = {
    common: 'from-gray-500 to-gray-600',
    rare: 'from-blue-500 to-cyan-500',
    epic: 'from-purple-500 to-pink-500',
    legendary: 'from-yellow-500 to-orange-500',
  };

  return (
    <Modal isOpen={isVisible} onClose={() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }}>
      <div className="text-center space-y-6 py-8">
        {/* Badge Icon */}
        <div className="relative inline-block">
          <div
            className={clsx(
              'text-8xl animate-elastic-bounce',
              'relative z-10'
            )}
          >
            {badge.icon}
          </div>
          
          {/* Glow effect */}
          <div
            className={clsx(
              'absolute inset-0 blur-2xl opacity-50',
              'bg-gradient-to-br',
              rarityColors[badge.rarity],
              'animate-glow-pulse'
            )}
          />
        </div>

        {/* Badge Info */}
        <div className="space-y-2">
          <BadgeAnimated
            variant="achievement"
            color={badge.rarity === 'legendary' ? 'gradient' : badge.rarity === 'epic' ? 'purple' : badge.rarity === 'rare' ? 'cyan' : 'green'}
            className="text-base"
          >
            {badge.rarity.toUpperCase()}
          </BadgeAnimated>
          
          <h2
            className={clsx(
              'text-3xl font-bold',
              'bg-gradient-to-r bg-clip-text text-transparent',
              rarityColors[badge.rarity]
            )}
          >
            {badge.name}
          </h2>
          
          <p className="text-text-secondary">
            {badge.description}
          </p>
        </div>

        {/* Message */}
        <div className="text-sm text-text-tertiary">
          Conquista desbloqueada! 🎉
        </div>
      </div>
    </Modal>
  );
};

