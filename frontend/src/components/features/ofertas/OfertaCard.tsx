"use client";

import React, { useState, useMemo } from 'react';
import { Oferta } from '@/types/oferta';
import { FavoritoButton } from './FavoritoButton';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { Clock, Calendar, Trash2, ArrowUpRight, ShieldCheck, Sparkles, TrendingUp, Play, Video, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card3D } from '@/components/ui/Card3D';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium OfertaCard v3.0
// Pegada: High-Fidelity Cyberpunk, Editorial precision, Glassmorphism.
// ─────────────────────────────────────────────────────────────────

interface OfertaCardProps {
  oferta: Oferta;
  onView?: (oferta: Oferta) => void;
  getNichoName?: (nichoId: string) => string;
  className?: string;
  isAdmin?: boolean;
  onDelete?: (ofertaId: string) => void | Promise<void>;
}

export function OfertaCard({ oferta, onView, getNichoName, className = '', isAdmin = false, onDelete }: OfertaCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extrair thumbnail dos criativos (links) quando não tem imagem principal
  const thumbnail = useMemo(() => {
    // 1. Imagem principal da oferta
    if (oferta.imagem) return { url: oferta.imagem, type: 'image' as const };

    // 2. Tentar extrair do campo links
    let linksUrls: string[] = [];
    if (oferta.links) {
      try {
        let parsed = typeof oferta.links === 'string' ? JSON.parse(oferta.links) : oferta.links;
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        if (Array.isArray(parsed)) {
          linksUrls = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.criativos)) linksUrls = parsed.criativos;
        }
      } catch { /* ignore */ }
    }

    // Procurar imagem primeiro
    const imgUrl = linksUrls.find(u =>
      /\.(jpg|jpeg|png|webp|gif|svg|bmp)/i.test(u) || (u.includes('/images/') && !u.includes('/videos/'))
    );
    if (imgUrl) return { url: imgUrl, type: 'image' as const };

    // Depois vídeo criativo
    const videoUrl = linksUrls.find(u =>
      /\.(mp4|webm|mov|avi)/i.test(u) || u.includes('/videos/')
    );
    if (videoUrl) return { url: videoUrl, type: 'video' as const };

    // 3. VSL da oferta como último recurso
    if (oferta.vsl) return { url: oferta.vsl, type: 'video' as const };

    return null;
  }, [oferta.imagem, oferta.links, oferta.vsl]);

  const handleClick = () => {
    if (onView) onView(oferta);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(oferta.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Erro ao deletar:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'Ativo';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) return 'Hoje';
      if (diffInHours < 48) return 'Ontem';
      return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    } catch { return 'Ativo'; }
  };

  const nichoName = getNichoName ? getNichoName(oferta.nichoId) : 'Nicho';

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card3D
          variant="glass"
          glow={true}
          has3DRotation={true}
          hasParallax={true}
          animatedBorder={true}
          className="group relative h-full overflow-hidden rounded-3xl border border-white/5 bg-black/40 p-0"
          onClick={handleClick}
        >
          {/* Background Gradient Layer */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />

          {/* Status Badge (Top Left) */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
            <div className="px-2.5 py-1 bg-green-500 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase text-white tracking-widest">
                Nova
              </span>
            </div>
          </div>

          {/* Admin / Favorite Controls (Top Right) */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <AnimatePresence>
              {isAdmin && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDelete}
                  className="w-10 h-10 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            <div onClick={(e) => e.stopPropagation()}>
              <FavoritoButton
                oferta={oferta}
                size="sm"
                variant="secondary"
                className="w-10 h-10 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-pink-500/20 hover:border-pink-500/50 transition-all shadow-lg"
              />
            </div>
          </div>

          {/* Banner Image/Video Container */}
          <div className="relative h-72 w-full overflow-hidden">
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />

            {/* Smart Thumbnail */}
            {thumbnail && !imageError ? (
              thumbnail.type === 'image' ? (
                <motion.img
                  src={thumbnail.url}
                  alt={oferta.titulo}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={() => setImageError(true)}
                />
              ) : (
                /* Video thumbnail */
                <div className="relative w-full h-full">
                  <video
                    src={thumbnail.url}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    muted
                    preload="metadata"
                    playsInline
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => { })}
                    onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center z-[5] pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                    <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl">
                      <Play size={28} className="text-white ml-1" fill="white" />
                    </div>
                  </div>
                  {/* Video badge */}
                  <div className="absolute bottom-14 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 backdrop-blur-md border border-cyan-500/30">
                    <Video size={10} className="text-cyan-400" />
                    <span className="text-[8px] font-black text-cyan-400 uppercase tracking-wider">VIDEO</span>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#111] via-[#0d0d0d] to-black flex items-center justify-center">
                <div className="relative flex flex-col items-center">
                  <div className="absolute inset-0 bg-green-500/10 blur-3xl rounded-full" />
                  <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-3 relative z-10">
                    <Image className="w-8 h-8 text-white/10" />
                  </div>
                  <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] relative z-10">Sem Preview</span>
                </div>
              </div>
            )}

            {/* Scale Indicator (Bottom Right) */}
            <div className="absolute bottom-4 right-4 z-20">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] font-black text-white/90">
                  ESCALE AGORA
                </span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 relative">
            {/* Nicho Label */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500/80">
                {nichoName}
              </span>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-black text-white mb-5 line-clamp-2 leading-[1.1] tracking-tighter group-hover:text-green-400 transition-colors">
              {oferta.titulo}
            </h3>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-5 mb-8">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Analisada em</span>
                <div className="flex items-center gap-1.5 text-white/70">
                  <Calendar className="w-3.5 h-3.5 text-green-500/60" />
                  <span className="text-sm font-medium">{formatDate(oferta.createdAt)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Confiança</span>
                <div className="flex items-center gap-1.5 text-white/70">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-500/60" />
                  <span className="text-sm font-medium">98.4%</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(255,255,255,0.05)]"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              Abrir Oferta
              <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          </div>
        </Card3D>
      </motion.div>

      {/* Modal de confirmação de exclusão */}
      <AnimatePresence>
        {isAdmin && onDelete && showDeleteModal && (
          <ConfirmDeleteModal
            isOpen={showDeleteModal}
            title="Excluir Oferta"
            description="Esta é uma ação destrutiva e removerá permanentemente a oferta da rede."
            itemName={oferta.titulo}
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowDeleteModal(false)}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </>
  );
}
