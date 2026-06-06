'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FacebookAdCard } from './FacebookAdCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { AnuncioFacebook } from '@/hooks/useFacebookAds';
import { Target, Loader2 } from 'lucide-react';

interface FacebookAdsGridProps {
  anuncios: AnuncioFacebook[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onView: (anuncio: AnuncioFacebook) => void;
  onLoadMore: () => void;
}

export function FacebookAdsGrid({
  anuncios, isLoading, isLoadingMore, hasMore, onView, onLoadMore
}: FacebookAdsGridProps) {

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!anuncios.length) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem]">
        <Target size={60} className="text-white/10 mb-8" />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
          Nenhum anúncio encontrado com esses filtros.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        <AnimatePresence>
          {anuncios.map((anuncio, i) => (
            <FacebookAdCard
              key={anuncio.id}
              anuncio={anuncio}
              onView={onView}
              index={i}
            />
          ))}
        </AnimatePresence>

        {/* Skeleton cards ao carregar mais */}
        {isLoadingMore && Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={`more-${i}`} />
        ))}
      </div>

      {/* Botão de carregar mais */}
      {hasMore && !isLoadingMore && (
        <div className="flex justify-center pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLoadMore}
            className="px-12 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:border-green-500/30 hover:text-green-400 transition-all flex items-center gap-3"
          >
            Carregar Mais Anúncios
          </motion.button>
        </div>
      )}

      {isLoadingMore && (
        <div className="flex justify-center pt-4">
          <Loader2 size={20} className="animate-spin text-green-400/40" />
        </div>
      )}
    </div>
  );
}
