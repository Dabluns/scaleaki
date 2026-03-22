"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOfertaContext } from '@/context/OfertaContext';
import { useNichos } from '@/context/NichoContext';
import { useAuth } from '@/context/AuthContext';
import { OfertasFilters } from '@/components/features/ofertas/OfertasFilters';
import { OfertasList } from '@/components/features/ofertas/OfertasList';
import { OfertaEditModal } from '@/components/features/ofertas/OfertaEditModal';
import { Card3D } from '@/components/ui/Card3D';
import { Button } from '@/components/ui/Button';
import { LoadingMoney } from '@/components/ui/LoadingMoney';
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration';
import { useCounter } from '@/hooks/useCounter';
import { Search, Filter, TrendingUp, Calendar, Target, Globe, ArrowUpDown, Sparkles, Flame, Zap, ShieldCheck } from 'lucide-react';
import { Oferta } from '@/types/oferta';
import { useSettings } from '@/context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium OfertasPage v2.0
// Features: Cinematic Status Dashboard, Mastery Editorial Flow, 
// Single-Tone Neon Accent Logic, and Massive Typography.
// ─────────────────────────────────────────────────────────────────

function OfertasPageContent() {
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { ofertas, loading, editarOferta, removerOferta, fetchOfertas } = useOfertaContext();
  const { nichos } = useNichos();
  const { isAdmin } = useAuth();

  const [filters, setFilters] = useState<any>({});
  const [selectedOferta, setSelectedOferta] = useState<Oferta | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'performance' | 'date' | 'roi' | 'ctr' | 'receita' | 'conversoes'>(
    ((settings as any)?.defaultSort === 'receita' ? 'receita' : 'performance') as any
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const showAdvancedFilters = searchParams.get('filters') === 'advanced';
  const isPopularView = searchParams.get('sort') === 'popular';

  const ofertasFiltradas = useMemo(() => {
    let filtradas = ofertas || [];
    if (filters.search) {
      const termo = filters.search.toLowerCase();
      filtradas = filtradas.filter(o => o.titulo?.toLowerCase().includes(termo) || o.texto?.toLowerCase().includes(termo));
    }
    if (filters.plataforma) filtradas = filtradas.filter(o => o.plataforma === filters.plataforma);
    if (filters.nichoId) filtradas = filtradas.filter(o => o.nichoId === filters.nichoId);

    filtradas = filtradas.slice().sort((a, b) => {
      let aValue = (a as any)[sortBy] || 0;
      let bValue = (b as any)[sortBy] || 0;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtradas;
  }, [ofertas, filters, sortBy, sortOrder]);

  const totalCount = useCounter(ofertasFiltradas.length, { duration: 1500 });

  useEffect(() => {
    fetchOfertas({ page: 1, limit: 100 });
  }, [fetchOfertas]);

  const handleEditOferta = (oferta: Oferta) => {
    setSelectedOferta(oferta);
    setIsEditModalOpen(true);
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><LoadingMoney /></div>;

  return (
    <div className="relative pt-10 pb-20">

      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 px-8 lg:px-12 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Radar de Inteligência Ativo</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
            OFERTAS <span className="text-green-500">{isPopularView ? 'POPULARES' : 'REAIS'}</span>
          </h1>
          <div className="mt-8 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-4xl font-black text-white italic leading-none">{totalCount.count}</span>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Sinais Detectados</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-4xl font-black text-cyan-500 italic leading-none">Global</span>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Escopo de Análise</span>
            </div>
          </div>
        </div>

        {/* Tactical Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-green-500/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <input
              type="text"
              placeholder="FILTRAR SINAIS..."
              className="relative px-12 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black text-white tracking-widest uppercase focus:outline-none focus:border-green-500/30 w-full md:w-64"
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <Search size={16} className="absolute left-4 top-4.5 text-white/20 group-focus-within:text-green-500 transition-colors" />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black text-white tracking-widest uppercase hover:bg-white/10 transition-all flex items-center gap-3"
          >
            <ArrowUpDown size={16} className="text-green-500" />
            {sortOrder === 'asc' ? 'ORDEM: ASC' : 'ORDEM: DESC'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar Filters (Simplified or Advanced) */}
          <div className="lg:col-span-1 space-y-8">
            <div className="p-8 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full" />
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                <Filter size={14} className="text-green-500" /> Parâmetros Técnicos
              </h4>
              {/* This could link to advanced filters or show simplified ones */}
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-3">Plataforma</span>
                  <select
                    onChange={(e) => setFilters({ ...filters, plataforma: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black text-white uppercase tracking-widest focus:outline-none focus:border-green-500/30"
                  >
                    <option value="">TODAS</option>
                    <option value="meta_ads">META ADS</option>
                    <option value="google_ads">GOOGLE ADS</option>
                    <option value="tiktok_ads">TIKTOK ADS</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="p-8 bg-green-500/5 border border-green-500/10 rounded-[2.5rem] relative group">
              <h4 className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em] mb-4">Insight da IA</h4>
              <p className="text-sm font-bold text-green-500/60 leading-relaxed italic">
                "A convergência de dados indica que o nicho de Saúde está em fase de hiper-escala nas últimas 24h."
              </p>
            </div>
          </div>

          {/* Results List */}
          <div className="lg:col-span-3">
            {ofertasFiltradas.length > 0 ? (
              <OfertasList
                ofertas={ofertasFiltradas}
                onViewOferta={(o) => router.push(`/oferta/${o.nichoId}/${o.id}`)}
                onEditOferta={isAdmin ? handleEditOferta : undefined}
                onDeleteOferta={isAdmin ? (id) => removerOferta(id) : undefined}
                getNichoName={(id) => nichos.find(n => n.id === id)?.nome || 'Nicho'}
              />
            ) : (
              <div className="h-[50vh] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] grayscale opacity-40">
                <Target size={60} className="text-white/10 mb-8" />
                <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Nenhum sinal detectado nesta frequência.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedOferta && isEditModalOpen && isAdmin && (
        <OfertaEditModal
          oferta={selectedOferta}
          nicho={nichos.find(n => n.id === selectedOferta.nichoId)}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (o) => { await editarOferta(o); setIsEditModalOpen(false); }}
          onDelete={async (id) => { await removerOferta(id); setIsEditModalOpen(false); }}
        />
      )}
    </div>
  );
}

export default function OfertasPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><LoadingMoney /></div>}>
      <OfertasPageContent />
    </Suspense>
  );
}