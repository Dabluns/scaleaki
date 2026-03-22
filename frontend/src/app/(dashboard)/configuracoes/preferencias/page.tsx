"use client";

import React, { useState, useEffect } from 'react';
import AppearanceSettings from '@/components/features/configuracoes/preferencias/AppearanceSettings';
import DashboardPreferences from '@/components/features/configuracoes/preferencias/DashboardPreferences';
import AnimationSettings from '@/components/features/configuracoes/preferencias/AnimationSettings';
import SavePreferencesBar from '@/components/features/configuracoes/preferencias/SavePreferencesBar';
import { Card3D } from '@/components/ui/Card3D';
import {
  Settings,
  Eye,
  Layout,
  Sparkles,
  Sliders,
  Terminal,
  Cpu,
  Zap,
  Layers,
  Monitor,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium Preferências Page v5.0
// Design Path: Mastery High-Fidelity / User Experience Control
// ─────────────────────────────────────────────────────────────────

export default function PreferenciasPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-32 overflow-x-hidden">

      {/* Editorial Preferences Header */}
      <div className="relative pt-16 pb-12 px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Decorative Background HUD */}
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
          <Sliders size={600} className="rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-16 border-b border-white/5 pb-16">
          <div className="space-y-10 flex-1">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4 px-6 py-2.5 rounded-full bg-white/5 border border-white/5 text-white/40 font-black text-[10px] uppercase tracking-[0.4em] italic">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                UX_OVERRIDE // SYSTEM_PREFS
              </div>
              <div className="flex items-center gap-3 border-l border-white/5 pl-6">
                <Monitor size={14} className="text-white/20" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest font-mono">DPI_SYNC: ENABLED</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
                INTERFACE<br />
                <span className="text-blue-500">CONTROL</span>
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 pt-6">
                <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.3em] italic max-w-md">
                  Calibração avançada de densidade visual, comportamento de animação e resposta tátil da plataforma.
                </p>
                <div className="hidden sm:block w-px h-10 bg-white/10" />
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-black text-blue-500/40 uppercase tracking-widest font-mono">UX_VERSION</span>
                  <span className="text-[14px] font-black text-white uppercase tracking-tighter italic font-mono">ULTRA_HD_V5.1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preference Status HUD */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[
              { label: 'Efeitos_Visuais', value: 'ULTRA', icon: Sparkles, color: 'text-pink-500' },
              { label: 'Layout_Density', value: 'HIGH', icon: Layout, color: 'text-green-500' },
              { label: 'Cloud_Sync', value: 'SYNCED', icon: Zap, color: 'text-yellow-500' }
            ].map((item, i) => (
              <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <Activity size={14} className="text-white/10" />
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

      {/* Preferences Grid Area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

        <div className="lg:col-span-8 flex flex-col gap-12">

          {/* Aparência Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0a0a]/40 border border-white/5 rounded-3xl p-8 lg:p-10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
              <Eye size={200} />
            </div>
            <div className="relative z-10 flex flex-col gap-10">
              <header className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">VISUAL_DENSITY</h2>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic font-mono">CONTROL_ID // EY-99X</p>
                </div>
                <Layers className="text-blue-500/40" size={24} />
              </header>
              <AppearanceSettings />
            </div>
          </motion.div>

          {/* Dashboard Preferences Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0a0a]/40 border border-white/5 rounded-3xl p-8 lg:p-10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
              <Layout size={200} />
            </div>
            <div className="relative z-10 flex flex-col gap-10">
              <header className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">WORKSPACE_LAYOUT</h2>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic font-mono">STRUCTURE_ID // WK-44Y</p>
                </div>
                <Terminal className="text-green-500/40" size={24} />
              </header>
              <DashboardPreferences />
            </div>
          </motion.div>

          {/* Animações Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0a0a]/40 border border-white/5 rounded-3xl p-8 lg:p-10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
              <Sparkles size={200} />
            </div>
            <div className="relative z-10 flex flex-col gap-10">
              <header className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">MOTION_DYNAMICS</h2>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic font-mono">PHYSICS_ID // MD-11Z</p>
                </div>
                <Zap className="text-pink-500/40" size={24} />
              </header>
              <AnimationSettings />
            </div>
          </motion.div>

        </div>

        {/* Sidebar Controls (Action Hub) */}
        <div className="lg:col-span-4 flex flex-col gap-10">

          <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-8">
              <Cpu size={14} className="text-white/20" />
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">PROCESSING_SUBSYSTEM</span>
            </div>

            <div className="space-y-8">
              <p className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Global Control</p>
              <p className="text-[11px] font-bold text-white/20 uppercase tracking-tight italic leading-relaxed">
                As alterações feitas aqui afetam globalmente o comportamento visual e interativo da plataforma em todos os seus clusters.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest font-mono">AUTO_SAVE: ENABLED</span>
                </div>
                <div className="flex items-center gap-3 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest font-mono">RENDER_MODE: GPU_ACCEL</span>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-white/5">
              <SavePreferencesBar />
            </div>
          </div>

          {/* Quick Calibration Banner */}
          <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-3xl space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Monitor size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Tuning Expert</h4>
              <p className="text-[10px] font-bold text-white/20 uppercase italic tracking-widest leading-relaxed">Sua configuração atual otimiza o consumo de VRAM e resposta de latência do dashboard.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
