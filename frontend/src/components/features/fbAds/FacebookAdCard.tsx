'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Megaphone, ExternalLink, ArrowUpRight, Clock, Heart, Lock } from 'lucide-react';
import { Card3D } from '@/components/ui/Card3D';
import { AnuncioFacebook, calcDaysOnAir, formatLikes } from '@/hooks/useFacebookAds';

interface FacebookAdCardProps {
  anuncio: AnuncioFacebook;
  onView: (anuncio: AnuncioFacebook) => void;
  index?: number;
}

export function FacebookAdCard({ anuncio, onView, index = 0 }: FacebookAdCardProps) {
  const [imgError, setImgError] = useState(false);
  const daysOnAir = calcDaysOnAir(anuncio.deliveryStartTime);
  const isActive = anuncio.isActive;

  const platforms: string[] = (() => {
    try { return JSON.parse(anuncio.publisherPlatforms || '[]'); } catch { return []; }
  })();

  // FREE estourou o limite diário → tile de upgrade (item vem só com {id, locked, limitReached})
  if (anuncio.limitReached) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.35 }}
        className="h-full"
      >
        <div className="group relative h-full min-h-[420px] overflow-hidden rounded-3xl border border-green-500/20 bg-black/40 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="absolute inset-0 opacity-40 blur-2xl bg-[radial-gradient(circle_at_50%_40%,rgba(34,197,94,0.18),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <Lock size={26} className="text-green-400" />
          </div>
          <div className="relative z-10 space-y-1">
            <p className="text-sm font-black text-white uppercase tracking-wide">Limite diário atingido</p>
            <p className="text-[11px] text-white/40 leading-relaxed max-w-[220px]">Você viu seus anúncios grátis de hoje. Desbloqueie acesso ilimitado aos criativos.</p>
          </div>
          <a
            href="/configuracoes/plano"
            className="relative z-10 px-5 py-3 rounded-xl bg-green-500 text-black font-black text-[11px] uppercase tracking-widest hover:bg-green-400 transition-all shadow-[0_0_25px_rgba(34,197,94,0.3)]"
          >
            Desbloquear acesso
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="cursor-pointer"
      onClick={() => onView(anuncio)}
    >
      <Card3D
        variant="glass"
        glow
        has3DRotation
        hasParallax
        animatedBorder
        className="group relative h-full overflow-hidden rounded-3xl border border-white/5 bg-black/40 p-0"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-40 pointer-events-none" />

        {/* ── TOP BADGES ─────────────────────────────────────── */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
          {/* Status ativo/inativo */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded backdrop-blur-md border text-[9px] font-black uppercase tracking-widest ${
            isActive
              ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
              : 'bg-white/5 border-white/10 text-white/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
            {isActive ? 'ATIVO' : 'INATIVO'}
          </div>

          {/* Checkout badge */}
          {anuncio.checkout && (
            <div className="px-2.5 py-1 bg-cyan-500/10 backdrop-blur-md border border-cyan-500/30 rounded text-[9px] font-black uppercase tracking-widest text-cyan-400">
              {anuncio.checkout}
            </div>
          )}
        </div>

        {/* ── MÉTRICAS TOP RIGHT ──────────────────────────────── */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          {/* Escala */}
          {(anuncio.escala ?? 0) > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/10 backdrop-blur-md border border-orange-500/30 rounded">
              <Flame size={10} className="text-orange-400" />
              <span className="text-[10px] font-black text-orange-400">{anuncio.escala}</span>
            </div>
          )}
          {/* Duplicatas */}
          {(anuncio.duplicatas ?? 0) > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 backdrop-blur-md border border-purple-500/30 rounded">
              <Megaphone size={10} className="text-purple-400" />
              <span className="text-[10px] font-black text-purple-400">{anuncio.duplicatas}</span>
            </div>
          )}
        </div>

        {/* ── CRIATIVO / EMBED ────────────────────────────────── */}
        <div className="relative h-64 w-full overflow-hidden bg-black">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />

          {anuncio.locked ? (
            /* FREE: criativo bloqueado — blur + cadeado + CTA upgrade */
            <div className="relative z-20 w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#0d0d0d] to-black p-5 text-center">
              <div className="absolute inset-0 opacity-30 blur-2xl bg-[radial-gradient(circle_at_50%_40%,rgba(34,197,94,0.22),transparent_60%)] pointer-events-none" />
              <div className="relative z-10 w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <Lock size={20} className="text-white/45" />
              </div>
              <span className="relative z-10 text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Criativo bloqueado</span>
              <a
                href="/configuracoes/plano"
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/40 text-green-300 text-[9px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all flex items-center gap-1.5"
              >
                <Lock size={10} /> Desbloquear
              </a>
            </div>
          ) : (() => {
            // O criativo REAL é o adSnapshotUrl (imagem do anúncio no Storage). Prioriza ele;
            // landingScreenshot é fallback. Ignora URLs que são link da biblioteca (não imagem).
            const hasValidSnapshot = anuncio.adSnapshotUrl && !anuncio.adSnapshotUrl.includes('/ads/library/?id=');
            const previewImage = (hasValidSnapshot ? anuncio.adSnapshotUrl : null) || anuncio.landingScreenshot;

            if (previewImage && !imgError) {
              return (
                <img
                  src={previewImage}
                  alt="Criativo do anúncio"
                  loading="lazy"
                  className="w-full h-full object-contain bg-black transition-transform duration-700 group-hover:scale-105"
                  onError={() => setImgError(true)}
                />
              );
            }

            return (
              <div className="relative z-20 w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#111] to-black p-5 text-center">
                {anuncio.adCopy ? (
                  <p className="text-[11px] text-white/45 leading-relaxed line-clamp-5 font-medium">{anuncio.adCopy}</p>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                      <ExternalLink size={18} className="text-white/10" />
                    </div>
                    <span className="text-[9px] font-black text-white/15 uppercase tracking-[0.3em]">Sem Preview</span>
                  </div>
                )}
                <a
                  href={`https://www.facebook.com/ads/library/?id=${anuncio.fbAdId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <ExternalLink size={10} /> Abrir no FB
                </a>
              </div>
            );
          })()}

          {/* Tempo no ar — bottom left sobre imagem */}
          <div className="absolute bottom-3 left-3 z-20">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-white/10">
              <Clock size={9} className="text-white/50" />
              <span className="text-[9px] font-black text-white/60">
                {daysOnAir > 0 ? `${daysOnAir}d no ar` : 'Recente'}
              </span>
            </div>
          </div>

          {/* Plataformas — bottom right sobre imagem */}
          {platforms.length > 0 && (
            <div className="absolute bottom-3 right-3 z-20 flex gap-1">
              {platforms.slice(0, 2).map(p => (
                <div key={p} className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-white/10 text-[8px] font-black text-white/50 uppercase">
                  {p.replace('_', ' ')}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── CONTENT AREA ────────────────────────────────────── */}
        <div className="p-6 space-y-4">
          {/* Página anunciante */}
          <div className="flex items-center gap-3">
            {anuncio.pageProfilePic ? (
              <img
                src={anuncio.pageProfilePic}
                alt={anuncio.pageName || ''}
                className="w-9 h-9 rounded-full border border-white/10 object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-black text-white/30">
                  {anuncio.pageName?.[0] || 'P'}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">{anuncio.pageName || 'Página'}</p>
              {anuncio.pageLikes != null && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Heart size={8} className="text-pink-400" />
                  <span className="text-[9px] font-bold text-white/30">{formatLikes(anuncio.pageLikes)} curtidas</span>
                </div>
              )}
            </div>
            {/* Tecnologia badge */}
            {anuncio.tecnologia && (
              <div className="ml-auto px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-black text-white/40 uppercase flex-shrink-0">
                {anuncio.tecnologia}
              </div>
            )}
          </div>

          {/* Copy truncado */}
          {anuncio.adCopy && (
            <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2 font-medium">
              {anuncio.adCopy}
            </p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-white/5">
            <div className="flex flex-col items-center gap-1">
              <Flame size={12} className="text-orange-400" />
              <span className="text-xs font-black text-white">{anuncio.escala ?? 0}</span>
              <span className="text-[8px] font-black text-white/20 uppercase tracking-wider">Escala</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-x border-white/5">
              <Megaphone size={12} className="text-purple-400" />
              <span className="text-xs font-black text-white">{anuncio.duplicatas ?? 0}</span>
              <span className="text-[8px] font-black text-white/20 uppercase tracking-wider">Dupl.</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock size={12} className="text-cyan-400" />
              <span className="text-xs font-black text-white">{daysOnAir}</span>
              <span className="text-[8px] font-black text-white/20 uppercase tracking-wider">Dias</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-2">
            {/* Ver detalhes (abre modal) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-black text-[10px] uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.05)] hover:shadow-[0_0_25px_rgba(34,197,94,0.25)]"
              onClick={(e) => { e.stopPropagation(); onView(anuncio); }}
            >
              [ Ver Oferta ]
            </motion.button>

            {/* Acessar landing page diretamente */}
            {anuncio.destinationUrl && (
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={anuncio.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
                title="Acessar Página de Vendas"
              >
                <ArrowUpRight size={16} />
              </motion.a>
            )}
          </div>
        </div>
      </Card3D>
    </motion.div>
  );
}
