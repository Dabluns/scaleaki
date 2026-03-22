'use client';

import React from 'react';
import { useGamification } from '@/context/GamificationContext';
import { Badge } from '@/types/gamification';
import { Card3D } from '@/components/ui/Card3D';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium BadgeCollection v2.0
// Pegada: Gamified Achievements, High-Fidelity Glass, Neon Status.
// ─────────────────────────────────────────────────────────────────

interface BadgeCollectionProps {
  compact?: boolean;
  maxDisplay?: number;
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  compact = false,
  maxDisplay,
}) => {
  const { progress } = useGamification();

  if (!progress || progress.badges.length === 0) {
    return (
      <div className="text-center py-10 px-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 grayscale opacity-40">
          <span className="text-3xl">🎯</span>
        </div>
        <h4 className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">Radar Silencioso</h4>
        <p className="text-[11px] text-white/20 font-bold max-w-[200px] mx-auto leading-relaxed">
          Nenhuma conquista detectada no seu perfil até o momento.
        </p>
      </div>
    );
  }

  const badgesToDisplay = maxDisplay ? progress.badges.slice(0, maxDisplay) : progress.badges;
  const remainingCount = maxDisplay && progress.badges.length > maxDisplay
    ? progress.badges.length - maxDisplay
    : 0;

  const getRarityConfig = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common':
        return {
          glow: 'rgba(255, 255, 255, 0.1)',
          text: 'text-white/40',
          accent: 'bg-white/10 border-white/10',
          badgeText: 'COMMON'
        };
      case 'rare':
        return {
          glow: 'rgba(59, 130, 246, 0.3)',
          text: 'text-blue-400',
          accent: 'bg-blue-500/10 border-blue-500/20',
          badgeText: 'RARE'
        };
      case 'epic':
        return {
          glow: 'rgba(168, 85, 247, 0.3)',
          text: 'text-purple-400',
          accent: 'bg-purple-500/10 border-purple-500/20',
          badgeText: 'EPIC'
        };
      case 'legendary':
        return {
          glow: 'rgba(251, 191, 36, 0.4)',
          text: 'text-yellow-400',
          accent: 'bg-yellow-500/10 border-yellow-500/20',
          badgeText: 'LEGENDARY'
        };
      default:
        return {
          glow: 'rgba(255, 255, 255, 0.1)',
          text: 'text-white/40',
          accent: 'bg-white/10 border-white/10',
          badgeText: 'COMMON'
        };
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {badgesToDisplay.map((badge) => {
          const config = getRarityConfig(badge.rarity);
          return (
            <motion.div
              layout
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md',
                config.accent
              )}
            >
              <span className="text-base">{badge.icon}</span>
              <span className={clsx('text-[10px] font-black uppercase tracking-widest', config.text)}>
                {badge.name}
              </span>
            </motion.div>
          );
        })}
        {remainingCount > 0 && (
          <div className="flex items-center px-3 py-1.5 rounded-xl border border-white/5 bg-white/5">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
              +{remainingCount} CONQUISTAS
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence>
        {badgesToDisplay.map((badge, idx) => {
          const config = getRarityConfig(badge.rarity);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card3D
                variant="glass"
                has3DRotation
                className="group relative p-5 bg-white/[0.02] border-white/5 rounded-2xl transition-all hover:bg-white/[0.04]"
                style={{
                  boxShadow: `inset 0 0 20px ${config.glow.replace('0.3', '0.05')}`
                }}
              >
                <div className="flex items-center gap-5">
                  {/* Badge Icon (High-Fidelity Container) */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 blur-xl opacity-20 rounded-full" style={{ backgroundColor: config.glow }} />
                    <div className={clsx(
                      "relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-2xl border border-white/10",
                      badge.rarity === 'legendary' ? 'bg-yellow-500/10' : 'bg-white/5'
                    )}>
                      {badge.icon}
                    </div>
                  </div>

                  {/* Badge Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-black text-white uppercase tracking-tighter truncate">
                        {badge.name}
                      </h4>
                      <span className={clsx(
                        "text-[8px] font-black px-2 py-0.5 rounded-md border tracking-[0.2em]",
                        config.accent,
                        config.text
                      )}>
                        {config.badgeText}
                      </span>
                    </div>

                    <p className="text-[11px] text-white/40 font-bold mb-3 line-clamp-1">
                      {badge.description}
                    </p>

                    {badge.unlockedAt && (
                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-green-500/60">
                        <span className="w-1 h-1 bg-green-500 rounded-full" />
                        Desbloqueado em {new Date(badge.unlockedAt).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              </Card3D>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {remainingCount > 0 && (
        <div className="py-4 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
            +{remainingCount} Conquistas Ocultas
          </span>
        </div>
      )}
    </div>
  );
};
