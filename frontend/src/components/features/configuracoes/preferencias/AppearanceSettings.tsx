"use client";
import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Check, Columns, Maximize2, Minimize2, Type, Activity } from 'lucide-react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium AppearanceSettings v5.0
// Design Path: Mastery High-Fidelity / Visual Density Node
// ─────────────────────────────────────────────────────────────────

export default function AppearanceSettings() {
  const { settings, setSettings } = useSettings();
  const density = (settings?.density as string) || 'comfortable';
  const fontSize = (settings?.fontSize as string) || 'medium';

  const densityOptions = [
    { key: 'compact', label: 'COMPACT', desc: 'DATA_FOCUS', icon: Minimize2 },
    { key: 'comfortable', label: 'DEFAULT', desc: 'OP_BALANCE', icon: Columns },
    { key: 'spacious', label: 'EXPANDED', desc: 'HI_VISUAL', icon: Maximize2 },
  ];

  const fontSizeOptions = [
    { key: 'small', label: 'SMALL', size: '14px' },
    { key: 'medium', label: 'NORMAL', size: '16px' },
    { key: 'large', label: 'LARGE', size: '18px' },
    { key: 'xlarge', label: 'ELITE', size: '20px' },
  ];

  return (
    <div className="space-y-12">

      {/* Density Matrix */}
      <div className="space-y-6">
        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3">
          <Activity size={11} className="text-blue-500/40" />
          DENSITY_ENGINE // GRID_SCALE
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {densityOptions.map((opt) => {
            const isSelected = density === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSettings({ density: opt.key })}
                className={clsx(
                  "relative p-6 rounded-2xl border transition-all duration-700 text-left space-y-3 group/opt overflow-hidden",
                  isSelected
                    ? "bg-blue-500/10 border-blue-500/40 shadow-[0_20px_40px_rgba(59,130,246,0.1)]"
                    : "bg-[#080808] border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                    isSelected ? "bg-blue-500 text-black shadow-2xl scale-110" : "bg-white/5 text-white/40 group-hover/opt:text-white"
                  )}>
                    <opt.icon size={18} />
                  </div>
                  {isSelected && <Check size={16} className="text-blue-500 animate-pulse" />}
                </div>
                <div className="relative z-10">
                  <div className={clsx("text-[12px] font-black uppercase tracking-widest", isSelected ? "text-white" : "text-white/40")}>{opt.label}</div>
                  <div className="text-[10px] font-bold text-white/10 uppercase italic font-mono">{opt.desc}</div>
                </div>
                {/* Background Glitch Effect for selected */}
                {isSelected && <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Scale Hub */}
      <div className="space-y-6">
        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3">
          <Type size={11} className="text-indigo-500/40" />
          TYPOGRAPHY_NODE // FONT_DYNAMICS
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {fontSizeOptions.map((opt) => {
            const isSelected = fontSize === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSettings({ fontSize: opt.key })}
                className={clsx(
                  "relative p-6 rounded-2xl border transition-all duration-700 text-center space-y-2 group/font overflow-hidden",
                  isSelected
                    ? "bg-indigo-500/10 border-indigo-500/40 shadow-[0_20px_40px_rgba(99,102,241,0.1)]"
                    : "bg-[#080808] border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                )}
              >
                <div className={clsx(
                  "font-black uppercase tracking-tighter italic transition-all duration-700",
                  isSelected ? "text-white" : "text-white/20"
                )} style={{ fontSize: opt.size }}>
                  {opt.label}
                </div>
                <div className="text-[9px] font-bold text-white/10 uppercase tracking-widest font-mono italic">{opt.size}</div>
                {isSelected && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
