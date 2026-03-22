"use client";

import React, { useState, useEffect } from 'react';
import NichosPreferences from '@/components/features/configuracoes/conteudo/NichosPreferences';
import PlataformasPreferences from '@/components/features/configuracoes/conteudo/PlataformasPreferences';
import DefaultFilters from '@/components/features/configuracoes/conteudo/DefaultFilters';
import RecommendationSettings from '@/components/features/configuracoes/conteudo/RecommendationSettings';
import SavePreferencesBar from '@/components/features/configuracoes/preferencias/SavePreferencesBar';
import {
  FileText,
  Target,
  Layers,
  Filter,
  Terminal,
  Cpu,
  Zap,
  Activity,
  Globe,
  BrainCircuit
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium Conteúdo Page v5.0
// Design Path: Mastery High-Fidelity / Asset Discovery Matrix
// ─────────────────────────────────────────────────────────────────

export default function ConteudoSettingsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-32 overflow-x-hidden">

      {/* Editorial Content Header */}
      <div className="relative pt-16 pb-12 px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Decorative Background HUD */}
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
          <Layers size={600} className="rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-16 border-b border-white/5 pb-16">
          <div className="space-y-10 flex-1">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4 px-6 py-2.5 rounded-full bg-white/5 border border-white/5 text-white/40 font-black text-[10px] uppercase tracking-[0.4em] italic">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                ASSET_DISCOVERY // CONTENT_ARCH
              </div>
              <div className="flex items-center gap-3 border-l border-white/5 pl-6">
                <Target size={14} className="text-white/20" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest font-mono">NICHE_MAPPING: ACTIVE</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
                CONTENT<br />
                <span className="text-teal-500">MATRIX</span>
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 pt-6">
                <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.3em] italic max-w-md">
                  Calibração estratégica de nichos, vetores de plataforma e algoritmos de recomendação de alta precisão.
                </p>
                <div className="hidden sm:block w-px h-10 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-teal-500/40 uppercase tracking-widest font-mono">DISCOVERY_RANGE</span>
                  <span className="text-[14px] font-black text-white uppercase tracking-tighter italic font-mono">GLOBAL_FEDERATED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Stats HUD */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[
              { label: 'Active_Niches', value: '12_UNITS', icon: Target, color: 'text-teal-500' },
              { label: 'Platform_Relay', value: '8_PORTS', icon: Globe, color: 'text-cyan-500' },
              { label: 'AI_Confidence', value: '98%', icon: BrainCircuit, color: 'text-blue-500' }
            ].map((item, i) => (
              <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <Activity size={14} className="text-white/10 opacity-20" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block">{item.label}</span>
                  <span className="text-xl font-black text-white italic uppercase tracking-tighter block">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Grid Area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

        <div className="lg:col-span-8 flex flex-col gap-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <NichosPreferences />
            <PlataformasPreferences />
            <DefaultFilters />
            <RecommendationSettings />
          </motion.div>
        </div>

        {/* Sidebar Controls (Content Strategy) */}
        <div className="lg:col-span-4 space-y-10">

          <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-8 group">
            <div className="flex items-center gap-3 border-b border-white/5 pb-8">
              <Cpu size={14} className="text-white/20" />
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">CONTENT_ENGINE</span>
            </div>

            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Discovery_Logic</h3>
                <p className="text-[12px] font-bold text-white/20 uppercase tracking-tight italic leading-relaxed">
                  Refine o throughput de ativos filtrando apenas nichos de alta performance e plataformas com ROI validado.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl group/item">
                  <div className="flex items-center gap-4">
                    <Filter size={14} className="text-white/20" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover/item:text-white transition-colors">Filtros Ativos</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                </div>
                <div className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl group/item">
                  <div className="flex items-center gap-4">
                    <BrainCircuit size={14} className="text-white/20" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover/item:text-white transition-colors">IA Discovery</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-white/5">
              <SavePreferencesBar />
            </div>
          </div>

          {/* Target Optimization Banner */}
          <div className="p-8 bg-teal-500/5 border border-teal-500/20 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-teal-500">
              <Target size={100} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-teal-500/40 uppercase tracking-widest italic">Niche_Precision</span>
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">DATA_FLOW_OPTIMIZED</h3>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 w-[92%] shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
              </div>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block text-right font-mono italic">PRECISION_CORE: 99.2%</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
