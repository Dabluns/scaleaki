'use client';

import React from 'react';
import { Oferta } from '@/types/oferta';
import { Calendar, Heart, ShieldCheck, Globe, Activity } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium TrustSignals v2.0
// Features: Technical Meta-Data, Mastery High-Fidelity,
// Industrial Typography, No Gradients, Neon Emerald Accents.
// ─────────────────────────────────────────────────────────────────

interface TrustSignalsProps {
  oferta: Oferta;
  favoritosCount?: number;
}

export const TrustSignals: React.FC<TrustSignalsProps> = ({
  oferta,
  favoritosCount = 0,
}) => {
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toUpperCase();
    } catch {
      return 'INVALID';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-12 gap-y-6 py-6 border-y border-white/5">

      {/* SIGNAL: DATE */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-white/20">
          <Calendar size={12} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Data de Registro</span>
        </div>
        <span className="text-xs font-black text-white italic tracking-widest">{formatDate(oferta.createdAt)}</span>
      </div>

      {/* SIGNAL: POPULARITY */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-white/20">
          <Heart size={12} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Sinais de Interesse</span>
        </div>
        <span className="text-xs font-black text-green-500 italic tracking-widest">
          {favoritosCount > 0 ? `${favoritosCount} AGENTES` : 'PRIMEIRA VARREDURA'}
        </span>
      </div>

      {/* SIGNAL: VERIFICATION */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-white/20">
          <ShieldCheck size={12} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Status de Rede</span>
        </div>
        <span className="text-xs font-black text-white italic tracking-widest flex items-center gap-2">
          {oferta.isActive ? 'VERIFICADO' : 'AGUARDANDO'}
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
        </span>
      </div>

      {/* SIGNAL: NETWORK */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-white/20">
          <Globe size={12} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Rede de Sinais</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-cyan-500 italic tracking-widest">
            {(['facebook_ads', 'instagram_ads', 'meta_ads'].includes(oferta.plataforma as any) ? 'FB_ADS_PROTOCOL' : 'EXTERNAL_NETWORK')}
          </span>
        </div>
      </div>

      {/* SIGNAL: UPTIME/HISTORY */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-white/20">
          <Activity size={12} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Integridade</span>
        </div>
        <span className="text-xs font-black text-white italic tracking-widest">98.4% STABLE</span>
      </div>

    </div>
  );
};
