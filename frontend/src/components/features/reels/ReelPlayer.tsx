"use client";

import { useState, useRef, useEffect } from 'react';
import { Oferta } from '@/types/oferta';
import { FavoritoButton } from '@/components/features/ofertas/FavoritoButton';
import { ReelBadges } from './ReelBadges';
import { ExternalLink, Play, Pause, TrendingUp, DollarSign, Activity, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · ReelPlayer v2.0
// Features: Mastery High-Fidelity, Mobile Tactical Node,
// Massive Editorial Typography, Monospace Meta-Data HUD.
// ─────────────────────────────────────────────────────────────────

interface ReelPlayerProps {
  oferta: Oferta;
  isActive: boolean;
  onView?: () => void;
}

export function ReelPlayer({ oferta, isActive, onView }: ReelPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [roiCount, setRoiCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { addXP, updateStats, checkAndUnlockBadges } = useGamification();
  const hasViewedRef = useRef(false);

  const metricas = typeof oferta.metricas === 'string'
    ? (() => { try { return JSON.parse(oferta.metricas); } catch { return null; } })() : oferta.metricas;

  const roi = metricas?.roi || (oferta.receita ? ((oferta.receita || 0) / 100) : null);

  useEffect(() => {
    if (isActive && roi !== null) {
      let current = 0;
      const interval = setInterval(() => {
        current += roi / 40;
        if (current >= roi) { setRoiCount(roi); clearInterval(interval); }
        else { setRoiCount(current); }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isActive, roi]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateProgress = () => { if (video.duration) setProgress((video.currentTime / video.duration) * 100); };
    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => { });
      setIsPlaying(true);
      if (onView && user?.id && !hasViewedRef.current) {
        onView();
        hasViewedRef.current = true;
        addXP('VISUALIZAR_REEL');
        updateStats({ reelsVisualizados: 1 });
        setTimeout(() => checkAndUnlockBadges(), 200);
      }
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      hasViewedRef.current = false;
    }
  }, [isActive, user?.id, addXP, updateStats, checkAndUnlockBadges, onView]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause(); else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const goToDetails = () => {
    const nichoSlug = (oferta.nicho as any)?.slug || oferta.nichoId;
    router.push(`/oferta/${nichoSlug}/${oferta.id}`);
  };

  if (!oferta.vsl) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">

      {/* Background Ambience Bloom */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.3),transparent_70%)] blur-[100px]"
          />
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-[400px] h-[85vh] flex items-center justify-center lg:mt-10">

        {/* Chassis Mobile Industrial */}
        <div className="absolute inset-0 rounded-[3.5rem] border-[1px] border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.9)] bg-black overflow-hidden group/mobi">

          {/* Top Meta-Data HUD */}
          <div className="absolute top-0 inset-x-0 z-30 px-8 py-10 flex items-center justify-between pointer-events-none">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Live_Stream</span>
              </div>
              <div className="text-[8px] font-mono text-white/10 uppercase">NODE::{oferta.id.slice(0, 8)}</div>
            </div>
            <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-1 border border-white/5 flex items-center gap-2">
              <Activity size={10} className="text-green-500" />
              <span className="text-[8px] font-black text-white uppercase tracking-widest">ACTIVE_NODE</span>
            </div>
          </div>

          {/* Video Surface */}
          <video
            ref={videoRef} src={oferta.vsl} poster={oferta.imagem || undefined}
            className="w-full h-full object-cover"
            loop muted={isMuted} playsInline onClick={togglePlay}
          />

          {/* Vertical Progress Bar (Right Side) */}
          <div className="absolute top-1/4 bottom-1/4 right-3 w-[2px] bg-white/5 z-30 rounded-full overflow-hidden">
            <div
              className="w-full bg-green-500 transition-all duration-150"
              style={{ height: `${progress}%` }}
            />
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />

          {/* Editorial Info Block */}
          <div className="absolute bottom-10 left-0 right-0 px-8 z-20 space-y-6">

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[8px] font-black text-green-500 uppercase tracking-widest">
                  {(oferta.nicho as any)?.nome || 'GLOBAL'}
                </span>
                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] italic">VSL Protocol</span>
              </div>

              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-[0.9] pr-10">
                {oferta.titulo}
              </h3>

              <div className="flex items-center gap-8">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">IMPULSO_ROI</span>
                  <span className="text-xl font-black text-green-500 italic">
                    +{Math.floor(roiCount)}<span className="text-[10px] not-italic opacity-50">%</span>
                  </span>
                </div>
                {metricas?.ctr && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">CLICK_RATE</span>
                    <span className="text-xl font-black text-cyan-500 italic">
                      {metricas.ctr}<span className="text-[10px] not-italic opacity-50">%</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={goToDetails}
                className="flex-1 pointer-events-auto bg-green-500 hover:bg-green-400 text-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 group/btn"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">SINCRONIZAR_OFERTA</span>
                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
              <div className="pointer-events-auto">
                <FavoritoButton oferta={oferta} size="lg" className="h-[52px] w-[52px] bg-white text-black hover:bg-white/90 border-0 rounded-2xl" />
              </div>
            </div>
          </div>

          {/* Mute Control */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-1/2 -translate-y-1/2 left-4 z-40 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-white/50 hover:text-white transition-all opacity-0 group-hover/mobi:opacity-100"
          >
            {isMuted ? <Pause size={12} /> : <Play size={12} />}
          </button>

        </div>
      </div>
    </div>
  );
}
