"use client";

import { TrendingUp, Heart, Plus, Zap, Sparkles, Navigation } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Card3D } from '@/components/ui/Card3D';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium AcoesRapidas v2.1
// Hotfix: Typography scaling and responsive grid safety.
// ─────────────────────────────────────────────────────────────────

export function AcoesRapidas() {
  const { isAdmin } = useAuth();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-[2px] w-12 bg-green-500 rounded-full hidden sm:block" />
        <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tighter uppercase">
          Comandos <span className="text-green-500">Diretos</span>
        </h2>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
      >

        {/* Criar Oferta (Admin) */}
        {isAdmin && (
          <motion.div variants={itemAnim}>
            <Link href="/criar-oferta" className="block">
              <Card3D
                variant="glass"
                has3DRotation={true}
                animatedBorder={true}
                className="group relative h-full flex flex-col justify-between p-6 bg-green-500/5 hover:bg-green-500/10 transition-colors border-white/5 overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] group-hover:scale-110 transition-transform flex-shrink-0">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <Zap className="w-4 h-4 text-green-500/40" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block truncate">
                    Operação Admin
                  </span>
                  <h3 className="text-xl lg:text-2xl font-black text-white tracking-tighter truncate">
                    NOVA OFERTA
                  </h3>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Navigation className="w-4 h-4 text-green-500 rotate-45" />
                </div>
              </Card3D>
            </Link>
          </motion.div>
        )}

        {/* Ofertas Populares */}
        <motion.div variants={itemAnim}>
          <Link href="/ofertas?sort=popular" className="block">
            <Card3D
              variant="glass"
              has3DRotation={true}
              glow={true}
              className="group relative h-full flex flex-col justify-between p-6 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors border-white/5 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:scale-110 transition-transform flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <Sparkles className="w-4 h-4 text-cyan-500/40" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block truncate">
                  Tendências
                </span>
                <h3 className="text-xl lg:text-2xl font-black text-white tracking-tighter truncate">
                  TOP ESCALADAS
                </h3>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Navigation className="w-4 h-4 text-cyan-500 rotate-45" />
              </div>
            </Card3D>
          </Link>
        </motion.div>

        {/* Favoritos */}
        <motion.div variants={itemAnim}>
          <Link href="/favoritos" className="block">
            <Card3D
              variant="glass"
              has3DRotation={true}
              className="group relative h-full flex flex-col justify-between p-6 bg-pink-500/5 hover:bg-pink-500/10 transition-colors border-white/5 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.4)] group-hover:scale-110 transition-transform flex-shrink-0">
                  <Heart className="w-6 h-6 text-white fill-white/20" />
                </div>
                <Plus className="w-4 h-4 text-pink-500/40" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block truncate">
                  Curadoria
                </span>
                <h3 className="text-xl lg:text-2xl font-black text-white tracking-tighter truncate">
                  MEUS FAVORITOS
                </h3>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Navigation className="w-4 h-4 text-pink-500 rotate-45" />
              </div>
            </Card3D>
          </Link>
        </motion.div>

        {/* Dash de Análise */}
        <motion.div variants={itemAnim}>
          <Link href="/analytics" className="block">
            <Card3D
              variant="glass"
              has3DRotation={true}
              className="group relative h-full flex flex-col justify-between p-6 bg-purple-500/5 hover:bg-purple-500/10 transition-colors border-white/5 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:scale-110 transition-transform flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-purple-500/40" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block truncate">
                  Performance
                </span>
                <h3 className="text-xl lg:text-2xl font-black text-white tracking-tighter truncate">
                  CENTRAL MÉTRICA
                </h3>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Navigation className="w-4 h-4 text-purple-500 rotate-45" />
              </div>
            </Card3D>
          </Link>
        </motion.div>

      </motion.div>
    </div>
  );
}