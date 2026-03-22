"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useGamification } from '@/context/GamificationContext';
import { Card3D } from '@/components/ui/Card3D';
import {
  Trophy,
  Sparkles,
  Lock,
  Check,
  Heart,
  TrendingUp,
  Activity,
  Layers,
  Zap,
  Clock,
  ShieldCheck,
  Cpu,
  Target,
  Medal,
  Crown,
  Boxes
} from 'lucide-react';
import { BADGES, Badge } from '@/types/gamification';
import { BadgeAnimated } from '@/components/ui/BadgeAnimated';
import { motion, AnimatePresence } from 'framer-motion';
import { useCounter } from '@/hooks/useCounter';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium AchievementsMatrix v3.5
// Design Path: Mastery High-Fidelity / Tactical Growth Hub
// ─────────────────────────────────────────────────────────────────

export default function ConquistasPage() {
  const { progress } = useGamification();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Organizar conquistas por categoria
  const conquistasPorCategoria = useMemo(() => {
    const categorias = {
      favoritos: [] as (Badge & { isUnlocked: boolean; unlockedAt?: string })[],
      streak: [] as (Badge & { isUnlocked: boolean; unlockedAt?: string })[],
      exploracao: [] as (Badge & { isUnlocked: boolean; unlockedAt?: string })[],
      nivel: [] as (Badge & { isUnlocked: boolean; unlockedAt?: string })[],
      especiais: [] as (Badge & { isUnlocked: boolean; unlockedAt?: string })[],
    };

    Object.values(BADGES).forEach((badge) => {
      const unlockedBadge = progress?.badges.find(b => b.id === badge.id);
      const isUnlocked = !!unlockedBadge;
      const badgeWithStatus = { ...badge, isUnlocked, unlockedAt: unlockedBadge?.unlockedAt };

      if (badge.id.includes('favorito') || badge.id.includes('colecionador') || badge.id.includes('visionario') || badge.id.includes('mestre_escalador')) {
        categorias.favoritos.push(badgeWithStatus);
      } else if (badge.id.includes('streak')) {
        categorias.streak.push(badgeWithStatus);
      } else if (badge.id.includes('explorador') || badge.id.includes('navegador') || badge.id.includes('observador') || badge.id.includes('analista') || badge.id.includes('cazador')) {
        categorias.exploracao.push(badgeWithStatus);
      } else if (badge.id.includes('iniciante') || badge.id.includes('avancado') || badge.id.includes('expert') || badge.id.includes('mestre')) {
        categorias.nivel.push(badgeWithStatus);
      } else {
        categorias.especiais.push(badgeWithStatus);
      }
    });

    return categorias;
  }, [progress?.badges]);

  const totalConquistas = Object.values(BADGES).length;
  const conquistasDesbloqueadas = progress?.badges.length || 0;
  const porcentagem = Math.round((conquistasDesbloqueadas / totalConquistas) * 100);
  const lendariasCount = progress?.badges.filter(b => b.rarity === 'legendary').length || 0;

  const totalNum = useCounter(conquistasDesbloqueadas, { duration: 1500 });
  const progressNum = useCounter(porcentagem, { duration: 1500 });
  const legendaryNum = useCounter(lendariasCount, { duration: 1500 });

  const getRarityConfig = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common': return { color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20', label: 'C_LEVEL_ASSET' };
      case 'rare': return { color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', label: 'B_LEVEL_RARE' };
      case 'epic': return { color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'A_LEVEL_EPIC' };
      case 'legendary': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'S_LEVEL_LEGENDARY' };
      default: return { color: 'text-white/20', bg: 'bg-white/5', border: 'border-white/10', label: 'D_LEVEL_UNKN' };
    }
  };

  return (
    <div className="min-h-screen bg-black relative pb-32">

      {/* Editorial Header Hub */}
      <div className="relative pt-16 pb-12 px-8 lg:px-16 max-w-[1800px] mx-auto border-b border-white/5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Node_Intelligence // ACHIEVEMENTS</span>
                <span className="text-[10px] text-white/10 italic">Validation_Link_Active</span>
              </div>
            </div>

            <h1 className="text-7xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
              CONQUISTAS <br />
              <span className="text-green-500">MESTRES</span>
            </h1>

            <div className="flex items-center gap-6">
              <div className="bg-white/5 px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
                <Medal size={12} className="text-yellow-500" />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Protocolo de Honra Escalonada</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-white/20" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">
                  Última Atividade: {mounted ? new Date().toLocaleTimeString() : '--:--:--'}
                </span>
              </div>
            </div>
          </div>

          {/* Industrial HUD Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Unidades_Desbloqueadas</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white italic">{totalNum.count.toString().padStart(2, '0')}</span>
                <span className="text-[10px] font-black text-white/10 uppercase italic">/ {totalConquistas}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Dominância_Rede</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-green-500 italic">{progressNum.count.toString().padStart(2, '0')}%</span>
                <span className="text-[10px] font-black text-white/10 uppercase italic">Power</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Rank_Lendário</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-yellow-500 italic">{legendaryNum.count.toString().padStart(2, '0')}</span>
                <span className="text-[10px] font-black text-white/10 uppercase italic">S-Rank</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Matrix Hub */}
      <div className="max-w-[1800px] mx-auto px-8 lg:px-16 pt-16 space-y-24">

        {/* Render Category Group */}
        {[
          { id: 'favoritos', title: 'MATRIZ DE COLEÇÃO', icon: Heart, color: 'text-pink-500' },
          { id: 'streak', title: 'SEQUÊNCIA OPERACIONAL', icon: Zap, color: 'text-yellow-500' },
          { id: 'exploracao', title: 'VARREDURA E EXPLORAÇÃO', icon: Target, color: 'text-cyan-500' },
          { id: 'nivel', title: 'ESCALA DE AUTORIDADE', icon: TrendingUp, color: 'text-green-500' },
          { id: 'especiais', title: 'NÓS CRÍTICOS ESPECIAIS', icon: Crown, color: 'text-purple-500' },
        ].map((cat) => {
          const items = conquistasPorCategoria[cat.id as keyof typeof conquistasPorCategoria];
          if (!items || items.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-12">
              <div className="flex items-center gap-6">
                <div className={clsx("w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center", cat.color)}>
                  <cat.icon size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">{cat.id.toUpperCase()}_MODULUS</span>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">{cat.title}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {items.map((badge, idx) => (
                  <AchievementCard
                    key={badge.id}
                    badge={badge}
                    config={getRarityConfig(badge.rarity)}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          );
        })}

      </div>

    </div>
  );
}

interface AchievementCardProps {
  badge: Badge & { isUnlocked: boolean; unlockedAt?: string };
  config: { color: string; bg: string; border: string; label: string };
  index: number;
}

function AchievementCard({ badge, config, index }: AchievementCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card3D
        variant={badge.isUnlocked ? 'glass' : 'default'}
        has3DRotation
        className={clsx(
          "group relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-700 h-full overflow-hidden",
          badge.isUnlocked
            ? "bg-[#0d0d0d] border-white/10 hover:border-green-500/30"
            : "bg-white/[0.01] border-white/5 opacity-40 grayscale"
        )}
      >
        {/* Technical HUD Overlay (Unlocked) */}
        {badge.isUnlocked && (
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <Trophy size={140} className="-rotate-12" />
          </div>
        )}

        {/* Badge Core Viewport */}
        <div className="relative flex justify-between items-start mb-8">
          <div className={clsx(
            "w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl transition-all duration-700",
            badge.isUnlocked
              ? "bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 group-hover:scale-110 group-hover:rotate-6 group-hover:border-green-500/50"
              : "bg-white/5 border border-white/5"
          )}>
            {badge.icon}
          </div>

          <div className={clsx(
            "px-3 py-1 rounded-xl border text-[8px] font-black uppercase tracking-widest",
            badge.isUnlocked ? `${config.bg} ${config.border} ${config.color}` : "bg-white/5 border-white/5 text-white/20"
          )}>
            {config.label}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <span className={clsx(
              "text-[8px] font-black uppercase tracking-[0.3em]",
              badge.isUnlocked ? "text-green-500/50" : "text-white/10"
            )}>
              Unit_Validation // {badge.rarity.toUpperCase()}
            </span>
            <h3 className={clsx(
              "text-2xl font-black italic uppercase tracking-tighter leading-[0.9]",
              badge.isUnlocked ? "text-white group-hover:text-green-500" : "text-white/20",
              "transition-colors duration-500"
            )}>
              {badge.name}
            </h3>
          </div>

          <p className={clsx(
            "text-xs font-bold leading-relaxed uppercase tracking-tight italic",
            badge.isUnlocked ? "text-white/30" : "text-white/10"
          )}>
            {badge.description}
          </p>
        </div>

        {/* Action / Status Footer */}
        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
          {badge.isUnlocked ? (
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">Time_Sync_Log</span>
              <span className="text-[10px] font-black text-green-500/60 uppercase italic">
                {new Date(badge.unlockedAt!).toLocaleDateString('pt-BR')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/10">
              <Lock size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Criptografado</span>
            </div>
          )}

          <div className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500",
            badge.isUnlocked ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-white/5 border-white/5 text-white/10"
          )}>
            {badge.isUnlocked ? <Check size={16} strokeWidth={3} /> : <Activity size={16} />}
          </div>
        </div>
      </Card3D>
    </motion.div>
  );
}
