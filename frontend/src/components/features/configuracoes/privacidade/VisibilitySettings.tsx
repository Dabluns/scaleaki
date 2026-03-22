"use client";
import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Eye, EyeOff, Terminal, Activity, ShieldCheck, Users, Share2 } from 'lucide-react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium VisibilitySettings v5.0
// Design Path: Mastery High-Fidelity / Stealth Node Configuration
// ─────────────────────────────────────────────────────────────────

export default function VisibilitySettings() {
  const { settings, setSettings } = useSettings();
  const s: any = settings || {};

  const visibilityItems = [
    { key: 'profilePublic', label: 'Public Profile', desc: 'Permite visibilidade externa do node.', icon: Users, color: 'text-violet-500' },
    { key: 'showActivities', label: 'Activity Stream', desc: 'Exibe telemetria de ações recentes.', icon: Activity, color: 'text-indigo-500' },
    { key: 'shareStats', label: 'Stats Sharing', desc: 'Agregação anônima de dados métricos.', icon: Share2, color: 'text-fuchsia-500' },
  ];

  return (
    <div className="bg-[#0a0a0a]/40 border border-white/5 rounded-3xl p-8 lg:p-10 relative overflow-hidden group">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
        <Eye size={200} />
      </div>

      <div className="relative z-10 flex flex-col gap-12">

        <header className="flex items-center justify-between border-b border-white/5 pb-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">STEALTH_PROTOCOL</h2>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic font-mono">CHANNEL_ID // VIS-NODE-01</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 px-6 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full">
            <ShieldCheck size={14} className="text-violet-500" />
            <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest italic">VISIBILITY_CONTROL</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibilityItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setSettings({ [item.key]: !s[item.key] } as any)}
              className={clsx(
                "p-6 rounded-2xl border transition-all duration-700 flex flex-col items-start gap-5 group/item",
                s[item.key] ? "bg-white/[0.04] border-white/10" : "bg-white/[0.01] border-white/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:border-white/10"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  s[item.key] ? `${item.color} bg-white/5 shadow-2xl scale-110` : "bg-white/5 text-white/10"
                )}>
                  <item.icon size={20} />
                </div>
                <div className={clsx(
                  "w-1.5 h-1.5 rounded-full transition-all duration-700",
                  s[item.key] ? "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]" : "bg-white/5"
                )} />
              </div>
              <div className="text-left space-y-1">
                <span className="text-[14px] font-black text-white uppercase tracking-tighter italic block">{item.label}</span>
                <span className="text-[9px] font-black text-white/10 uppercase tracking-widest font-mono block leading-relaxed">{item.desc}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-white/10 ml-4 pt-4">
          <Terminal size={12} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">MODO_ATUAL: {s.profilePublic ? 'OVERSIGHT_ENABLE' : 'STEALTH_ACTIVE'}</span>
        </div>

      </div>
    </div>
  );
}
