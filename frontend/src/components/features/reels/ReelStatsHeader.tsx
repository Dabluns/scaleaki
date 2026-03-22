"use client";

import { useState, useEffect } from 'react';
import { useReels } from '@/hooks/useReels';
import { Activity, Flame, Zap } from 'lucide-react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · ReelStatsHeader v2.0
// Features: Mastery High-Fidelity, Technical Meta-Data HUD,
// Monospace Industrial Metrics, Emerald & Cyan Accents.
// ─────────────────────────────────────────────────────────────────

export function ReelStatsHeader() {
  const { reels, currentIndex } = useReels();
  const [viewsToday, setViewsToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hasHot, setHasHot] = useState(false);

  useEffect(() => {
    const storedViews = localStorage.getItem('reels_views_today');
    const today = new Date().toDateString();
    const viewsData = storedViews ? JSON.parse(storedViews) : { date: today, count: 0 };

    if (viewsData.date === today) {
      setViewsToday(viewsData.count);
    } else {
      setViewsToday(0);
      localStorage.setItem('reels_views_today', JSON.stringify({ date: today, count: 0 }));
    }

    const storedStreak = localStorage.getItem('reels_streak');
    const streakData = storedStreak ? JSON.parse(storedStreak) : { lastDate: null, days: 0 };
    setStreak(streakData.days || 0);

    const hasHotReels = reels.some(reel => {
      const metricas = typeof reel.metricas === 'string'
        ? (() => { try { return JSON.parse(reel.metricas); } catch { return null; } })() : reel.metricas;
      const roi = metricas?.roi || (reel.receita ? ((reel.receita || 0) / 100) : null);
      return roi !== null && roi > 200;
    });
    setHasHot(hasHotReels);
  }, [reels]);

  useEffect(() => {
    if (currentIndex > 0) {
      const storedViews = localStorage.getItem('reels_views_today');
      const today = new Date().toDateString();
      const viewsData = storedViews ? JSON.parse(storedViews) : { date: today, count: 0 };
      if (viewsData.date === today) { viewsData.count++; }
      else { viewsData.date = today; viewsData.count = 1; }
      localStorage.setItem('reels_views_today', JSON.stringify(viewsData));
      setViewsToday(viewsData.count);
    }
  }, [currentIndex]);

  return (
    <div className="absolute top-8 right-10 z-[40] flex items-center gap-6">

      {/* Session Latency / Views */}
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <Activity size={10} className="text-cyan-500" />
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Session_Activity</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-white italic transition-all duration-300">
            {viewsToday.toString().padStart(2, '0')}
          </span>
          <span className="text-[9px] font-black text-cyan-500/50 uppercase tracking-tighter">VIEWS/H</span>
        </div>
      </div>

      {/* Streak Indicator */}
      {streak > 0 && (
        <div className="flex flex-col items-end gap-1 border-l border-white/5 pl-6">
          <div className="flex items-center gap-2">
            <Zap size={10} className="text-green-500" />
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Uptime_Streak</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-green-500 italic">
              {streak}
            </span>
            <span className="text-[9px] font-black text-green-500/50 uppercase tracking-tighter">DAYS</span>
          </div>
        </div>
      )}

      {/* Hot Radar Status */}
      {hasHot && (
        <div className="flex flex-col items-end gap-1 border-l border-white/5 pl-6">
          <div className="flex items-center gap-2">
            <Flame size={10} className="text-yellow-500" />
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Radar_Status</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-yellow-500 italic animate-pulse">
              HOT
            </span>
            <span className="text-[9px] font-black text-yellow-500/50 uppercase tracking-tighter">SIGNAL</span>
          </div>
        </div>
      )}

    </div>
  );
}
