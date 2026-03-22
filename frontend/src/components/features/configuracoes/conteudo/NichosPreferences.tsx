"use client";
import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useNichos } from '@/context/NichoContext';
import { Tag, Check, Sparkles, Terminal, Activity, Zap, Target } from 'lucide-react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium NichosPreferences v5.0
// Design Path: Mastery High-Fidelity / Niche Mapping Matrix
// ─────────────────────────────────────────────────────────────────

export default function NichosPreferences() {
  const { settings, setSettings } = useSettings();
  const { nichos } = useNichos();
  const s: any = settings || {};
  const selected: string[] = Array.isArray(s.favoriteNichos) ? s.favoriteNichos : (s.favoriteNichos ? JSON.parse(s.favoriteNichos) : []);

  function toggle(id: string) {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id); else set.add(id);
    setSettings({ favoriteNichos: Array.from(set) } as any);
  }

  return (
    <div className="bg-[#0a0a0a]/40 border border-white/5 rounded-3xl p-8 lg:p-10 relative overflow-hidden group">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
        <Target size={200} />
      </div>

      <div className="relative z-10 flex flex-col gap-12">

        <header className="flex items-center justify-between border-b border-white/5 pb-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">NICHE_MAPPING</h2>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic font-mono">CHANNEL_ID // SECTOR-GRID-01</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 px-6 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <Activity size={14} className="text-orange-500" />
            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest italic animate-pulse">MAP_ENGINE_SYNCED</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nichos.map((n) => {
            const checked = selected.includes(n.id);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => toggle(n.id)}
                className={clsx(
                  "p-6 rounded-[2rem] border transition-all duration-700 flex items-center justify-between group/item",
                  checked
                    ? "bg-orange-500/10 border-orange-500/40 shadow-[0_20px_40px_rgba(249,115,22,0.1)] scale-[1.05] z-10"
                    : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                    checked ? "bg-orange-500 text-black shadow-2xl" : "bg-white/5 text-white/20"
                  )}>
                    <Tag size={14} />
                  </div>
                  <span className={clsx(
                    "text-[12px] font-black uppercase tracking-widest italic transition-colors",
                    checked ? "text-white" : "text-white/20 group-hover/item:text-white/40"
                  )}>
                    {n.nome}
                  </span>
                </div>

                {checked && (
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-white/10 ml-4 pt-4 border-t border-white/5">
          <Terminal size={12} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] italic font-mono">DADOS_CARREGADOS: {nichos.length} SETORES DISPONÍVEIS</span>
        </div>

      </div>
    </div>
  );
}
