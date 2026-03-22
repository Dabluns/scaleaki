"use client";
import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Grid3x3, List, LayoutGrid, Check, RefreshCw, Terminal, Layers, Database, Timer } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium DashboardPreferences v5.0
// Design Path: Mastery High-Fidelity / Operational Layout Node
// ─────────────────────────────────────────────────────────────────

export default function DashboardPreferences() {
  const { settings, setSettings } = useSettings();
  const layout = (settings as any)?.defaultLayout || 'grid';
  const itemsPerPage = (settings as any)?.itemsPerPage || 25;
  const defaultSort = (settings as any)?.defaultSort || 'createdAt';
  const showMetricsOnCard = (settings as any)?.showMetricsOnCard ?? true;
  const autoRefresh = (settings as any)?.autoRefresh ?? false;
  const refreshInterval = (settings as any)?.refreshInterval ?? 300;

  const layoutOptions = [
    { key: 'grid', label: 'GRID_MATRIX', icon: Grid3x3, desc: 'ESTRUTURA_AXIAL' },
    { key: 'list', label: 'LINEAR_STACK', icon: List, desc: 'STREAM_SEQUENCIAL' },
    { key: 'compact', label: 'MINIMAL_NODE', icon: LayoutGrid, desc: 'DENSIDADE_MÁXIMA' },
  ];

  return (
    <div className="space-y-12">

      {/* Layout Selection Shell */}
      <div className="space-y-6">
        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3">
          <Terminal size={11} className="text-green-500/40" />
          LAYOUT_ARCH // FRAMEWORK_SELECT
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {layoutOptions.map((opt) => {
            const isSelected = layout === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSettings({ defaultLayout: opt.key } as any)}
                className={clsx(
                  "relative p-6 rounded-2xl border transition-all duration-700 text-left space-y-4 group/opt overflow-hidden",
                  isSelected
                    ? "bg-green-500/10 border-green-500/40 shadow-[0_20px_40px_rgba(34,197,94,0.1)]"
                    : "bg-[#080808] border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                    isSelected ? "bg-green-500 text-black shadow-2xl scale-110" : "bg-white/5 text-white/40 group-hover/opt:text-white"
                  )}>
                    <opt.icon size={22} />
                  </div>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />}
                </div>
                <div className="relative z-10 space-y-1">
                  <div className={clsx("text-sm font-black uppercase tracking-[0.1em]", isSelected ? "text-white" : "text-white/40")}>{opt.label}</div>
                  <div className="text-[9px] font-bold text-white/10 uppercase italic font-mono">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Config Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3">
            <Layers size={11} className="text-emerald-500/40" />
            STREAM_CAPACITY // ITEMS_PER_PAGE
          </label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-green-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
            <input
              type="number"
              value={itemsPerPage}
              min={10} max={100}
              onChange={(e) => setSettings({ itemsPerPage: Number(e.target.value) } as any)}
              className="relative w-full px-8 py-6 bg-[#080808] border border-white/5 rounded-2xl text-[14px] font-black text-white outline-none focus:border-green-500/40 transition-all font-mono italic"
            />
          </div>
        </div>

        <div className="space-y-6">
          <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3">
            <Database size={11} className="text-teal-500/40" />
            SORT_PROTOCOL // DEFAULT_ORDER
          </label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-green-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
            <select
              value={defaultSort}
              onChange={(e) => setSettings({ defaultSort: e.target.value } as any)}
              className="relative w-full px-8 py-6 bg-[#080808] border border-white/5 rounded-2xl text-[14px] font-black text-white outline-none focus:border-green-500/40 transition-all uppercase tracking-widest italic appearance-none"
            >
              <option value="createdAt">RECENT_ENTRIES</option>
              <option value="roi">ROI_MAX_EFFICIENCY</option>
              <option value="ctr">CTR_CLICK_STREAM</option>
              <option value="receita">REVENUE_ALGORITHM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Toggles & Refresh Nodes */}
      <div className="space-y-6 pt-12 border-t border-white/5">
        <div className="flex flex-col sm:flex-row gap-6">
          <button
            onClick={() => setSettings({ showMetricsOnCard: !showMetricsOnCard } as any)}
            className={clsx(
              "flex-1 p-6 rounded-2xl border transition-all duration-700 flex items-center justify-between group",
              showMetricsOnCard ? "bg-green-500/10 border-green-500/40" : "bg-white/[0.02] border-white/5 hover:border-white/10"
            )}
          >
            <div className="flex items-center gap-6">
              <div className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                showMetricsOnCard ? "bg-green-500 text-black shadow-2xl" : "bg-white/5 text-white/40"
              )}>
                <LayoutGrid size={22} />
              </div>
              <div className="text-left space-y-1">
                <span className="text-[13px] font-black text-white uppercase tracking-tighter block italic">METRICS_OVERLAY</span>
                <span className="text-[9px] font-black text-white/10 uppercase tracking-widest block font-mono">RENDER_STATS_ON_CARDS</span>
              </div>
            </div>
            <div className={clsx(
              "w-12 h-6 rounded-full border-2 transition-all relative",
              showMetricsOnCard ? "bg-green-500 border-green-500" : "border-white/10 bg-black/40"
            )}>
              <div className={clsx("absolute top-1 w-3 h-3 rounded-full transition-all", showMetricsOnCard ? "right-1 bg-black" : "left-1 bg-white/20")} />
            </div>
          </button>

          <button
            onClick={() => setSettings({ autoRefresh: !autoRefresh } as any)}
            className={clsx(
              "flex-1 p-6 rounded-2xl border transition-all duration-700 flex items-center justify-between group",
              autoRefresh ? "bg-cyan-500/10 border-cyan-500/40" : "bg-white/[0.02] border-white/5 hover:border-white/10"
            )}
          >
            <div className="flex items-center gap-6">
              <div className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                autoRefresh ? "bg-cyan-500 text-black shadow-2xl animate-spin-slow" : "bg-white/5 text-white/40"
              )}>
                <RefreshCw size={22} />
              </div>
              <div className="text-left space-y-1">
                <span className="text-[13px] font-black text-white uppercase tracking-tighter block italic">LIVE_REFRESH</span>
                <span className="text-[9px] font-black text-white/10 uppercase tracking-widest block font-mono">AUTO_UDPATE_THREADS</span>
              </div>
            </div>
            <div className={clsx(
              "w-12 h-6 rounded-full border-2 transition-all relative",
              autoRefresh ? "bg-cyan-500 border-cyan-500" : "border-white/10 bg-black/40"
            )}>
              <div className={clsx("absolute top-1 w-3 h-3 rounded-full transition-all", autoRefresh ? "right-1 bg-black" : "left-1 bg-white/20")} />
            </div>
          </button>
        </div>

        {/* Refresh Interval Calibration */}
        <AnimatePresence>
          {autoRefresh && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="p-10 bg-white/[0.01] border border-white/5 rounded-[3rem] space-y-6"
            >
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3">
                <Timer size={11} className="text-cyan-500/40" />
                INTERVAL_CALIBRATION // SYNC_MS
              </label>
              <div className="relative group max-w-sm">
                <div className="absolute -inset-0.5 bg-cyan-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={refreshInterval}
                    min={30} max={1800} step={30}
                    onChange={(e) => setSettings({ refreshInterval: Number(e.target.value) } as any)}
                    className="w-full px-8 py-6 bg-[#080808] border border-white/5 rounded-2xl text-[14px] font-black text-white outline-none focus:border-cyan-500/40 transition-all font-mono italic"
                  />
                  <span className="absolute right-8 text-[10px] font-black text-white/20 uppercase tracking-widest">SEC</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
