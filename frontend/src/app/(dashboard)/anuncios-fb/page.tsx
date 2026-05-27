"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import nookies from 'nookies';
import {
  Megaphone, Flame, RefreshCw, Loader2, Zap,
  Search, X, Radio, Database, TrendingUp, BarChart3
} from 'lucide-react';
import { useFacebookAds, AnuncioFacebook } from '@/hooks/useFacebookAds';
import { FacebookAdsFilters } from '@/components/features/fbAds/FacebookAdsFilters';
import { FacebookAdsGrid } from '@/components/features/fbAds/FacebookAdsGrid';
import { FacebookAdDetails } from '@/components/features/fbAds/FacebookAdDetails';
import { useAuth } from '@/context/AuthContext';
import { LoadingMoney } from '@/components/ui/LoadingMoney';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
  const [syncError, setSyncError] = useState<string | null>(null);

  // ── Live Search state ────────────────────────────────────────────
  const [liveQuery, setLiveQuery] = useState('');
  const [liveResults, setLiveResults] = useState<AnuncioFacebook[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveTotal, setLiveTotal] = useState(0);
  const [liveMining, setLiveMining] = useState(false); // Apify rodando em background
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const miningPollRef = useRef<NodeJS.Timeout | null>(null);

  const getAuthHeaders = useCallback((): HeadersInit => {
    const cookies = nookies.get(null);
    const token = cookies['auth_token'] || null;
    const h: HeadersInit = { 'Content-Type': 'application/json' };
    if (token && token !== 'undefined' && token !== 'null') {
      h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  }, []);

  const runLiveSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setIsLiveMode(false);
      setLiveResults([]);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLiveMode(true);
    setLiveLoading(true);
    setLiveError(null);

    try {
      const res = await fetch(`${API_BASE}/fb-ads/search`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        signal: abortRef.current.signal,
        body: JSON.stringify({ q: q.trim(), countries: ['BR'], limit: 50 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${res.status}`);
      }

      const json = await res.json();
      setLiveResults(json.data || []);
      setLiveTotal(json.total || 0);

      // Se Apify está minerando em background, inicia polling de 10s
      if (json.miningStarted) {
        setLiveMining(true);
        if (miningPollRef.current) clearInterval(miningPollRef.current);
        let polls = 0;
        miningPollRef.current = setInterval(async () => {
          polls++;
          if (polls > 24) { // max 4 min
            clearInterval(miningPollRef.current!);
            setLiveMining(false);
            return;
          }
          // Rebusca no BD (novos anúncios do Apify já foram salvos)
          try {
            const r2 = await fetch(`${API_BASE}/fb-ads/search`, {
              method: 'POST',
              headers: getAuthHeaders(),
              credentials: 'include',
              body: JSON.stringify({ q: q.trim(), countries: ['BR'], limit: 50 }),
            });
            if (r2.ok) {
              const j2 = await r2.json();
              if (j2.total > (json.total || 0)) {
                setLiveResults(j2.data || []);
                setLiveTotal(j2.total || 0);
                clearInterval(miningPollRef.current!);
                setLiveMining(false);
              }
            }
          } catch {}
        }, 10000);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setLiveError(err.message || 'Erro ao buscar anúncios');
      }
    } finally {
      setLiveLoading(false);
    }
  }, [getAuthHeaders]);

  const handleLiveQueryChange = (q: string) => {
    setLiveQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q.trim() || q.trim().length < 2) {
      setIsLiveMode(false);
      setLiveResults([]);
      setLiveLoading(false);
      return;
    }

    // Debounce de 800ms para não disparar a cada tecla
    debounceRef.current = setTimeout(() => runLiveSearch(q), 800);
  };

  const clearLiveSearch = () => {
    setLiveQuery('');
    setIsLiveMode(false);
    setLiveResults([]);
    setLiveError(null);
    setLiveLoading(false);
    setLiveMining(false);
    abortRef.current?.abort();
    if (miningPollRef.current) clearInterval(miningPollRef.current);
  };

  const [recalcing, setRecalcing] = useState(false);

  const handleRecalcEscala = async () => {
    const cookies = nookies.get(null);
    const token = cookies['auth_token'] || null;
    setRecalcing(true);
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token && token !== 'undefined' && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/fb-ads/recalc-escala`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao recalcular');
      refetch();
    } catch (err: any) {
      setSyncError(err.message);
    } finally {
      setRecalcing(false);
    }
  };

  const handleSync = async () => {
    const cookies = nookies.get(null);
    const token = cookies['auth_token'] || null;
    setSyncing(true);
    setSyncError(null);
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token && token !== 'undefined' && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/fb-ads/sync`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ adActiveStatus: 'ACTIVE', countries: ['BR'], limit: 50 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.details || data.error || 'Erro desconhecido ao sincronizar');
      refetch();
    } catch (err: any) {
      setSyncError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Ao selecionar um anúncio ao-vivo, tentamos buscar pelo ID (pode não estar no BD)
  const handleSelectAd = (a: AnuncioFacebook) => setSelectedId(a.id);

  const displayAds = isLiveMode ? liveResults : anuncios;
  const displayTotal = isLiveMode ? liveTotal : meta.total;
  const displayHasMore = isLiveMode ? false : hasMore;
  const displayIsLoading = isLiveMode ? liveLoading : isLoading;

  return (
    <div className="relative pt-10 pb-24">

      {/* ── EDITORIAL HEADER ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 px-8 lg:px-12 gap-10">
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

          {/* Stats (Apenas Admin) */}
          {isAdmin && (
            <div className="mt-8 flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-4xl font-black text-white italic leading-none">{meta.total}</span>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Minerados no Acervo</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-400" />
                  <span className="text-4xl font-black text-orange-400 italic leading-none">
                    {anuncios.filter(a => (a.escala ?? 0) > 0).length}
                  </span>
                </div>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Com Escala</span>
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
          )}
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex flex-wrap gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={refetch}
              className="flex items-center gap-2 px-5 py-3 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white/60 transition-all">
              <RefreshCw size={14} /> Atualizar
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleRecalcEscala} disabled={recalcing}
              title="Recalcula a escala de TODOS os anúncios baseado em duplicatas + tempo no ar + status"
              className="flex items-center gap-2 px-5 py-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-[10px] font-black text-orange-400 uppercase tracking-widest hover:bg-orange-500 hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {recalcing ? <><Loader2 size={14} className="animate-spin" /> Recalculando...</> : <><BarChart3 size={14} /> Recalc Escala</>}
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSync} disabled={syncing}
              className="flex items-center gap-2 px-5 py-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-[10px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500 hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {syncing ? <><Loader2 size={14} className="animate-spin" /> Sincronizando...</> : <><Zap size={14} /> Sincronizar</>}
            </motion.button>
          </div>
        )}
      </div>

      {/* ── LIVE SEARCH BAR ───────────────────────────────────── */}
      <div className="px-8 lg:px-12 mb-6">
        <div className="relative">
          {/* Glow */}
          <div className={`absolute inset-0 blur-2xl rounded-3xl transition-opacity duration-500 ${isLiveMode ? 'opacity-100 bg-blue-500/10' : 'opacity-0'}`} />

          <div className={`relative flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 ${
            isLiveMode
              ? 'bg-blue-500/5 border-blue-500/30'
              : 'bg-white/[0.02] border-white/5'
          }`}>
            {/* Ícone de status */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isLiveMode ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/[0.03] border border-white/10'
            }`}>
              {liveLoading
                ? <Loader2 size={16} className="text-blue-400 animate-spin" />
                : isLiveMode
                  ? <Radio size={16} className="text-blue-400 animate-pulse" />
                  : <Search size={16} className="text-white/30" />
              }
            </div>

            <input
              type="text"
              value={liveQuery}
              onChange={(e) => handleLiveQueryChange(e.target.value)}
              placeholder="PESQUISAR NA BIBLIOTECA DO FACEBOOK... (ex: suplemento, dropshipping, curso...)"
              className="flex-1 bg-transparent text-sm font-bold text-white placeholder:text-white/20 placeholder:text-[10px] placeholder:tracking-widest focus:outline-none uppercase tracking-wider"
            />

            {/* Badge de modo */}
            <AnimatePresence>
              {isLiveMode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-xl"
                >
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Live</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botão limpar */}
            {liveQuery && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={clearLiveSearch}
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={14} />
              </motion.button>
            )}
          </div>

          {/* Dica */}
          {!isLiveMode && (
            <p className="mt-2 ml-4 text-[9px] font-bold text-white/20 uppercase tracking-widest">
              Digite 2+ caracteres para pesquisar no acervo e minerar novos anúncios
            </p>
          )}
          {isLiveMode && liveLoading && (
            <p className="mt-2 ml-4 text-[9px] font-bold text-blue-400/50 uppercase tracking-widest animate-pulse">
              Pesquisando no acervo...
            </p>
          )}
          {isLiveMode && !liveLoading && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-2 ml-4 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
              {liveMining ? (
                <><Loader2 size={10} className="text-orange-400 animate-spin" />
                <span className="text-orange-400/70">{liveTotal} no acervo — minerando mais anúncios do Facebook...</span></>
              ) : (
                <><TrendingUp size={10} className="text-blue-400/50" />
                <span className="text-blue-400/50">{liveTotal} anúncios encontrados para "{liveQuery}"</span></>
              )}
            </motion.p>
          )}
        </div>
      </div>

      {/* ── MODO BANNER ───────────────────────────────────────── */}
      <AnimatePresence>
        {isLiveMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-8 lg:px-12 mb-4"
          >
            <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
              liveMining
                ? 'bg-orange-500/5 border-orange-500/20'
                : 'bg-blue-500/5 border-blue-500/20'
            }`}>
              {liveMining
                ? <><Loader2 size={12} className="text-orange-400 animate-spin" />
                    <span className="text-[10px] font-black text-orange-400/80 uppercase tracking-widest">
                      Acervo + Minerando Facebook em background
                    </span></>
                : <><Database size={12} className="text-blue-400" />
                    <span className="text-[10px] font-black text-blue-400/80 uppercase tracking-widest">
                      Pesquisando no Acervo Local
                    </span></>
              }
              <div className="ml-auto">
                <span className="text-[9px] text-white/30 font-bold">{liveTotal} resultados</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILTROS (só no modo acervo) ───────────────────────── */}
      {!isLiveMode && (
        <FacebookAdsFilters
          filters={filters}
          onChange={setFilters}
          total={meta.total}
        />
      )}

      {/* ── ERROS ─────────────────────────────────────────────── */}
      {(error || syncError || liveError) && (
        <div className="mx-8 lg:mx-12 mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold flex flex-col gap-2">
          {error && <div>Erro ao carregar anúncios: {error}</div>}
          {syncError && <div>Erro de sincronização: {syncError}</div>}
          {liveError && <div>Erro na busca ao vivo: {liveError}</div>}
        </div>
      )}

      {/* ── GRID ─────────────────────────────────────────────── */}
      <div className="px-8 lg:px-12">
        <FacebookAdsGrid
          anuncios={displayAds}
          isLoading={displayIsLoading}
          isLoadingMore={isLoadingMore}
          hasMore={displayHasMore}
          onView={handleSelectAd}
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
