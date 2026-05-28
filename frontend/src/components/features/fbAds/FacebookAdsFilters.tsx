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
    // Logo Shopify — path do Simple Icons adaptado para 40x40
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#96BF48"/>
      <path
        d="M26.8 12.3c-.1 0-.3.1-.5.1-.3-.9-.8-1.8-1.4-2.4-.8-.9-1.8-1.3-2.9-1.3-1.3 0-2.1.7-2.7 1.4-.8-1-1.9-1.6-3.2-1.6-3.7 0-5.5 4.6-6.1 6.9l-2.4.7v.1C7.4 16.6 7.3 17 6.7 29.7L16 32l9.4-2.5L23 11.5l1.7.3v-.3c2-.1 3.2.4 3.2.4v-6.6l.9 7.3.5-.3a.12.12 0 00-.5-.5zm-8.1-2.9c.8 0 1.5.4 2.1 1-.6.2-1.3.4-1.9.6-.4-1.1-1-2-1.7-2.5l1.5-.1zM18 10.3c.7.6 1.2 1.6 1.5 2.8l-3.1.9c.5-1.6 1.3-3 1.6-3.7zm-1.6.4-.1.3c-.4.9-1 2.4-1.4 4l-2.1.7c.5-2 2-5.1 3.6-5.3v.3zM16 31l-8.4-2.3 1.5-9.9 9.5-2.9 1.7 9.7L16 31zm9.4-2.5l-8.4 2.3 3.3-5.3.5-6.7 6.2-1.9-1.6 11.6z"
        fill="white"
      />
    </svg>
  ),
  Kiwify: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#00B37E"/>
      <path d="M12 10h4v7.5l6.5-7.5H27l-7 8.5 7.5 12H23l-5.5-9.5-1.5 1.8V30h-4V10z" fill="white"/>
    </svg>
  ),
  Hotmart: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#F04E23"/>
      {/* Chama do Hotmart */}
      <path d="M20 6c-1 3.5-1.5 7-1.5 10 0 0-3-2.5-3-6.5C12 13 11 17 11 20a9 9 0 0018 0c0-4-2.5-8.5-3.5-10-1 2.5-1.5 4-3.5 5 1-3 .5-6-2-9z" fill="white" opacity="0.92"/>
      <path d="M20 22c-.5 1-1.5 2-1.5 3.5a1.5 1.5 0 003 0c0-.9-.5-1.6-1.5-3.5z" fill="white" opacity="0.65"/>
    </svg>
  ),
  Yampi: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#6D28D9"/>
      <path d="M9 11h5.5l5.5 9.5 5.5-9.5H31L21.5 25v4.5h-3V25L9 11z" fill="white"/>
    </svg>
  ),
  CartPanda: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#FF5A1F"/>
      <path d="M7 11h3.5l3.8 13h14.2l2.5-9H14" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="17" cy="28" r="2.2" fill="white"/>
      <circle cx="27" cy="28" r="2.2" fill="white"/>
    </svg>
  ),
  PerfectPay: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#0EA5E9"/>
      <path d="M9 21l8 8 14-16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Eduzz: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#FF3D00"/>
      <path d="M11 11h18v3.5H15v5h12v3.5H15v6.5h14V33H11V11z" fill="white"/>
    </svg>
  ),
  Monetizze: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#1E40AF"/>
      <path d="M7 29V11h4.5l8.5 13 8.5-13H33v18h-4V19l-8.5 11.5L12 19v10H7z" fill="white"/>
    </svg>
  ),
  HeroSpark: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#F59E0B"/>
      <path d="M20 7l3 9h9.5l-7.5 5.5 3 9L20 26l-8 4.5 3-9L7.5 16H17z" fill="white"/>
    </svg>
  ),
  Guru: (
    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
      <rect width="40" height="40" rx="8" fill="#10B981"/>
      <path d="M28 15.5a10 10 0 100 9H21v-3h9.5v7A13 13 0 1120.5 7v3.5a10 10 0 017.5 5z" fill="white"/>
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
