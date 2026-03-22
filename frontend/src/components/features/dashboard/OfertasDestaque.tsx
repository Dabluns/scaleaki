"use client";

import { LoadingGraph } from '@/components/ui/LoadingGraph';
import { ArrowRight, Sparkles, Navigation } from 'lucide-react';
import Link from 'next/link';
import { useOfertaContext } from '@/context/OfertaContext';
import { useEffect } from 'react';
import { OfertaCard } from '@/components/features/ofertas/OfertaCard';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium OfertasDestaque v2.1 (Hotfix)
// Fixes: Header scaling and layout consistency.
// ─────────────────────────────────────────────────────────────────

export function OfertasDestaque() {
  const { dashboardData, dashboardLoading, fetchDashboardData } = useOfertaContext();

  useEffect(() => {
    if (!dashboardData) fetchDashboardData();
  }, [dashboardData, fetchDashboardData]);

  if (dashboardLoading) {
    return <LoadingGraph message="Sincronizando tendências de mercado..." />;
  }

  const ofertasDestaque = dashboardData?.ofertasDestaque || [];

  return (
    <div className="relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500/60 whitespace-nowrap">Top Conversão</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tighter uppercase break-words">
            MAIS <span className="text-green-500">ACESSADAS</span>
          </h2>
        </div>

        <Link
          href="/ofertas"
          className="group flex items-center gap-3 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all flex-shrink-0"
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white">Ver Ecossistema</span>
          <ArrowRight className="w-4 h-4 text-green-500 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid Section */}
      {ofertasDestaque.length === 0 ? (
        <div className="p-16 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center grayscale opacity-50">
          <Navigation className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest text-white/20">Aguardando Sinais de Escala</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {ofertasDestaque.map((oferta, index) => (
            <div key={oferta.id} className="relative group pt-4">
              {/* Position Indicator */}
              <div className="absolute top-0 left-0 z-40">
                <div className="relative flex items-center justify-center w-12 h-12">
                  <div className="absolute inset-0 bg-green-500/20 blur-lg rounded-full" />
                  <div className="relative w-full h-full rounded-2xl bg-black border border-green-500/40 flex items-center justify-center shadow-2xl">
                    <span className="text-lg font-black text-green-500">0{index + 1}</span>
                  </div>
                </div>
              </div>

              <OfertaCard
                oferta={oferta}
                onView={(o) => window.location.href = `/oferta/${o.nichoId}/${o.id}`}
                getNichoName={() => oferta.nicho?.nome || 'Mercado'}
                isAdmin={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}