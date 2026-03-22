"use client";

import { useState, useEffect } from 'react';
import { useOfertaContext } from '@/context/OfertaContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { TrendingUp, Plus, Sparkles, Navigation } from 'lucide-react';
import { CriarOfertaRapida } from '@/components/features/ofertas/CriarOfertaRapida';
import { OfertaCard } from '@/components/features/ofertas/OfertaCard';
import { useNichos } from '@/context/NichoContext';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Dashboard Root Premium v3.0
// Pegada: Immersive Feed, High-Fidelity Cyberpunk, Fluid layout.
// ─────────────────────────────────────────────────────────────────

export default function Home() {
  const { ofertas, removerOferta } = useOfertaContext();
  const { isAdmin } = useAuth();
  const { nichos } = useNichos();
  const [topOfertas, setTopOfertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCriarOferta, setShowCriarOferta] = useState(false);

  const getNichoName = (nichoId: string) => {
    const nicho = Array.isArray(nichos) ? nichos.find(n => n.id === nichoId) : undefined;
    return nicho?.nome || 'Nicho';
  };

  useEffect(() => {
    if (Array.isArray(ofertas)) {
      const ofertasOrdenadas = [...ofertas]
        .sort((a, b) => (Number(b.metricas) || 0) - (Number(a.metricas) || 0))
        .slice(0, 12);
      setTopOfertas(ofertasOrdenadas);
    }
    setLoading(false);
  }, [ofertas]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 blur-3xl animate-pulse" />
          <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin relative z-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-10 pb-20 px-8 lg:px-12 section-glow">

      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500/60">Feed de Inteligência</span>
          </div>
          <h1 className="text-6xl lg:text-7xl font-black text-white leading-[0.9] tracking-tighter uppercase mb-2">
            OFERTAS <span className="text-green-500">QUENTES</span>
          </h1>
          <p className="text-lg text-white/30 font-bold tracking-tight">O pulso do mercado escalado em tempo real.</p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setShowCriarOferta(true)}
            variant="primary"
            className="group px-8 py-4 bg-white text-black hover:bg-green-500 hover:text-white rounded-2xl font-black transition-all flex items-center gap-2 shadow-2xl"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            CADASTRAR SINAL
          </Button>
        )}
      </div>

      {/* Main Feed Grid */}
      {topOfertas.length === 0 ? (
        <div className="h-[40vh] border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center px-10">
          <Navigation className="w-16 h-16 text-white/10 mb-6" />
          <h3 className="text-2xl font-black text-white/40 uppercase mb-2">Radar Vazio</h3>
          <p className="text-white/20 font-medium max-w-xs transition-colors duration-100 dark:hover:text-blue-200">Estamos varrendo o ecossistema em busca de novas oportunidades de escala.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
          {topOfertas.map((oferta, index) => (
            <motion.div
              key={oferta.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <OfertaCard
                oferta={oferta}
                onView={(o) => window.location.href = `/oferta/${o.nichoId}/${o.id}`}
                getNichoName={getNichoName}
                isAdmin={isAdmin}
                onDelete={isAdmin ? async (id) => { await removerOferta(id); } : undefined}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de criação rápida */}
      <AnimatePresence>
        {showCriarOferta && (
          <CriarOfertaRapida
            isOpen={showCriarOferta}
            onClose={() => setShowCriarOferta(false)}
            onSuccess={() => setShowCriarOferta(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Gradient Accent */}
      <div className="fixed bottom-0 right-0 w-[40vw] h-[40vw] bg-green-500/5 blur-[150px] -z-10 rounded-full" />
    </div>
  );
}