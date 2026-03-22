"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card3D } from '@/components/ui/Card3D';
import {
  CreditCard,
  Check,
  Sparkles,
  Zap,
  Crown,
  Calendar,
  Lock,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Activity,
  Cpu
} from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium Plano Page v5.0
// Design Path: Mastery High-Fidelity / Tier Selection Terminal
// ─────────────────────────────────────────────────────────────────

type PlanoType = 'mensal' | 'trimestral' | 'anual';

interface Plano {
  id: PlanoType;
  nome: string;
  periodo: string;
  preco: number;
  precoFormatado: string;
  precoOriginalFormatado?: string;
  desconto?: number;
  descricao: string;
  popular?: boolean;
  icon: React.ElementType;
  beneficios: string[];
  color: string;
}

const planos: Plano[] = [
  {
    id: 'mensal',
    nome: 'MONTHLY_CORE',
    periodo: '1 MONTH',
    preco: 67.00,
    precoFormatado: 'R$ 67,00',
    descricao: 'ENTRY_LEVEL_MAINFRAME',
    icon: Calendar,
    color: 'blue',
    beneficios: [
      'CORE_ACCESS_ACTIVE',
      'ADVANCED_FILTRATION',
      'EMAIL_SUPPORT_LINK',
      'REAL_TIME_SYNC',
    ],
  },
  {
    id: 'trimestral',
    nome: 'QUARTERLY_PRO',
    periodo: '3 MONTHS',
    preco: 194.00,
    precoFormatado: 'R$ 194,00',
    precoOriginalFormatado: 'R$ 291,00',
    desconto: 33,
    descricao: 'OPTIMIZED_YIELD_NODE',
    popular: true,
    icon: Zap,
    color: 'cyan',
    beneficios: [
      'ALL_CORE_FEATURES',
      '33%_COMPUTE_DISCOUNT',
      'PRIORITY_DATA_ROUTING',
      'DETAILED_INTEL_REPORTS',
      'API_GATEWAY_ACCESS',
    ],
  },
  {
    id: 'anual',
    nome: 'ANNUAL_ULTRA',
    periodo: '12 MONTHS',
    preco: 774.00,
    precoFormatado: 'R$ 774,00',
    precoOriginalFormatado: 'R$ 1.164,00',
    desconto: 34,
    descricao: 'MAXIMUM_EFFICIENCY_GRID',
    icon: Crown,
    color: 'green',
    beneficios: [
      'ALL_PRO_SYSTEMS',
      '34%_TOTAL_DISCOUNT',
      '24/7_CRITICAL_SUPPORT',
      'ADVANCED_ANALYTICS',
      'BETA_MODULE_ACCESS',
      'STRATEGIC_CONSULTING',
    ],
  },
];

