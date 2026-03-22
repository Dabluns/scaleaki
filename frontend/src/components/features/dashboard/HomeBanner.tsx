'use client';

import React from 'react';
import { Card3D } from '@/components/ui/Card3D';
import { Sparkles, Zap, TrendingUp, ShieldCheck } from 'lucide-react';

export const HomeBanner: React.FC = () => {
  return (
    <div className="relative w-full mb-10">
      <Card3D
        variant="glass"
        glow={true}
        has3DRotation={true}
        hasParallax={true}
        animatedBorder={true}
        className="group relative overflow-hidden rounded-[2.5rem] border border-white/10"
      >
        {/* ─── BACKGROUND LAYERS (MESH + GRID) ─── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {/* Animated Mesh Gradients — Estilo Premium Pro */}
          <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-emerald-500/20 rounded-full blur-[140px] animate-pulse pointer-events-none" style={{ animationDuration: '10s' }} />
          <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] bg-cyan-500/15 rounded-full blur-[140px] animate-pulse pointer-events-none" style={{ animationDuration: '15s', animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] opacity-50" />

          {/* Neural Dot Grid with Radial Mask */}
          <div
            className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:24px_24px]"
            style={{ maskImage: 'radial-gradient(circle at center, black, transparent 80%)' }}
          />

          {/* Dynamic Technical Scanline */}
          <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(transparent_0%,#22c55e_50%,transparent_100%)] bg-[size:100%_10px] bg-repeat-y animate-scanline" />
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <div className="relative z-10 p-8 md:p-14 lg:p-20 flex flex-col items-center text-center">

          {/* Status Badge Superior */}
          <div className="mb-10 animate-fade-in-up flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] backdrop-blur-xl shadow-2xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Nova Geração de Escala Ativa
          </div>

          {/* Headline Cinematográfica e Impactante */}
          <h1
            className="text-4xl md:text-7xl lg:text-8xl font-black mb-8 text-white tracking-tighter leading-none select-none"
            style={{
              textShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)',
            }}
          >
            INTELIGÊNCIA<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-cyan-400 animate-glow">
              EM ESCALA
            </span>
          </h1>

          {/* Subtext Refinado */}
          <p className="max-w-3xl text-base md:text-xl text-white/40 font-medium leading-relaxed mb-16 animate-fade-in animation-delay-500">
            O Skaleaki utiliza tecnologia proprietária para filtrar e processar as ofertas que estão
            <span className="text-white/80 font-bold"> dominando o Facebook Ads em tempo real.</span>
            A mineração de dados nunca foi tão visual e eficiente.
          </p>

          {/* Bento Visual Stats (Simulados p/ Premium Feel) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12 w-full max-w-5xl items-center justify-center animate-fade-in animation-delay-1000 opacity-80">
            <div className="flex flex-col items-center gap-4 group/item">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shadow-inner group-hover/item:scale-110 transition-transform duration-500">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="text-[10px] md:text-xs font-black text-white/50 uppercase tracking-widest whitespace-nowrap">Métricas de Performance</div>
            </div>

            <div className="flex flex-col items-center gap-4 group/item">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shadow-inner group-hover/item:scale-110 transition-transform duration-500">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="text-[10px] md:text-xs font-black text-white/50 uppercase tracking-widest whitespace-nowrap">Curadoria Humana</div>
            </div>

            <div className="flex flex-col items-center gap-4 group/item">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shadow-inner group-hover/item:scale-110 transition-transform duration-500">
                <Zap className="w-7 h-7" />
              </div>
              <div className="text-[10px] md:text-xs font-black text-white/50 uppercase tracking-widest whitespace-nowrap">Sincronização Ativa</div>
            </div>

            <div className="flex flex-col items-center gap-4 group/item">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shadow-inner group-hover/item:scale-110 transition-transform duration-500">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="text-[10px] md:text-xs font-black text-white/50 uppercase tracking-widest whitespace-nowrap">IA Generativa</div>
            </div>
          </div>
        </div>

        {/* ─── DECORATIVE EDGES ─── */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

        {/* Subtle Side Glows */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full" />
      </Card3D>
    </div>
  );
};
