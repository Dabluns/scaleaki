'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ArrowUpDown, SlidersHorizontal, Flame, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FbAdsFilters } from '@/hooks/useFacebookAds';

interface FacebookAdsFiltersProps {
  filters: FbAdsFilters;
  onChange: (f: FbAdsFilters) => void;
  total: number;
}

// ─── Ícones SVG das plataformas de checkout ───────────────────────────────────
// Usando SVGs inline para não depender de lib externa

const CheckoutIcons: Record<string, React.ReactNode> = {
  Shopify: (
    <svg viewBox="0 0 109.5 124.5" className="w-4 h-4" fill="none">
      <path d="M74.7 14.8s-.3.2-.8.3c-.5-1.6-1.4-3.1-2.5-4.2-1.4-1.5-3.1-2.2-5-2.2v.3s-1.8 0-3.6 1.2c-.2.1-.4.3-.6.4-1.4-1.8-3.3-2.8-5.5-2.8-6.3 0-9.4 7.9-10.4 11.9-2.4.7-4.2 1.3-4.2 1.3l-.1.1C40.8 22 40.6 23 39.5 51L55 55.5l16-4.3C74.6 19 74.7 14.8 74.7 14.8zm-13.9-4.9c1.4 0 2.6.6 3.6 1.7.6.7 1.1 1.6 1.4 2.6-1.8.6-3.7 1.1-5.6 1.7-.7-2.8-1.9-5.1-3.4-6.5 1-.3 2.3-.5 4-.5zm-5.3 1.1c1.7 1.4 3 3.8 3.7 6.9l-7.6 2.3c1.1-3.7 3-7.2 3.9-9.2zm-3.9.9c-.1.2-.1.3-.2.5-1 2.2-2.3 5.9-3.3 9.8l-5.1 1.6c1.1-4.6 4.2-10.9 8.6-11.9z" fill="#96bf48"/>
      <path d="M74.7 14.8l-.7 2.4s-.8-.5-2.4-.5c-4.6 0-6.8 3.2-6.8 3.2s-2.3-1.5-5.9-.3c0 0-2.4-6.2-8.4-5.3L48.3 21s-3.6 1.1-7.5 2.3C40 24.7 39.7 26 39.4 28L38 49.7l17.1 4.6 16.9-4.5-4-21.1s-1.3-.8-3.2-1l.4-2.2c3.5-.2 5.5.7 5.5.7v-11.4z" fill="#5e8e3e"/>
      <path d="M55.1 55.3l-16-4.3.3 4.3z" fill="#f4f4f4"/>
      <path d="M71.1 50.9l-16 4.4.3-4.4z" fill="#e4e4e4"/>
      <path d="M55.1 55.3l-.3-4.3-1.7 4.3z" fill="#d4d4d4"/>
      <path d="M55.1 55.3l1.7-4.3-.3 4.4z" fill="#c4c4c4"/>
    </svg>
  ),
  Kiwify: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#00B37E"/>
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="sans-serif">K</text>
    </svg>
  ),
  Hotmart: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#F04E23"/>
      <path d="M20 8C13.4 8 8 13.4 8 20s5.4 12 12 12 12-5.4 12-12S26.6 8 20 8zm0 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-13c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5z" fill="white"/>
    </svg>
  ),
  Yampi: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#7C3AED"/>
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="sans-serif">Y</text>
    </svg>
  ),
  CartPanda: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#FF6B35"/>
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="sans-serif">CP</text>
    </svg>
  ),
  PerfectPay: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#0EA5E9"/>
      <path d="M12 20l6 6 10-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Eduzz: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#FF4D00"/>
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="sans-serif">E</text>
    </svg>
  ),
  Monetizze: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#1E40AF"/>
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="sans-serif">M</text>
    </svg>
  ),
  HeroSpark: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#F59E0B"/>
      <path d="M20 10l2.4 7.4H30l-6.2 4.5 2.4 7.4L20 25l-6.2 4.3 2.4-7.4L10 17.4h7.6z" fill="white"/>
    </svg>
  ),
  Guru: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#10B981"/>
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="sans-serif">G</text>
    </svg>
  ),
};

const CHECKOUTS = ['Shopify', 'Kiwify', 'Hotmart', 'Yampi', 'CartPanda', 'PerfectPay', 'Eduzz', 'Monetizze', 'HeroSpark', 'Guru'];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'createdAt-desc', label: 'Mais Recentes' },
  { value: 'escala-desc',    label: 'Maior Escala' },
  { value: 'duplicatas-desc',label: 'Mais Duplicatas' },
  { value: 'deliveryStartTime-desc', label: 'Mais Tempo no Ar' },
  { value: 'pageLikes-desc', label: 'Mais Curtidas' },
];

// ─── Componente de Dropdown Premium ───────────────────────────────────────────

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  align?: 'left' | 'right';
}