export default function PlanoSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelecionarPlano = (planoId: PlanoType) => {
    const checkoutUrls = {
      mensal: process.env.NEXT_PUBLIC_CHECKOUT_MENSAL_URL,
      trimestral: process.env.NEXT_PUBLIC_CHECKOUT_TRIMESTRAL_URL,
      anual: process.env.NEXT_PUBLIC_CHECKOUT_ANUAL_URL,
    };
    const url = checkoutUrls[planoId];
    if (url && url.startsWith('http')) {
      window.location.href = url;
    } else {
      alert('SUBSYSTEM_OFFLINE: CHECKOUT_URL_NOT_FOUND');
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-32 overflow-x-hidden">

      {/* Editorial Subscription Header */}
      <div className="relative pt-16 pb-12 px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Decorative Background HUD */}
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
          <CreditCard size={600} className="rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-16 border-b border-white/5 pb-16">
          <div className="space-y-10 flex-1">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4 px-6 py-2.5 rounded-full bg-white/5 border border-white/5 text-white/40 font-black text-[10px] uppercase tracking-[0.4em] italic">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                LICENSE_ACQUISITION // SUBSYSTEM_SYNC
              </div>
              <div className="flex items-center gap-3 border-l border-white/5 pl-6">
                <ShieldCheck size={14} className="text-white/20" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest font-mono">ENCRYPTION: AES-256</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
                SYSTEM<br />
                <span className="text-green-500">TIERS</span>
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 pt-6">
                <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.3em] italic max-w-md">
                  Selecione o nível de processamento e acesso adequado para sua escala operativa.
                </p>
                <div className="hidden sm:block w-px h-10 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-green-500/40 uppercase tracking-widest font-mono">SCALABILITY_FACTOR</span>
                  <span className="text-[14px] font-black text-white uppercase tracking-tighter italic font-mono">UNLIMITED_NODES</span>
                </div>
              </div>
            </div>
          </div>

          {/* Market Context HUD */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-8 xl:min-w-[400px]">
            {[
              { label: 'Network_Trust', value: '99.9%', icon: Activity },
              { label: 'Active_Nodes', value: 'TIER_5', icon: Cpu }
            ].map((item, i) => (
              <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
                    <item.icon size={18} />
                  </div>
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

      {/* Plan Grid Terminal */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {planos.map((plano, i) => (
          <motion.div
            key={plano.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={clsx(
              "relative p-8 rounded-3xl border transition-all duration-700 flex flex-col gap-8 group overflow-hidden",
              plano.popular
                ? "bg-green-500/10 border-green-500/30 shadow-[0_30px_60px_rgba(34,197,94,0.1)]"
                : "bg-[#080808] border-white/5 hover:border-white/10"
            )}
          >
            {plano.popular && (
              <div className="absolute top-8 right-8">
                <div className="bg-green-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                  <Sparkles size={12} fill="currentColor" />
                  RECOMMENDED
                </div>
              </div>
            )}

            <header className="space-y-6">
              <div className={clsx(
                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-all group-hover:scale-110",
                plano.popular ? "bg-green-500 text-black border-green-500" : "bg-white/5 text-white/40 border-white/10"
              )}>
                <plano.icon size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">{plano.nome}</h3>
                <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em] italic">{plano.descricao}</p>
              </div>
            </header>

            <div className="space-y-1 border-b border-white/5 pb-10">
              {plano.precoOriginalFormatado && (
                <span className="text-[11px] font-bold text-white/10 line-through uppercase tracking-widest block font-mono">
                  {plano.precoOriginalFormatado}
                </span>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white italic tracking-tighter uppercase">{plano.precoFormatado}</span>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic font-mono">/ {plano.periodo}</span>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <ul className="space-y-5">
                {plano.beneficios.map((ben, idx) => (
                  <li key={idx} className="flex items-center gap-4 group/li">
                    <div className={clsx(
                      "w-1.5 h-1.5 rounded-full transition-transform group-hover/li:scale-150",
                      plano.popular ? "bg-green-500" : "bg-white/20"
                    )} />
                    <span className="text-[12px] font-bold text-white/30 uppercase italic tracking-widest group-hover/li:text-white transition-colors">{ben}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSelecionarPlano(plano.id)}
              className={clsx(
                "w-full py-6 rounded-2xl font-black text-[13px] uppercase tracking-[0.3em] transition-all duration-700 active:scale-95 flex items-center justify-center gap-4 relative overflow-hidden group/btn",
                plano.popular
                  ? "bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                  : "bg-white text-black hover:bg-green-500"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              <span className="relative z-10">UPGRADE_NOW</span>
              <ArrowRight size={18} className="relative z-10 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Trust Footer */}
      <div className="max-w-6xl mx-auto mt-20 text-center space-y-8">
        <div className="flex items-center justify-center gap-8 opacity-20">
          <ShieldCheck size={20} />
          <div className="w-px h-4 bg-white" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">SECURE_PAYMENT_GATEWAY</span>
          <div className="w-px h-4 bg-white" />
          <CreditCard size={20} />
        </div>
        <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest italic max-w-sm mx-auto leading-relaxed">
          Todas as transações são processadas via infraestrutura segura e criptografada Pagar.me.
        </p>
      </div>

    </div>
  );
}
