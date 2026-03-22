"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOfertaContext } from '@/context/OfertaContext';
import { useNichos } from '@/context/NichoContext';
import { Card3D } from '@/components/ui/Card3D';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCounter } from '@/hooks/useCounter';
import { Clock, Calendar, ArrowUpDown, Sparkles, TrendingUp, Search, Zap, Globe, ShieldCheck, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OfertasList } from '@/components/features/ofertas/OfertasList';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium OfertasRecentesPage v2.0
// Features: Mastery High-Fidelity, Cinematic Layout,
// Red Cyan Signal Accents, and Massive Typography.
// ─────────────────────────────────────────────────────────────────

export default function OfertasRecentesPage() {
  const router = useRouter();
  const { ofertas, loading, fetchOfertas, removerOferta, editarOferta } = useOfertaContext();
  const { nichos } = useNichos();

  const [filtroPeriodo, setFiltroPeriodo] = useState<'todos' | 'ano' | 'mes' | 'dia'>('todos');
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState<number>(new Date().getMonth() + 1);
  const [diaSelecionado, setDiaSelecionado] = useState<number>(new Date().getDate());
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const ofertasFiltradas = useMemo(() => {
    let filtradas = ofertas || [];

    if (filtroPeriodo !== 'todos') {
      const agora = new Date();
      let dataInicio: Date;
      let dataFim: Date = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59);

      switch (filtroPeriodo) {
        case 'ano':
          dataInicio = new Date(anoSelecionado, 0, 1, 0, 0, 0);
          dataFim = new Date(anoSelecionado, 11, 31, 23, 59, 59);
          break;
        case 'mes':
          dataInicio = new Date(anoSelecionado, mesSelecionado - 1, 1, 0, 0, 0);
          dataFim = new Date(anoSelecionado, mesSelecionado, 0, 23, 59, 59);
          break;
        case 'dia':
          dataInicio = new Date(anoSelecionado, mesSelecionado - 1, diaSelecionado, 0, 0, 0);
          dataFim = new Date(anoSelecionado, mesSelecionado - 1, diaSelecionado, 23, 59, 59);
          break;
        default:
          return filtradas;
      }

      filtradas = filtradas.filter(oferta => {
        const updatedAt = new Date(oferta.updatedAt);
        return updatedAt >= dataInicio && updatedAt <= dataFim;
      });
    }

    return filtradas.slice().sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [ofertas, filtroPeriodo, anoSelecionado, mesSelecionado, diaSelecionado, sortOrder]);

  const totalCount = useCounter(ofertasFiltradas.length, { duration: 1500 });

  useEffect(() => {
    const controller = new AbortController();
    fetchOfertas({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc', signal: controller.signal });
    return () => controller.abort();
  }, [fetchOfertas]);

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="relative pt-10 pb-20">

      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 px-8 lg:px-12 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500/60">Monitoramento de Sinais em Tempo Real</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
            ÚLTIMAS <span className="text-cyan-500">OFERTAS</span>
          </h1>
          <div className="mt-8 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-4xl font-black text-white italic leading-none">{totalCount.count}</span>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Sinais Detectados</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-4xl font-black text-cyan-500 italic leading-none">Global</span>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Alcance da Varredura</span>
            </div>
          </div>
        </div>

        {/* Tactical Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="flex bg-white/[0.03] border border-white/5 rounded-2xl p-1.5">
            {['todos', 'ano', 'mes', 'dia'].map((p) => (
              <button
                key={p}
                onClick={() => setFiltroPeriodo(p as any)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroPeriodo === p ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-3 px-6 py-2 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/5 transition-all"
          >
            <ArrowUpDown size={14} className="text-cyan-500" />
            {sortOrder === 'desc' ? 'MAIS RECENTES' : 'MAIS ANTIGAS'}
          </button>
        </div>
      </div>

      <div className="px-8 lg:px-12">
        {ofertasFiltradas.length > 0 ? (
          <OfertasList
            ofertas={ofertasFiltradas}
            onViewOferta={(o) => {
              const nicho = nichos.find(n => n.id === o.nichoId);
              if (nicho?.slug) router.push(`/oferta/${nicho.slug}/${o.id}`);
            }}
            getNichoName={(id) => nichos.find(n => n.id === id)?.nome || 'NICHO'}
          />
        ) : (
          <div className="h-[40vh] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] grayscale opacity-40">
            <Globe size={60} className="text-white/10 mb-8" />
            <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Nenhum sinal detectado no período selecionado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