function Dropdown({ trigger, children, isOpen, onToggle, onClose, align = 'left' }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
          isOpen
            ? 'bg-white/[0.06] border-white/20 text-white'
            : 'bg-white/[0.03] border-white/5 text-white/60 hover:text-white hover:border-white/10'
        }`}
      >
        {trigger}
        <ChevronDown
          size={11}
          className={`text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-50 mt-2 min-w-[200px] bg-[#111] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden backdrop-blur-xl ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {/* Top glow line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="p-1.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropdownItemProps {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}

function DropdownItem({ onClick, isActive, children }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-150 group ${
        isActive
          ? 'bg-white/[0.07] text-white'
          : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
      }`}
    >
      {children}
      {isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)] flex-shrink-0" />
      )}
    </button>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────

export function FacebookAdsFilters({ filters, onChange, total }: FacebookAdsFiltersProps) {
  const set = (patch: Partial<FbAdsFilters>) => onChange({ ...filters, ...patch });

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const closeAll = useCallback(() => {
    setCheckoutOpen(false);
    setSortOpen(false);
  }, []);

  const currentSort = SORT_OPTIONS.find(o => o.value === `${filters.orderBy}-${filters.order}`) ?? SORT_OPTIONS[0];
  const currentCheckout = filters.checkout ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 mb-10 px-8 lg:px-12"
    >
      {/* ── Busca ─────────────────────────────────────────────────────── */}
      <div className="relative group flex-1 min-w-[220px] max-w-xs">
        <div className="absolute inset-0 bg-green-500/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
        <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-green-400 transition-colors" />
        <input
          type="text"
          placeholder="FILTRAR ANÚNCIOS..."
          defaultValue={filters.search}
          onChange={(e) => set({ search: e.target.value || undefined })}
          className="relative w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black text-white tracking-widest uppercase focus:outline-none focus:border-green-500/30 placeholder:text-white/15"
        />
      </div>

      {/* ── Status ────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-2xl">
        {(['active', 'all', 'inactive'] as const).map(s => (
          <button
            key={s}
            onClick={() => set({ status: s })}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
              filters.status === s
                ? 'bg-green-500/20 border border-green-500/30 text-green-400 shadow-[0_0_12px_rgba(74,222,128,0.15)]'
                : 'text-white/25 hover:text-white/60'
            }`}
          >
            {s === 'active' ? 'Ativos' : s === 'inactive' ? 'Inativos' : 'Todos'}
          </button>
        ))}
      </div>

      {/* ── Checkout ──────────────────────────────────────────────────── */}
      <Dropdown
        isOpen={checkoutOpen}
        onToggle={() => { setSortOpen(false); setCheckoutOpen(v => !v); }}
        onClose={() => setCheckoutOpen(false)}
        trigger={
          <span className="flex items-center gap-2">
            {currentCheckout && CheckoutIcons[currentCheckout] && (
              <span className="flex-shrink-0">{CheckoutIcons[currentCheckout]}</span>
            )}
            <span>{currentCheckout ? currentCheckout.toUpperCase() : 'CHECKOUT'}</span>
            {currentCheckout && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); set({ checkout: undefined }); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); set({ checkout: undefined }); } }}
                className="ml-0.5 text-white/30 hover:text-red-400 transition-colors"
              >
                <X size={10} />
              </span>
            )}
          </span>
        }
      >
        {/* "Todos" item */}
        <DropdownItem
          onClick={() => { set({ checkout: undefined }); setCheckoutOpen(false); }}
          isActive={!currentCheckout}
        >
          <span className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded-md bg-white/5 flex items-center justify-center text-[9px] text-white/30">∗</span>
            <span>Todos</span>
          </span>
        </DropdownItem>

        {/* Separador */}
        <div className="my-1.5 h-px bg-white/5 mx-2" />

        {/* Cada plataforma com ícone */}
        {CHECKOUTS.map(c => (
          <DropdownItem
            key={c}
            onClick={() => { set({ checkout: c }); setCheckoutOpen(false); }}
            isActive={currentCheckout === c}
          >
            <span className="flex items-center gap-2.5">
              {CheckoutIcons[c] && (
                <span className="flex-shrink-0 opacity-90">{CheckoutIcons[c]}</span>
              )}
              <span>{c}</span>
            </span>
          </DropdownItem>
        ))}
      </Dropdown>

      {/* ── Ordenação ─────────────────────────────────────────────────── */}
      <Dropdown
        isOpen={sortOpen}
        onToggle={() => { setCheckoutOpen(false); setSortOpen(v => !v); }}
        onClose={() => setSortOpen(false)}
        trigger={
          <span className="flex items-center gap-2">
            <ArrowUpDown size={11} className="text-white/40" />
            <span>{currentSort.label.toUpperCase()}</span>
          </span>
        }
      >
        {SORT_OPTIONS.map(o => (
          <DropdownItem
            key={o.value}
            onClick={() => {
              const [orderBy, order] = o.value.split('-') as [FbAdsFilters['orderBy'], FbAdsFilters['order']];
              set({ orderBy, order });
              setSortOpen(false);
            }}
            isActive={currentSort.value === o.value}
          >
            {o.label}
          </DropdownItem>
        ))}
      </Dropdown>

      {/* ── Escala mínima ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
        <Flame size={11} className="text-orange-400" />
        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Escala ≥</span>
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

      {/* ── Contador ──────────────────────────────────────────────────── */}
      <div className="ml-auto text-[9px] font-black text-white/20 uppercase tracking-widest tabular-nums">
        {total.toLocaleString('pt-BR')} anúncios
      </div>
    </motion.div>
  );
}
