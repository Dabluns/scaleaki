"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { UserAvatar } from '@/components/gamification/UserAvatar';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { getMessageByContext, MotivationalMessage } from '@/lib/motivationalMessages';
import { Card3D } from '@/components/ui/Card3D';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium DashboardHero v3.1 (Hotfix)
// Fixes: Responsive scaling for large headers and container safety.
// ─────────────────────────────────────────────────────────────────

export const DashboardHero: React.FC = () => {
  const { user } = useAuth();
  const { progress } = useGamification();
  const [motivationalMessage, setMotivationalMessage] = useState<MotivationalMessage | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    const timeContext = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    setMotivationalMessage(getMessageByContext(timeContext));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'BOM DIA';
    if (hour < 18) return 'BOA TARDE';
    return 'BOA NOITE';
  };

  return (
    <div className="relative w-full overflow-hidden lg:overflow-visible">
      <div className="flex flex-col xl:flex-row items-stretch gap-6 mb-12">

        {/* Profile Info Section (Glass Card) */}
        <Card3D
          variant="glass"
          has3DRotation
          className="flex-1 p-6 md:p-8 bg-white/[0.02] border-white/5 flex flex-col md:flex-row items-center gap-6 md:gap-8 group min-w-0"
        >
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-green-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <UserAvatar size="lg" showLevel animated />
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 whitespace-nowrap">Agente Ativo</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter mb-2 uppercase break-words">
              {getGreeting()}, <span className="text-green-500">{user?.name?.split(' ')[0] || 'EXPLORADOR'}</span>
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-white/30 tracking-widest uppercase mb-4 truncate">
              Comandante de Escala <span className="text-white/60">Nv. {progress?.level || 1}</span>
            </p>
            {motivationalMessage && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] md:text-xs font-bold text-white/50 max-w-full">
                <span className="flex-shrink-0">{motivationalMessage.emoji}</span>
                <span className="truncate">{motivationalMessage.text}</span>
              </div>
            )}
          </div>
        </Card3D>

        {/* Tactical Status Section (Streak & XP) */}
        <Card3D
          variant="glass"
          animatedBorder
          className="xl:w-[400px] p-6 md:p-8 bg-white/[0.02] border-white/5 flex flex-col justify-between gap-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Operacional</span>
            <StreakCounter />
          </div>

          <div className="w-full">
            <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] font-black text-white/50 uppercase tracking-wider">Progressão</span>
              <span className="text-[10px] font-bold text-green-500">{progress?.xp || 0} / {(progress?.level || 1) * 1000} XP</span>
            </div>
            <XPProgressBar />
          </div>
        </Card3D>

      </div>
    </div>
  );
};
