"use client";

import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import nookies from 'nookies';
import { Megaphone, Flame, RefreshCw, Loader2, Zap } from 'lucide-react';
import { useFacebookAds, AnuncioFacebook } from '@/hooks/useFacebookAds';
import { FacebookAdsFilters } from '@/components/features/fbAds/FacebookAdsFilters';
import { FacebookAdsGrid } from '@/components/features/fbAds/FacebookAdsGrid';
import { FacebookAdDetails } from '@/components/features/fbAds/FacebookAdDetails';
import { useAuth } from '@/context/AuthContext';
import { LoadingMoney } from '@/components/ui/LoadingMoney';

function AnunciosFbContent() {
  const { isAdmin } = useAuth();
  const {
    anuncios, meta, isLoading, isLoadingMore, error,
    filters, setFilters,
    loadMore, refetch, hasMore,
    triggerFunnelScan, fetchById,
  } = useFacebookAds();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    const cookies = nookies.get(null);
    const token = cookies['auth_token'] || null;
    setSyncing(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/fb-ads/sync`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ adActiveStatus: 'ACTIVE', countries: ['BR'], limit: 50 }),
      });
      refetch();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="relative pt-10 pb-24">

      {/* ── EDITORIAL HEADER ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 px-8 lg:px-12 gap-10">
        <div>
          {/* Status indicator */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
              Mineração de Anúncios Ativa
            </span>
          </div>

          {/* Título */}
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
            ANÚNCIOS <span className="text-blue-500">FB</span>
          </h1>

          {/* Stats rápidas */}
          <div className="mt-8 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-4xl font-black text-white italic leading-none">{meta.total}</span>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Anúncios Minerados</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <Flame size={14} className="text-orange-400" />
                <span className="text-4xl font-black text-orange-400 italic leading-none">
                  {anuncios.filter(a => (a.escala ?? 0) > 0).length}
                </span>
              </div>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Com Escala Definida</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <Megaphone size={14} className="text-purple-400" />
                <span className="text-4xl font-black text-purple-400 italic leading-none">
                  {anuncios.filter(a => (a.duplicatas ?? 0) > 1).length}
                </span>
              </div>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Em Duplicação</span>
            </div>
          </div>
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={refetch}
              className="flex items-center gap-2 px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white/60 transition-all"
            >
              <RefreshCw size={14} />
              Atualizar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-6 py-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-[10px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500 hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {syncing
                ? <><Loader2 size={14} className="animate-spin" /> Sincronizando...</>
                : <><Zap size={14} /> Sincronizar FB API</>
              }
            </motion.button>
          </div>
        )}
      </div>

      {/* ── FILTROS ───────────────────────────────────────────── */}
      <FacebookAdsFilters
        filters={filters}
        onChange={setFilters}
        total={meta.total}
      />

      {/* ── ERRO ─────────────────────────────────────────────── */}
      {error && (
        <div className="mx-8 lg:mx-12 mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold">
          Erro ao carregar anúncios: {error}
        </div>
      )}

      {/* ── GRID ─────────────────────────────────────────────── */}
      <div className="px-8 lg:px-12">
        <FacebookAdsGrid
          anuncios={anuncios}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onView={(a) => setSelectedId(a.id)}
          onLoadMore={loadMore}
        />
      </div>

      {/* ── MODAL DE DETALHES ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedId && (
          <FacebookAdDetails
            anuncioId={selectedId}
            onClose={() => setSelectedId(null)}
            onFunnelScan={triggerFunnelScan}
            fetchById={fetchById}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnunciosFbPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><LoadingMoney /></div>}>
      <AnunciosFbContent />
    </Suspense>
  );
}
