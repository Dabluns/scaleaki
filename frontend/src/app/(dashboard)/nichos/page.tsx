"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNichos } from '@/context/NichoContext';
import { useAuth } from '@/context/AuthContext';
import { NichosManager } from '@/components/admin/NichosManager';
import { Card3D } from '@/components/ui/Card3D';
import {
  Search,
  Zap,
  Globe,
  Navigation,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Heart,
  DollarSign,
  Sparkles,
  BookOpen,
  Home,
  Car,
  Gamepad2,
  Music,
  Camera,
  Utensils,
  Dumbbell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import * as LucideIcons from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium NichosPage v3.0
// Features: Mastery High-Fidelity, Industrial Technical Hub,
// Editorial Typography, Monospace Meta-Data HUD.
// ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, any> = {
  'DollarSign': DollarSign,
  'Heart': Heart,
  'Sparkles': Sparkles,
  'BookOpen': BookOpen,
  'Cpu': Cpu,
  'Home': Home,
  'Car': Car,
  'Gamepad2': Gamepad2,
  'Music': Music,
  'Camera': Camera,
  'Utensils': Utensils,
  'Dumbbell': Dumbbell,
  'TrendingUp': TrendingUp,
  'Activity': Activity,
  'Layers': Layers,
  'Navigation': Navigation
};

export default function NichosPage() {
  const router = useRouter();
  const { nichos, loading, erro } = useNichos();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNichos = nichos.filter(nicho =>
    nicho.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nicho.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (nicho.descricao && nicho.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-green-500/20 blur-[80px] animate-pulse" />
          <div className="w-24 h-[1px] bg-green-500/50 mb-8 animate-width-pulse" />
        </div>
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.8em] animate-pulse">Sincronizando Ecossistema</span>
      </div>
    );
  }

  if (isAdmin) {
    return <NichosManager />;
  }

  return (
    <div className="relative pt-16 pb-32 px-8 lg:px-16 max-w-[1800px] mx-auto">

      {/* Editorial Header Hub */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-24 gap-16 border-b border-white/5 pb-16">
        <div className="flex-1 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-2 h-12 bg-green-500 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Node_Intelligence_Center</span>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Protocolo de Varredura Continental</span>
            </div>
          </div>

          <h1 className="text-7xl md:text-8xl xl:text-9xl font-black text-white leading-[0.8] tracking-tighter uppercase italic drop-shadow-2xl">
            NICHOS <br />
            <span className="text-green-500">MESTRES</span>
          </h1>

          <div className="max-w-xl">
            <p className="text-xl text-white/40 font-bold leading-tight uppercase tracking-tight italic">
              Explore os mercados de maior densidade e liquidez da rede.
              Identifique fluxos de escala antes da saturação global.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-10 min-w-[340px]">
          {/* HUD Stats Quick Look */}
          <div className="grid grid-cols-2 gap-6 border-b border-white/5 pb-8">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Ativos_Network</span>
              <span className="text-2xl font-black text-white italic">{nichos.length.toString().padStart(2, '0')} <span className="text-[10px] not-italic opacity-30">SEGMENTOS</span></span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Frequência_Sinal</span>
              <span className="text-2xl font-black text-green-500 italic">ALTA <span className="text-[10px] not-italic opacity-30">ESTABILIDADE</span></span>
            </div>
          </div>

          {/* Tactical Search Field */}
          <div className="relative group">
            <div className="absolute -inset-2 bg-green-500/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-green-500 transition-colors" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="BUSCAR NÓ DE MERCADO..."
              className="w-full pl-16 pr-8 py-6 bg-white/[0.02] border border-white/10 rounded-3xl text-[12px] font-black text-white placeholder:text-white/10 outline-none focus:border-green-500/50 transition-all uppercase tracking-[0.2em] italic"
            />
          </div>
        </div>
      </div>

      {erro && (
        <div className="mb-16 p-8 rounded-3xl border border-red-500/20 bg-red-500/[0.02] flex items-center gap-4">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Erro no Protocolo de Busca: {erro}</span>
        </div>
      )}

      {/* Grid de Alta Performance */}
      <AnimatePresence mode="popLayout">
        {filteredNichos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="h-[50vh] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[4rem]"
          >
            <Layers className="w-20 h-20 text-white/5 mb-8" />
            <h2 className="text-[12px] font-black text-white/20 uppercase tracking-[0.8em]">Radar_Vazio</h2>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 lg:gap-16">
            {filteredNichos.map((nicho, idx) => {
              const IconComp = ICON_MAP[nicho.icone] || LucideIcons[nicho.icone as keyof typeof LucideIcons] || Globe;

              return (
                <motion.div
                  key={nicho.id || idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  layout
                >
                  <Card3D
                    variant="glass"
                    has3DRotation
                    className="group relative h-full flex flex-col p-12 bg-[#080808] border-white/5 rounded-[3.5rem] overflow-hidden hover:border-green-500/20 transition-all duration-500"
                  >
                    {/* Background Noise & Detail */}
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                      <Navigation size={180} className="rotate-45" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                      {/* Header Card */}
                      <div className="flex justify-between items-start mb-16">
                        <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/10 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-black group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl">
                          <IconComp size={40} strokeWidth={1.5} />
                        </div>

                        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                          <span className="text-[9px] font-black text-white uppercase tracking-widest">NETWORK_ACTIVE</span>
                        </div>
                      </div>

                      {/* Body Card */}
                      <div className="flex-1 space-y-6">
                        <h3 className="text-5xl font-black text-white uppercase tracking-tighter leading-[0.8] italic group-hover:text-green-500 transition-colors">
                          {nicho.nome}
                        </h3>
                        <div className="text-[10px] font-mono text-white/10 uppercase tracking-widest mb-6">
                          UUID::{nicho.id?.slice(0, 12) || nicho.slug}
                        </div>
                        <p className="text-lg text-white/30 font-bold leading-relaxed line-clamp-3 uppercase tracking-tight italic">
                          {nicho.descricao || 'ESTRUTURA DE MERCADO COM ALTA DENSIDADE DE CONVERSÃO E ESCALABILIDADE GLOBAL VALIDADA.'}
                        </p>
                      </div>

                      {/* Footer Card Status */}
                      <div className="pt-10 mt-10 border-t border-white/5 flex items-center justify-between">
                        <div className="flex gap-10">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black text-white/15 uppercase tracking-widest">Status</span>
                            <div className="flex items-center gap-2">
                              <Zap size={12} className="text-yellow-500" />
                              <span className="text-sm font-black text-white italic uppercase tracking-tighter">PREDIÇÃO_ALTA</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 text-right">
                            <span className="text-[9px] font-black text-white/15 uppercase tracking-widest">Alcance</span>
                            <div className="flex items-center gap-2">
                              <Globe size={12} className="text-cyan-500" />
                              <span className="text-sm font-black text-white italic uppercase tracking-tighter">GLOBAL</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => router.push(`/oferta/${nicho.slug}`)}
                          className="w-16 h-16 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:bg-green-500 text-white/20 hover:text-black flex items-center justify-center transition-all group-hover:scale-105"
                        >
                          <ArrowUpRight size={28} />
                        </button>
                      </div>
                    </div>
                  </Card3D>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
         @keyframes width-pulse {
            0%, 100% { width: 40px; }
            50% { width: 120px; }
         }
         .animate-width-pulse { animation: width-pulse 2s infinite ease-in-out; }
      `}</style>
    </div>
  );
}