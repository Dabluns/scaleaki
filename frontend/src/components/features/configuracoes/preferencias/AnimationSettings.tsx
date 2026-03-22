"use client";
import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Sparkles, Check, Box, Cpu, Zap, Activity } from 'lucide-react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium AnimationSettings v5.0
// Design Path: Mastery High-Fidelity / Motion Physics Terminal
// ─────────────────────────────────────────────────────────────────

export default function AnimationSettings() {
  const { settings, setSettings } = useSettings();
  const animationsEnabled = (settings as any)?.animationsEnabled ?? true;
  const cards3DEnabled = (settings as any)?.cards3DEnabled ?? true;

  return (
    <div className="space-y-6">

      {/* Motion Override Node */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <button
          onClick={() => setSettings({ animationsEnabled: !animationsEnabled } as any)}
          className={clsx(
            "p-6 rounded-2xl border transition-all duration-700 flex items-center justify-between group",
            animationsEnabled ? "bg-green-500/10 border-green-500/40" : "bg-white/[0.02] border-white/5 hover:border-white/10"
          )}
        >
          <div className="flex items-center gap-6">
            <div className={clsx(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
              animationsEnabled ? "bg-green-500 text-black shadow-2xl" : "bg-white/5 text-white/40"
            )}>
              <Sparkles size={22} className={animationsEnabled ? "animate-pulse" : ""} />
            </div>
            <div className="text-left space-y-1">
              <span className="text-[13px] font-black text-white uppercase tracking-tighter block italic">SYSTEM_MOTION</span>
              <span className="text-[9px] font-black text-white/10 uppercase tracking-widest block font-mono">GLOBAL_TRANSITIONS</span>
            </div>
          </div>
          <div className={clsx(
            "w-12 h-6 rounded-full border-2 transition-all relative",
            animationsEnabled ? "bg-green-500 border-green-500" : "border-white/10 bg-black/40"
          )}>
            <div className={clsx("absolute top-1 w-3 h-3 rounded-full transition-all", animationsEnabled ? "right-1 bg-black" : "left-1 bg-white/20")} />
          </div>
        </button>

        <button
          onClick={() => setSettings({ cards3DEnabled: !cards3DEnabled } as any)}
          className={clsx(
            "p-6 rounded-2xl border transition-all duration-700 flex items-center justify-between group",
            cards3DEnabled ? "bg-purple-500/10 border-purple-500/40" : "bg-white/[0.02] border-white/5 hover:border-white/10"
          )}
        >
          <div className="flex items-center gap-6">
            <div className={clsx(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
              cards3DEnabled ? "bg-purple-500 text-black shadow-2xl" : "bg-white/5 text-white/40"
            )}>
              <Box size={22} />
            </div>
            <div className="text-left space-y-1">
              <span className="text-[13px] font-black text-white uppercase tracking-tighter block italic">3D_AXIS_FX</span>
              <span className="text-[9px] font-black text-white/10 uppercase tracking-widest block font-mono">CARD_INTERACTION_DEPTH</span>
            </div>
          </div>
          <div className={clsx(
            "w-12 h-6 rounded-full border-2 transition-all relative",
            cards3DEnabled ? "bg-purple-500 border-purple-500" : "border-white/10 bg-black/40"
          )}>
            <div className={clsx("absolute top-1 w-3 h-3 rounded-full transition-all", cards3DEnabled ? "right-1 bg-black" : "left-1 bg-white/20")} />
          </div>
        </button>

      </div>

      {/* Warning / Status Clusters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 p-10 bg-[#080808] border border-white/5 rounded-[3rem] flex items-center gap-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-white/[0.02] flex items-center justify-center text-white/20">
            <Cpu size={32} />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">Performance_Insight</h4>
            <p className="text-[11px] font-bold text-white/20 uppercase italic tracking-widest leading-relaxed">
              {animationsEnabled && cards3DEnabled
                ? "Configuração atual otimizada para o padrão Mastery High-Fidelity. Requer aceleração por GPU."
                : "Modo de compatibilidade ativado. Otimizando para dispositivos de baixo processamento."}
            </p>
          </div>
        </div>

        <div className="md:col-span-4 p-6 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-center gap-4">
          <div className="flex items-center gap-4">
            <div className={clsx("w-2 h-2 rounded-full animate-pulse", animationsEnabled ? "bg-green-500" : "bg-red-500")} />
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">PHYSICS_THREAD</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={clsx("w-2 h-2 rounded-full", cards3DEnabled ? "bg-purple-500" : "bg-white/10")} />
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">WEBGL_SHADERS</span>
          </div>
        </div>
      </div>

    </div>
  );
}
