'use client';

import React from 'react';
import { BadgeAnimated } from '@/components/ui/BadgeAnimated';
import { ImageParallax } from '@/components/ui/ImageParallax';
import { Oferta } from '@/types/oferta';
import { Nicho } from '@/types/nicho';
import { motion } from 'framer-motion';
import { formatBadge } from '@/lib/formatters';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium OfferHero v2.0
// Features: Mastery High-Fidelity, Cinematic Depth, 
// Editorial Typography, Emerald Green & Cyan Red accents.
// ─────────────────────────────────────────────────────────────────

interface OfferHeroProps {
  oferta: Oferta;
  nicho?: Nicho;
}

export const OfferHero: React.FC<OfferHeroProps> = ({ oferta, nicho }) => {
  return (
    <div className="relative group">
      {/* Cinematic Depth Container */}
      <div className="relative h-64 md:h-80 lg:h-[450px] overflow-hidden rounded-[3rem] border border-white/10 shadow-2xl transition-all duration-700 group-hover:border-green-500/30">

        {/* Parallax Media Core */}
        {oferta.imagem ? (
          <div className="relative h-full w-full">
            <ImageParallax
              src={oferta.imagem}
              alt={oferta.titulo}
              className="w-full h-full object-cover scale-110"
              intensity={0.4}
            />
            {/* Atmospheric Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/20 to-transparent opacity-80" />
            <div className="absolute inset-0 bg-[#0a0a0a]/10 group-hover:bg-transparent transition-colors duration-700" />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d0d]">
            <div className="text-8xl mb-6 opacity-20 filter grayscale">MONEY</div>
            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">No Visual Assets Detected</div>
          </div>
        )}

        {/* Global Tactical Badges */}
        <div className="absolute top-8 left-8 flex flex-wrap gap-3 z-20">
          <div className="px-3 py-1.5 bg-green-500 text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.4)]">
            {oferta.status || 'ACTIVE'}
          </div>
          {nicho && (
            <div className="px-3 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
              {nicho.nome}
            </div>
          )}
          <div className="px-3 py-1.5 bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20 text-cyan-500 text-[9px] font-black uppercase tracking-widest rounded-lg">
            {(['facebook_ads', 'instagram_ads', 'meta_ads'].includes(oferta.plataforma as any) ? 'FB NETWORK' : formatBadge(oferta.plataforma || 'GLOBAL'))}
          </div>
        </div>

        {/* Editorial Floating Information */}
        <div className="absolute bottom-10 left-10 md:bottom-16 md:left-16 z-20 max-w-[85%]">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-green-500/50" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-green-500/60">Sinal de Oferta Validado</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black text-white italic leading-[0.95] tracking-tighter uppercase mb-6 drop-shadow-2xl">
            {oferta.titulo}
          </h1>

          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs font-black text-white/30 uppercase tracking-widest">Linguagem</span>
              <span className="text-sm font-black text-white italic mt-1">{oferta.linguagem === 'pt_BR' ? 'BRAZILIAN PT' : (oferta.linguagem || 'INTERNATIONAL')}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-white/30 uppercase tracking-widest">Protocolo</span>
              <span className="text-sm font-black text-green-500 italic mt-1">{formatBadge(oferta.tipoOferta || 'DIRECT_DRIVE')}</span>
            </div>
          </div>
        </div>

        {/* Tactical UI Decals */}
        <div className="absolute bottom-10 right-10 hidden lg:block opacity-20 group-hover:opacity-100 transition-opacity duration-700">
          <div className="text-right">
            <div className="text-[9px] font-black text-white uppercase tracking-[0.3em] mb-1">SCANNING_ID</div>
            <div className="text-[8px] font-mono text-white/50">{oferta.id}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
