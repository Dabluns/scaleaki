"use client";
import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Mail, ShieldCheck, Zap, Activity, Terminal, ArrowRight, BellRing } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium EmailNotifications v5.0
// Design Path: Mastery High-Fidelity / SMTP Routing Node
// ─────────────────────────────────────────────────────────────────

export default function EmailNotifications() {
  const { settings, setSettings } = useSettings();
  const s: any = settings || {};

  const notificationItems = [
    { key: 'emailNewOffers', label: 'E-mail New Offers', desc: 'Alertas táticos de novos ativos no radar.', color: 'text-blue-500' },
    { key: 'emailRecommendations', label: 'IA Recommendations', desc: 'Sugestões de ativos processadas via rede neural.', color: 'text-cyan-500' },
    { key: 'emailPerformance', label: 'Performance Alerts', desc: 'Monitoramento de métricas em tempo real.', color: 'text-indigo-500' },
    { key: 'emailWeeklySummary', label: 'Weekly Intelligence', desc: 'Relatório consolidado de performance operativa.', color: 'text-green-500' },
    { key: 'emailUpdates', label: 'System Protocols', desc: 'Mudanças críticas na arquitetura da plataforma.', color: 'text-amber-500' },
    { key: 'emailNewsletter', label: 'Insider Intel', desc: 'Dicas e vetores de crescimento estrategicamente selecionados.', color: 'text-purple-500' },
  ];

  return (
    <div className="bg-[#0a0a0a]/40 border border-white/5 rounded-3xl p-8 lg:p-10 relative overflow-hidden group">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
        <Mail size={200} />
      </div>

      <div className="relative z-10 flex flex-col gap-12">

        <header className="flex items-center justify-between border-b border-white/5 pb-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">SMTP_GATEWAY</h2>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic font-mono">CHANNEL_ID // ML-CORE-01</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <ShieldCheck size={14} className="text-blue-500" />
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic animate-pulse">ENCRYPTION_ACTIVE</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notificationItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setSettings({ [item.key]: !s[item.key] } as any)}
              className={clsx(
                "p-6 rounded-2xl border transition-all duration-700 flex items-center justify-between group/item",
                s[item.key] ? "bg-white/[0.04] border-white/10" : "bg-white/[0.01] border-white/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:border-white/10"
              )}
            >
              <div className="flex items-center gap-6">
                <div className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  s[item.key] ? `${item.color} bg-white/5 shadow-2xl` : "bg-white/5 text-white/10"
                )}>
                  <BellRing size={20} />
                </div>
                <div className="text-left space-y-1">
                  <span className="text-[14px] font-black text-white uppercase tracking-tighter italic block">{item.label}</span>
                  <span className="text-[9px] font-black text-white/10 uppercase tracking-widest font-mono block transition-colors group-hover/item:text-white/30">{item.desc}</span>
                </div>
              </div>
              <div className={clsx(
                "w-1.5 h-1.5 rounded-full transition-all duration-700",
                s[item.key] ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] scale-125" : "bg-white/5"
              )} />
            </button>
          ))}
        </div>

        {/* Special Case: Frequency Calibration */}
        <AnimatePresence>
          {s.emailNewOffers && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="space-y-6 pt-10 border-t border-white/5"
            >
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3">
                <Terminal size={11} className="text-blue-500/40" />
                THROUGHPUT_CALIBRATION // FREQUENCY
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['immediate', 'daily', 'weekly', 'never'].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setSettings({ emailNewOffersFreq: freq } as any)}
                    className={clsx(
                      "py-4 px-6 rounded-2xl border transition-all duration-700 font-black text-[10px] uppercase tracking-widest italic",
                      s.emailNewOffersFreq === freq
                        ? "bg-blue-500 text-black border-blue-500 shadow-2xl scale-105"
                        : "bg-black/40 border-white/5 text-white/20 hover:border-white/20 hover:text-white"
                    )}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
