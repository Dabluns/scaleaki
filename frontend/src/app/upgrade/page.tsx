"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAccess } from '../../context/AccessContext';

// ─────────────────────────────────────────────────────────────────
// Página de upgrade Básico → Scaleaki+ (roxo = Plus, verde = Básico).
// CTA Plus aponta para o checkout do produto Plus (env-driven).
// ─────────────────────────────────────────────────────────────────

// Checkouts Plus por período (env-driven, fallback nos links diretos da Cakto).
type PlusPlan = {
  id: 'mensal' | 'trimestral' | 'anual';
  nome: string;
  preco: string;
  porMes: string;
  selo?: string;
  destaque?: boolean;
  url: string;
};

const PLUS_PLANS: PlusPlan[] = [
  {
    id: 'mensal',
    nome: 'Mensal',
    preco: 'R$ 117',
    porMes: 'R$ 117/mês',
    url: process.env.NEXT_PUBLIC_CHECKOUT_PLUS_MENSAL_URL || 'https://pay.cakto.com.br/hh8ixqi',
  },
  {
    id: 'anual',
    nome: 'Anual',
    preco: 'R$ 1.127',
    porMes: 'R$ 94/mês',
    selo: 'Economize R$ 277',
    destaque: true,
    url: process.env.NEXT_PUBLIC_CHECKOUT_PLUS_ANUAL_URL || 'https://pay.cakto.com.br/xoqjsoa',
  },
  {
    id: 'trimestral',
    nome: 'Trimestral',
    preco: 'R$ 315',
    porMes: 'R$ 105/mês',
    url: process.env.NEXT_PUBLIC_CHECKOUT_PLUS_TRIMESTRAL_URL || 'https://pay.cakto.com.br/har9k5g',
  },
];

type Row = { label: string; basico: boolean | string; plus: boolean | string };

const COMPARATIVO: Row[] = [
  { label: 'Ofertas escaladas', basico: true, plus: true },
  { label: 'Criativos ilimitados', basico: true, plus: true },
  { label: 'Biblioteca de anúncios FB', basico: true, plus: true },
  { label: 'Extensão de garimpo', basico: true, plus: true },
  { label: 'Download de criativos', basico: true, plus: true },
  { label: 'Marketplaces completos (Dropship, ML, AliExpress, Shopee, Shein)', basico: 'Amostra 5', plus: true },
  { label: 'AdSpy YouTube', basico: false, plus: true },
  { label: 'AdSpy TikTok', basico: false, plus: true },
  { label: 'Pré-aprovador de Criativo', basico: false, plus: true },
  { label: 'Análise de Funil e Tráfego', basico: false, plus: true },
];

function Cell({ value, accent }: { value: boolean | string; accent: string }) {
  if (value === true) return <Check className="w-5 h-5 mx-auto" style={{ color: accent }} />;
  if (value === false) return <X className="w-5 h-5 mx-auto text-white/20" />;
  return <span className="text-xs font-bold text-white/50">{value}</span>;
}

export default function UpgradePage() {
  const { access } = useAccess();
  const tier = access?.tier ?? 'free';
  const isPlus = tier === 'plus';

  return (
    <div className="min-h-screen bg-[#050505] relative py-20 px-6 lg:px-12 overflow-hidden selection:bg-purple-500/30">
      {/* Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-500/8 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-green-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-3 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-300/70">
                Upgrade de Operação
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter uppercase italic">
              DESBLOQUEIE O <br />
              <span className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">SCALEAKI+</span>
            </h1>
            <p className="text-lg text-white/40 font-bold max-w-2xl">
              Marketplaces completos, AdSpy de YouTube e TikTok, pré-aprovador de criativo e análise de funil.
              As ferramentas de quem escala de verdade.
            </p>
          </motion.div>
        </div>

        {/* Tabela comparativa */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden"
        >
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-6 py-5 border-b border-white/10 bg-white/[0.03]">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Recurso</span>
            <span className="w-24 text-center text-[11px] font-black uppercase tracking-wider text-green-400">Básico</span>
            <span className="w-24 text-center text-[11px] font-black uppercase tracking-wider text-purple-400">Plus</span>
          </div>

          {COMPARATIVO.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-6 py-4 border-b border-white/5 last:border-0"
            >
              <span className="text-sm font-semibold text-white/80">{row.label}</span>
              <div className="w-24 text-center"><Cell value={row.basico} accent="#22c55e" /></div>
              <div className="w-24 text-center"><Cell value={row.plus} accent="#a855f7" /></div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 flex flex-col items-center gap-5"
        >
          {isPlus ? (
            <div className="flex items-center gap-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-8 py-5">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
              <span className="text-base font-extrabold text-white">
                Você já tem o Scaleaki+ ativo. Tudo liberado.
              </span>
            </div>
          ) : (
            <>
              <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
                {PLUS_PLANS.map((plan) => (
                  <a
                    key={plan.id}
                    href={plan.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative flex flex-col items-center gap-3 rounded-2xl border p-7 transition ${
                      plan.destaque
                        ? 'border-purple-500/60 bg-purple-500/10 shadow-[0_0_40px_rgba(168,85,247,0.25)] md:-translate-y-3 md:scale-105'
                        : 'border-white/10 bg-white/[0.02] hover:border-purple-500/30'
                    }`}
                  >
                    {plan.selo && (
                      <span className="absolute -top-3 rounded-full bg-purple-500 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                        {plan.selo}
                      </span>
                    )}
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">
                      {plan.nome}
                    </span>
                    <span className="text-4xl font-black tracking-tighter text-white">{plan.preco}</span>
                    <span className="text-xs font-bold text-white/40">{plan.porMes}</span>
                    <span
                      className={`mt-2 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black uppercase tracking-wide transition ${
                        plan.destaque
                          ? 'bg-purple-500 text-white group-hover:bg-purple-400'
                          : 'bg-white/5 text-white/80 group-hover:bg-white/10'
                      }`}
                    >
                      <Zap className="h-4 w-4" />
                      Assinar
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </a>
                ))}
              </div>
              <p className="text-xs font-bold text-white/30">
                Upgrade imediato · cancele quando quiser
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
