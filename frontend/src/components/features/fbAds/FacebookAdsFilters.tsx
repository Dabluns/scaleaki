'use client';

import React from 'react';
import { Search, ArrowUpDown, SlidersHorizontal, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { FbAdsFilters } from '@/hooks/useFacebookAds';

interface FacebookAdsFiltersProps {
  filters: FbAdsFilters;
  onChange: (f: FbAdsFilters) => void;
  total: number;
}

const CHECKOUTS = ['Shopify', 'Kiwify', 'Hotmart', 'Yampi', 'CartPanda', 'PerfectPay', 'Eduzz', 'Monetizze', 'HeroSpark', 'Guru'];

export function FacebookAdsFilters({ filters, onChange, total }: FacebookAdsFiltersProps) {
  const set = (patch: Partial<FbAdsFilters>) => onChange({ ...filters, ...patch });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 mb-10 px-8 lg:px-12"
    >
      {/* Busca */}
      <div className="relative group flex-1 min-w-[220px] max-w-xs">
        <div className="absolute inset-0 bg-green-500/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-green-400 transition-colors" />
        <input
          type="text"
          placeholder="FILTRAR ANÚNCIOS..."
          defaultValue={filters.search}
          onChange={(e) => set({ search: e.target.value || undefined })}
          className="relative w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black text-white tracking-widest uppercase focus:outline-none focus:border-green-500/30"
        />
      </div>

      {/* Checkout */}
      <div className="relative">
        <select
          value={filters.checkout || ''}
          onChange={(e) => set({ checkout: e.target.value || undefined })}
          className="appearance-none pl-4 pr-10 py-3 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest focus:outline-none focus:border-green-500/30 cursor-pointer"
        >
          <option value="">CHECKOUT: TODOS</option>
          {CHECKOUTS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>
        <SlidersHorizontal size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
      </div>

      {/* Status */}
      <div className="flex gap-1.5 p-1 bg-white/[0.03] border border-white/5 rounded-2xl">
        {(['active', 'all', 'inactive'] as const).map(s => (
          <button
            key={s}
            onClick={() => set({ status: s })}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              filters.status === s
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {s === 'active' ? 'ATIVOS' : s === 'inactive' ? 'INATIVOS' : 'TODOS'}
          </button>
        ))}
      </div>

      {/* Ordenação */}
      <div className="relative">
        <select
          value={`${filters.orderBy}-${filters.order}`}
          onChange={(e) => {
            const [orderBy, order] = e.target.value.split('-') as [FbAdsFilters['orderBy'], FbAdsFilters['order']];
            set({ orderBy, order });
          }}
          className="appearance-none pl-4 pr-10 py-3 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest focus:outline-none focus:border-green-500/30 cursor-pointer"
        >
          <option value="createdAt-desc">MAIS RECENTES</option>
          <option value="escala-desc">MAIOR ESCALA</option>
          <option value="duplicatas-desc">MAIS DUPLICATAS</option>
          <option value="deliveryStartTime-desc">MAIS TEMPO NO AR</option>
          <option value="pageLikes-desc">MAIS CURTIDAS</option>
        </select>
        <ArrowUpDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
      </div>

      {/* Escala mínima */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl">
        <Flame size={12} className="text-orange-400" />
        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">ESCALA ≥</span>
        <input
          type="number"
          min={0}
          max={100}
          defaultValue={filters.escalaMin ?? ''}
          onChange={(e) => set({ escalaMin: e.target.value ? Number(e.target.value) : undefined })}
          className="w-10 bg-transparent text-[10px] font-black text-green-400 text-center focus:outline-none"
          placeholder="0"
        />
      </div>

      {/* Contador */}
      <div className="ml-auto text-[9px] font-black text-white/20 uppercase tracking-widest">
        {total} anúncios
      </div>
    </motion.div>
  );
}
