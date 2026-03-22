"use client";

import { AdminGuard } from '@/components/auth/AdminGuard';
import { OfertasManager } from '@/components/admin/OfertasManager';
import { UsersAdmin } from '@/components/admin/UsersAdmin';
import { BotControlPanel } from '@/components/admin/BotControlPanel';
import { NichosManager } from '@/components/admin/NichosManager';
import { useState, useEffect } from 'react';
import {
  Users,
  ShoppingBag,
  Activity,
  ShieldCheck,
  Cpu,
  Clock,
  Zap,
  Layers,
  LayoutDashboard,
  Bell,
  Search,
  ChevronRight,
  Database,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCounter } from '@/hooks/useCounter';
import { useOfertaContext } from '@/context/OfertaContext';
import { useNichos } from '@/context/NichoContext';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium AdminCenter v4.5
// Design Path: Mastery High-Fidelity / Strategic Command HUD
// ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'ofertas' | 'users' | 'bot' | 'nichos'>('ofertas');
  const [mounted, setMounted] = useState(false);
  const { ofertas } = useOfertaContext();
  const { nichos } = useNichos();

  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    {
      id: 'ofertas',
      label: 'MATRIZ_OFERTAS',
      icon: ShoppingBag,
      description: 'Gerenciamento de ativos e fluxos de escala.',
      component: <OfertasManager />
    },
    {
      id: 'users',
      label: 'ID_USUÁRIOS',
      icon: Users,
      description: 'Controle de acessos e protocolos de assinatura.',
      component: <UsersAdmin />
    },
    {
      id: 'bot',
      label: 'BOT_AUTOMATOR',
      icon: Cpu,
      description: 'Agentes autônomos de processamento cloud.',
      component: <BotControlPanel />
    },
    {
      id: 'nichos',
      label: 'CENTRAL_NICHOS',
      icon: Layers,
      description: 'Taxonomia de mercado e segmentação de nodes.',
      component: <NichosManager />
    }
  ];

  // Stats for the HUD
  const totalOffers = useCounter(ofertas.length, { duration: 1500 });
  const totalNichos = useCounter(nichos.length, { duration: 1500 });
  const systemStability = useCounter(99.8, { duration: 2000 }); // Simulated precision
  const activeNodes = useCounter(12, { duration: 1800 }); // Simulated

  return (
    <AdminGuard>
      <div className="min-h-screen bg-black relative pb-32">

        {/* Editorial Header Hub */}
        <div className="relative pt-16 pb-12 px-8 lg:px-16 max-w-[1800px] mx-auto border-b border-white/5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Strategic_Nexus // ADMIN</span>
                  <span className="text-[10px] text-white/10 italic font-mono">Core_System_v4.5_LTS</span>
                </div>
              </div>

              <h1 className="text-7xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
                ADMIN <br />
                <span className="text-green-500">CENTER</span>
              </h1>

              <div className="flex items-center gap-6">
                <div className="bg-green-500/10 px-4 py-1.5 rounded-full flex items-center gap-2 border border-green-500/20">
                  <ShieldCheck size={12} className="text-green-500" />
                  <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Acesso de Domínio Validado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-white/20" />
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none font-mono">
                    SESSION_TIME: {mounted ? new Date().toLocaleTimeString('pt-BR') : '--:--:--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Industrial HUD Metrics Cluster */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 min-w-[300px] xl:min-w-[700px]">
              <div className="flex flex-col gap-2 p-2 group/stat">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest border-l-2 border-white/5 pl-3 group-hover/stat:border-green-500 transition-colors">Ofertas_DB</span>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="text-5xl font-black text-white italic group-hover/stat:text-green-500 transition-colors">{totalOffers.count.toString().padStart(2, '0')}</span>
                  <span className="text-[10px] font-black text-white/10 uppercase italic">Units</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-2 group/stat">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest border-l-2 border-white/5 pl-3 group-hover/stat:border-cyan-500 transition-colors">Central_Nichos</span>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="text-5xl font-black text-white italic group-hover/stat:text-cyan-500 transition-colors">{totalNichos.count.toString().padStart(2, '0')}</span>
                  <span className="text-[10px] font-black text-white/10 uppercase italic">Nodes</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-2 group/stat">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest border-l-2 border-white/5 pl-3 group-hover/stat:border-yellow-500 transition-colors">Uptime_HQ</span>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="text-5xl font-black text-green-500 italic group-hover/stat:scale-105 transition-transform">{systemStability.count}%</span>
                  <span className="text-[10px] font-black text-white/10 uppercase italic">Stable</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-2 group/stat">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest border-l-2 border-white/5 pl-3 group-hover/stat:border-purple-500 transition-colors">Bot_Protocols</span>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="text-5xl font-black text-white italic group-hover/stat:text-purple-500 transition-colors">01</span>
                  <span className="text-[10px] font-black text-white/10 uppercase italic">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Navigation HUB */}
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 lg:px-16 pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Left Menu / Index */}
            <div className="lg:col-span-3 space-y-6">
              <div className="p-2 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={clsx(
                        "relative flex flex-col p-8 rounded-[2rem] transition-all duration-700 text-left overflow-hidden group/tab",
                        isActive
                          ? "bg-green-500 text-black shadow-[0_20px_50px_rgba(34,197,94,0.2)]"
                          : "bg-transparent text-white/20 hover:bg-white/[0.04] hover:text-white/60"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="tabGlow"
                          className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 opacity-20 -z-10"
                        />
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <div className={clsx(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                          isActive ? "bg-black/10" : "bg-white/5"
                        )}>
                          <Icon size={20} />
                        </div>
                        <ChevronRight size={16} className={clsx("transition-transform duration-500", isActive ? "rotate-90" : "-rotate-45")} />
                      </div>

                      <span className="text-[12px] font-black uppercase tracking-[0.3em] mb-2">{tab.label}</span>
                      <span className={clsx(
                        "text-[10px] font-bold italic leading-tight uppercase tracking-tight",
                        isActive ? "text-black/60" : "text-white/10"
                      )}>
                        {tab.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* System Load Widget */}
              <div className="p-8 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] space-y-6 group hover:border-green-500/20 transition-all duration-700">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Network_Load</span>
                  <Zap size={14} className="text-yellow-500 animate-pulse" />
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '42%' }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="h-full bg-green-500"
                  />
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-black text-white/10 uppercase tracking-widest italic">CPU_USAGE</span>
                  <span className="text-xl font-black text-white italic">42%</span>
                </div>
              </div>
            </div>

            {/* Right Content Viewport */}
            <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-[#0e0e0e] border border-white/5 rounded-[4rem] min-h-[70vh] relative overflow-hidden group/viewport"
                >
                  {/* Background HUD Graphics */}
                  <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover/viewport:opacity-[0.05] transition-opacity duration-1000">
                    <LayoutDashboard size={400} className="rotate-12" />
                  </div>

                  <div className="relative z-10 p-8 md:p-12 lg:p-16">
                    {tabs.find(tab => tab.id === activeTab)?.component}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </AdminGuard>
  );
}