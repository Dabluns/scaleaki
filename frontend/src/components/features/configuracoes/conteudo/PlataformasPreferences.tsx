"use client";
import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Globe, Check, Sparkles, Terminal, Activity, Zap, Compass } from 'lucide-react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium PlataformasPreferences v5.0
// Design Path: Mastery High-Fidelity / Platform Relay Matrix
// ─────────────────────────────────────────────────────────────────

const PLATAFORMAS = ['facebook_ads', 'google_ads', 'tiktok_ads', 'instagram_ads', 'linkedin_ads', 'twitter_ads', 'pinterest_ads', 'snapchat_ads'];

export default function PlataformasPreferences() {
  const { settings, setSettings } = useSettings();
  const s: any = settings || {};
  const selected: string[] = Array.isArray(s.preferredPlataformas) ? s.preferredPlataformas : (s.preferredPlataformas ? JSON.parse(s.preferredPlataformas) : []);

  function toggle(p: string) {
    const set = new Set(selected);
    if (set.has(p)) set.delete(p); else set.add(p);
    setSettings({ preferredPlataformas: Array.from(set) } as any);
  }

  function formatPlatformName(name: string): string {
    return name.replace(/_/g, ' ').toUpperCase();
  }

  return (
    <div className="bg-[#0a0a0a]/40 border border-white/5 rounded-3xl p-8 lg:p-10 relative overflow-hidden group">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
        <Globe size={200} />
      </div>

      <div className="relative z-10 flex flex-col gap-12">

        <header className="flex items-center justify-between border-b border-white/5 pb-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">PLATFORM_RELAY</h2>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic font-mono">CHANNEL_ID // HUB-ADS-01</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 px-6 py-2 bg-sky-500/10 border border-sky-500/20 rounded-full">
            <Compass size={14} className="text-sky-500" />
            <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest italic animate-pulse">TRAFFIC_SOURCE_VALIDATED</span>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PLATAFORMAS.map((p) => {
            const checked = selected.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => toggle(p)}
                className={clsx(
                  "p-6 rounded-[2rem] border transition-all duration-700 flex flex-col items-center gap-4 group/item text-center",
                  checked
                    ? "bg-sky-500/10 border-sky-500/40 shadow-[0_20px_40px_rgba(14,165,233,0.1)] scale-[1.05] z-10"
                    : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                )}
              >
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  checked ? "bg-sky-500 text-black shadow-2xl" : "bg-white/5 text-white/20"
                )}>
                  <Globe size={20} />
                </div>
                <span className={clsx(
                  "text-[10px] font-black uppercase tracking-widest transition-colors",
                  checked ? "text-white" : "text-white/20 group-hover/item:text-white/40"
                )}>
                  {formatPlatformName(p)}
                </span>

                {checked && (
                  <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-white/10 ml-4 pt-4 border-t border-white/5">
          <Terminal size={12} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] italic font-mono">LINK_STATUS: {selected.length} FONTES ATIVAS</span>
        </div>

      </div>
    </div>
  );
}
