'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ArrowUpDown, SlidersHorizontal, Flame, ChevronDown, Check, X, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FbAdsFilters } from '@/hooks/useFacebookAds';
import {
  CHECKOUT_PLATFORMS,
  VSL_PLATFORMS,
  CATEGORY_LABELS,
  TechCategory,
  Technology,
} from '@/lib/technologyMap';

interface FacebookAdsFiltersProps {
  filters: FbAdsFilters;
  onChange: (f: FbAdsFilters) => void;
  total: number;
}

// Filtros que dependem de campos ainda pouco populados (checkout/tecnologia ~0,6%).
// Enquanto o backfill não cobre a base, escondê-los evita vitrine vazia.
// Reativar = true quando a cobertura subir.
const SHOW_CHECKOUT_FILTER = false;
const SHOW_PLAYER_FILTER = false;

// ─── Mini badge colorido ──────────────────────────────────────────────────────

function TechBadge({ tech, size = 'sm' }: { tech: Technology; size?: 'sm' | 'xs' }) {
  const s = size === 'sm' ? 'w-4 h-4 text-[8px]' : 'w-3 h-3 text-[7px]';
  // Iniciais da plataforma como fallback de ícone
  const initials = tech.name.substring(0, 2).toUpperCase();
  return (
    <span
      className={`${s} rounded flex items-center justify-center font-black flex-shrink-0`}
      style={{ background: tech.color + '33', color: tech.color, border: `1px solid ${tech.color}44` }}
    >
      {initials}
    </span>
  );
}

// ─── Sort Options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'createdAt-desc', label: 'Mais Recentes' },
  { value: 'escala-desc',    label: 'Maior Escala' },
  { value: 'duplicatas-desc',label: 'Mais Duplicatas' },
  { value: 'deliveryStartTime-desc', label: 'Mais Tempo no Ar' },
  { value: 'pageLikes-desc', label: 'Mais Curtidas' },
];

// ─── Dropdown Premium ─────────────────────────────────────────────────────────

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  align?: 'left' | 'right';
  wide?: boolean;
}

function Dropdown({ trigger, children, isOpen, onToggle, onClose, align = 'left', wide }: DropdownProps) {
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
            className={`absolute z-50 mt-2 ${wide ? 'min-w-[320px]' : 'min-w-[200px]'} bg-[#111] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden backdrop-blur-xl ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="p-1.5 max-h-[420px] overflow-y-auto custom-scrollbar">
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
      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-150 ${
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

function CategoryLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-3 pb-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-white/20">{label}</span>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function FacebookAdsFilters({ filters, onChange, total }: FacebookAdsFiltersProps) {
  const set = (patch: Partial<FbAdsFilters>) => onChange({ ...filters, ...patch });

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const closeAll = useCallback(() => {
    setCheckoutOpen(false);
    setPlayerOpen(false);
    setSortOpen(false);
  }, []);

  const currentSort = SORT_OPTIONS.find(o => o.value === `${filters.orderBy}-${filters.order}`) ?? SORT_OPTIONS[0];
  const currentCheckout = filters.checkout ?? null;
  const currentPlayer = filters.player ?? null;

  // Agrupa por categoria para renderizar seções no dropdown
  const checkoutByCategory = CHECKOUT_PLATFORMS.reduce<Record<TechCategory, Technology[]>>(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {} as Record<TechCategory, Technology[]>
  );

  const checkoutCategories: TechCategory[] = ['BR_CHECKOUT', 'BR_ECOMMERCE', 'US_CHECKOUT', 'US_FUNNEL'];

  const activeCheckoutTech = CHECKOUT_PLATFORMS.find(t => t.name === currentCheckout);
  const activePlayerTech = VSL_PLATFORMS.find(t => t.name === currentPlayer);

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

      {/* ── Checkout / Plataforma ──────────────────────────────────────── */}
      {SHOW_CHECKOUT_FILTER && (
      <Dropdown
        isOpen={checkoutOpen}
        onToggle={() => { closeAll(); setCheckoutOpen(v => !v); }}
        onClose={() => setCheckoutOpen(false)}
        wide
        trigger={
          <span className="flex items-center gap-2">
            {activeCheckoutTech && (
              <TechBadge tech={activeCheckoutTech} />
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
        <DropdownItem
          onClick={() => { set({ checkout: undefined }); setCheckoutOpen(false); }}
          isActive={!currentCheckout}
        >
          <span className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] text-white/30 bg-white/5">∗</span>
            <span>Todos os Checkouts</span>
          </span>
        </DropdownItem>

        {checkoutCategories.map(cat => {
          const items = checkoutByCategory[cat];
          if (!items?.length) return null;
          return (
            <React.Fragment key={cat}>
              <CategoryLabel label={CATEGORY_LABELS[cat]} />
              {items.map(tech => (
                <DropdownItem
                  key={tech.name}
                  onClick={() => { set({ checkout: tech.name }); setCheckoutOpen(false); }}
                  isActive={currentCheckout === tech.name}
                >
                  <span className="flex items-center gap-2.5">
                    <TechBadge tech={tech} />
                    <span>{tech.name}</span>
                  </span>
                </DropdownItem>
              ))}
            </React.Fragment>
          );
        })}
      </Dropdown>
      )}

      {/* ── Player VSL ─────────────────────────────────────────────────── */}
      {SHOW_PLAYER_FILTER && (
      <Dropdown
        isOpen={playerOpen}
        onToggle={() => { closeAll(); setPlayerOpen(v => !v); }}
        onClose={() => setPlayerOpen(false)}
        trigger={
          <span className="flex items-center gap-2">
            <Video size={11} className="text-white/40" />
            {activePlayerTech && (
              <TechBadge tech={activePlayerTech} size="xs" />
            )}
            <span>{currentPlayer ? currentPlayer.toUpperCase() : 'PLAYER VSL'}</span>
            {currentPlayer && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); set({ player: undefined }); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); set({ player: undefined }); } }}
                className="ml-0.5 text-white/30 hover:text-red-400 transition-colors"
              >
                <X size={10} />
              </span>
            )}
          </span>
        }
      >
        <DropdownItem
          onClick={() => { set({ player: undefined }); setPlayerOpen(false); }}
          isActive={!currentPlayer}
        >
          <span className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] text-white/30 bg-white/5">∗</span>
            <span>Todos os Players</span>
          </span>
        </DropdownItem>

        <CategoryLabel label={CATEGORY_LABELS['VSL_PLAYER']} />

        {VSL_PLATFORMS.map(tech => (
          <DropdownItem
            key={tech.name}
            onClick={() => { set({ player: tech.name }); setPlayerOpen(false); }}
            isActive={currentPlayer === tech.name}
          >
            <span className="flex items-center gap-2.5">
              <TechBadge tech={tech} />
              <span className="flex-1">{tech.name}</span>
              {tech.note && (
                <span className="text-[8px] text-white/20 truncate max-w-[80px]" title={tech.note}>
                  ⚠ CDN
                </span>
              )}
            </span>
          </DropdownItem>
        ))}
      </Dropdown>
      )}

      {/* ── Ordenação ─────────────────────────────────────────────────── */}
      <Dropdown
        isOpen={sortOpen}
        onToggle={() => { closeAll(); setSortOpen(v => !v); }}
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
