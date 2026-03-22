"use client";

import React, { useState, useEffect } from 'react';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { TrendingUp, Trophy, Zap, Target, Heart, Activity } from 'lucide-react';
import { useGamification } from '@/context/GamificationContext';
import { useAuth } from '@/context/AuthContext';
import { ProgressRing } from '@/components/gamification/ProgressRing';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium MetricasUsuario v5.0
// Focus: Compact "Fit-to-Screen" layout, Refined Edge Lighting, 
// Elastic Expansion, and Pure Cyberpunk Tones.
// ─────────────────────────────────────────────────────────────────

interface ActivityStats {
  totalFavoritos: number;
  nichosExplorados: number;
  tendencia: 'up' | 'down';
  percentualCrescimento: number;
}

export function MetricasUsuario() {
  const { progress } = useGamification();
  const { user } = useAuth();
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivityStats = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const res = await fetch('/api/profile/activity-stats', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setActivityStats(data.data);
        }
      } catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    };
    fetchActivityStats();
  }, [user?.id]);

  const data = [
    {
      id: 'level',
      icon: <Trophy size={18} />,
      label: 'Ranking',
      value: progress?.level || 1,
      sub: `Nv. ${progress?.level || 1}. Rumo ao próximo nível.`,
      color: '#fbbf24',
      accent: 'text-yellow-400',
      ring: true
    },
    {
      id: 'fav',
      icon: <Heart size={18} />,
      label: 'Favoritos',
      value: activityStats?.totalFavoritos || progress?.stats.totalFavoritos || 0,
      sub: 'Suas ofertas vencedoras salvas.',
      color: '#ec4899',
      accent: 'text-pink-400'
    },
    {
      id: 'market',
      icon: <Target size={18} />,
      label: 'Mercados',
      value: activityStats?.nichosExplorados || progress?.stats.nichosExplorados || 0,
      sub: 'Nichos analisados esta semana.',
      color: '#22c55e',
      accent: 'text-green-500'
    },
    {
      id: 'xp',
      icon: <Zap size={18} />,
      label: 'Engajamento',
      value: progress?.xp || 0,
      sub: 'XP acumulado no ecossistema.',
      color: '#22d3ee',
      accent: 'text-cyan-400'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-40" />)}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header section - More Compact */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-green-500">Inteligência Operacional</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
            O SEU <span className="text-green-500 shadow-green-500/20 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">RADAR</span>
          </h2>
        </div>

        {activityStats && activityStats.percentualCrescimento > 0 && (
          <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
            <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="text-lg font-black text-white">+{activityStats.percentualCrescimento}%</div>
              <div className="text-[8px] font-black uppercase text-white/30 tracking-widest">Growth</div>
            </div>
          </div>
        )}
      </div>

      {/* Elastic Interaction Grid - Expandable Cards */}
      <div className="flex gap-3 mb-8">
        {data.map((item) => (
          <StatCard key={item.id} {...item} />
        ))}
      </div>

      {/* Operational Box - Refined & Compact */}
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all duration-500">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 text-xl shadow-[0_0_20px_rgba(34,197,94,0.1)] group-hover:scale-110 transition-transform">
            💡
          </div>
          <h3 className="text-base font-black text-white uppercase tracking-tighter italic">Insight Direto</h3>
        </div>
        <p className="text-white/40 text-[11px] font-bold leading-relaxed mb-4">
          No próximo nível você desbloqueia o <span className="text-green-500">Módulo de IA Profunda</span> para prever nichos.
        </p>
        <button className="whitespace-nowrap w-full px-5 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-xl">
          Expandir Análise
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, accent, ring }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        flex: isHovered ? 2.5 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`
        relative rounded-2xl overflow-hidden min-w-0 cursor-pointer
        bg-[#0d0d0d] border transition-colors duration-500
        ${isHovered ? 'border-white/20' : 'border-white/5'}
      `}
      style={{
        boxShadow: isHovered ? `0 0 50px ${color}15, 0 0 100px ${color}08` : 'none',
        borderColor: isHovered ? `${color}50` : undefined
      }}
    >
      {/* Ambient Glow */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none z-0"
          >
            <div className="absolute -top-20 -right-20 w-48 h-48 blur-[80px] rounded-full opacity-20"
              style={{ backgroundColor: color }} />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 blur-[60px] rounded-full opacity-10"
              style={{ backgroundColor: color }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Content */}
      <div className="relative z-10 p-5 h-full flex flex-col justify-between" style={{ minHeight: isHovered ? '280px' : '200px' }}>

        {/* Top: Icon + Badge */}
        <div className="flex items-center justify-between mb-auto">
          <motion.div
            animate={{ scale: isHovered ? 1.15 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-xl border border-white/5"
            style={{ backgroundColor: `${color}15`, color: color, boxShadow: isHovered ? `0 0 25px ${color}30` : `0 0 10px ${color}10` }}
          >
            {icon}
          </motion.div>

          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                <span className="text-[8px] font-black uppercase tracking-wider" style={{ color }}>Sinal Ativo</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Middle: Label + Value */}
        <div className="relative z-10 mt-4">
          {/* Label - full when hovered, truncated when not */}
          <div className={`text-[10px] font-black text-white/25 uppercase mb-2 transition-all duration-300 ${isHovered ? 'tracking-[0.15em]' : 'tracking-[0.1em] whitespace-nowrap overflow-hidden text-ellipsis'}`}>
            {label}
          </div>

          <div className="flex items-end gap-3">
            <div
              className={`font-black tracking-tighter ${accent} transition-all duration-500 ${isHovered ? 'text-5xl' : 'text-3xl'}`}
              style={{ textShadow: isHovered ? `0 0 20px ${color}50` : 'none' }}
            >
              {value.toLocaleString('pt-BR')}
            </div>

            <AnimatePresence>
              {isHovered && ring && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex-shrink-0 mb-1"
                >
                  <ProgressRing size={50} strokeWidth={4} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom: Expanded Info (only on hover) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.05, duration: 0.3 }}
              className="relative z-10 mt-5 pt-4 border-t"
              style={{ borderColor: `${color}20` }}
            >
              <p className="text-[11px] text-white/50 font-bold leading-relaxed">
                {sub}
              </p>

              {/* Mini stat bar */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                  />
                </div>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-wider">65%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Glow Bar */}
        <div className="absolute bottom-3 left-5 right-5 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            animate={{ width: isHovered ? '100%' : '15%' }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

