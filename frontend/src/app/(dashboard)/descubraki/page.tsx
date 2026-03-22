"use client";

import { useState, useEffect } from 'react';
import { useReels } from '@/hooks/useReels';
import { ReelsContainer } from '@/components/features/reels/ReelsContainer';
import { ReelStatsHeader } from '@/components/features/reels/ReelStatsHeader';
import { ParticleSystem } from '@/components/features/reels/ParticleSystem';
import { LoadingMoney } from '@/components/ui/LoadingMoney';
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration';
import clsx from 'clsx';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Descubraki v2.0
// Features: Mastery High-Fidelity, Tactical Discovery Channel,
// Editorial Typography, Industrial Transition Portal.
// ─────────────────────────────────────────────────────────────────

export default function DescubrakiPage() {
  const { reels, loading, error, refresh } = useReels();
  const [showPortal, setShowPortal] = useState(true);
  const [particleTrigger, setParticleTrigger] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPortal(false);
      setParticleTrigger(true);
      setTimeout(() => setParticleTrigger(false), 1000);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-6">
          <LoadingMoney />
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] animate-pulse">Sincronizando Rede de Reels</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black">
        <EmptyStateIllustration
          title="Erro de Protocolo"
          message={error}
          cta="Reiniciar Frequência"
          onCtaClick={refresh}
        />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black">
        <EmptyStateIllustration
          title="Nenhum Sinal Encontrado"
          message="O radar não detectou VSLs ativas no momento. Tente uma nova varredura em instantes."
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-black relative flex flex-col">

      {/* Editorial Breadcrumbs Overlay */}
      <div className="absolute top-8 left-10 z-[40] pointer-events-none">
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
          <span className="hover:text-green-500 transition-colors pointer-events-auto cursor-pointer">Descoberta</span>
          <span className="opacity-30">//</span>
          <span className="text-white/40 italic">Global_Stream</span>
        </div>
      </div>

      {/* Industrial Header Stats */}
      <ReelStatsHeader />

      {/* Transition Matrix Overlay */}
      <AnimatePresence>
        {showPortal && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <div className="relative">
              <div className="w-32 h-32 border border-white/10 rounded-full animate-ping opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[12px] font-black text-green-500 uppercase tracking-[1em] ml-4">INICIANDO</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ParticleSystem trigger={particleTrigger} />

      <main className="flex-1 relative">
        <ReelsContainer />
      </main>

      {/* Tactical Bottom Info */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Deslize para navegar no Fluxo</span>
        </div>
      </div>
    </div>
  );
}
