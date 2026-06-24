"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Search, Loader2, ExternalLink, Star, Flame, Tag, TrendingUp,
} from 'lucide-react';
import FeatureGate from '@/components/ui/FeatureGate';
import {
  marketplaceApi, ScaledProduct, ProductSource, MarketplaceQuery,
} from '@/lib/plus';
import { FeatureKey } from '@/lib/access';

const SOURCES: { id: ProductSource; label: string; feature: FeatureKey }[] = [
  { id: 'dropshipping', label: 'Dropshipping', feature: 'marketplace_dropshipping' },
  { id: 'mercadolivre', label: 'Mercado Livre', feature: 'marketplace_mercadolivre' },
  { id: 'aliexpress', label: 'AliExpress', feature: 'marketplace_aliexpress' },
  { id: 'shopee', label: 'Shopee', feature: 'marketplace_shopee' },
  { id: 'shein', label: 'Shein', feature: 'marketplace_shein' },
];

const ORDER_OPTIONS: { value: NonNullable<MarketplaceQuery['orderBy']>; label: string }[] = [
  { value: 'escala', label: 'Mais escalados' },
  { value: 'soldCount', label: 'Mais vendidos' },
  { value: 'discountPct', label: 'Maior desconto' },
  { value: 'price', label: 'Menor preço' },
  { value: 'createdAt', label: 'Mais recentes' },
];

function brl(v: number | null, currency: string | null): string {
  if (v == null) return '—';
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(v);
  } catch {
    return `R$ ${v.toFixed(2)}`;
  }
}

function ProductCard({ p }: { p: ScaledProduct }) {
  return (
    <a
      href={p.productUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden hover:border-emerald-500/30 transition-colors"
    >
      <div className="relative aspect-square bg-white/[0.02] overflow-hidden">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/10"><ShoppingBag className="w-10 h-10" /></div>
        )}
        {p.discountPct ? (
          <span className="absolute top-2 left-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-black">
            -{p.discountPct}%
          </span>
        ) : null}
        {p.escala ? (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <Flame className="w-3 h-3" /> {p.escala}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-white/90">{p.title}</h3>
        {p.storeName && <span className="truncate text-[11px] text-white/40">{p.storeName}</span>}
        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="text-base font-black text-emerald-400">{brl(p.price, p.currency)}</span>
            {p.originalPrice && p.originalPrice > (p.price ?? 0) && (
              <span className="ml-1 text-[11px] text-white/30 line-through">{brl(p.originalPrice, p.currency)}</span>
            )}
          </div>
          {p.soldCount ? (
            <span className="flex items-center gap-1 text-[11px] text-white/40">
              <TrendingUp className="w-3 h-3" /> {p.soldCount}
            </span>
          ) : null}
        </div>
        {p.rating ? (
          <span className="flex items-center gap-1 text-[11px] text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" /> {p.rating.toFixed(1)}
            {p.reviewCount ? <span className="text-white/30">({p.reviewCount})</span> : null}
          </span>
        ) : null}
      </div>
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="w-4 h-4 text-emerald-400" />
      </div>
    </a>
  );
}

function MarketplaceBoard() {
  const [source, setSource] = useState<ProductSource>('dropshipping');
  const [products, setProducts] = useState<ScaledProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [discountMin, setDiscountMin] = useState('');
  const [orderBy, setOrderBy] = useState<NonNullable<MarketplaceQuery['orderBy']>>('escala');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await marketplaceApi.list(source, {
        search: search || undefined,
        category: category || undefined,
        discountMin: discountMin ? Number(discountMin) : undefined,
        orderBy,
        limit: 48,
      });
      setProducts(res.data);
      setLimitReached(res.limitReached);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar produtos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [source, search, category, discountMin, orderBy]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setCategory('');
    marketplaceApi.categories(source).then((r) => setCategories(r.data)).catch(() => setCategories([]));
  }, [source]);

  const activeFeature = SOURCES.find((s) => s.id === source)!.feature;

  return (
    <div className="space-y-6">
      {/* Seletor de origem */}
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSource(s.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wide transition ${
              source === s.id ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Buscar produto ou loja..."
            className="w-full rounded-xl bg-white/5 border border-white/10 py-2 pl-10 pr-3 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl bg-white/5 border border-white/10 py-2 px-3 text-sm text-white focus:outline-none"
        >
          <option value="">Todas categorias</option>
          {categories.map((c) => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
        </select>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="number"
            value={discountMin}
            onChange={(e) => setDiscountMin(e.target.value)}
            placeholder="Desc. mín %"
            className="w-32 rounded-xl bg-white/5 border border-white/10 py-2 pl-10 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
        </div>
        <select
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value as any)}
          className="rounded-xl bg-white/5 border border-white/10 py-2 px-3 text-sm text-white focus:outline-none"
        >
          {ORDER_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>)}
        </select>
      </div>

      {/* Banner de amostra */}
      {limitReached && (
        <div className="rounded-xl border border-[#a855f7]/30 bg-[#a855f7]/10 px-4 py-3 text-sm text-[#c084fc]">
          ⚡ Você está vendo uma amostra. O Scaleaki+ libera o catálogo completo dos 5 marketplaces.
        </div>
      )}

      {/* Conteúdo gated por feature da origem ativa */}
      <FeatureGate feature={activeFeature}>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-center text-red-300">{error}</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-white/40">Nenhum produto encontrado nesta origem ainda.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </FeatureGate>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <div className="relative min-h-screen">
      <div className="max-w-[1700px] mx-auto px-8 lg:px-12 pt-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="rounded-full bg-[#a855f7]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#c084fc]">Scaleaki+</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter">
            Marketplaces <span className="text-emerald-500">Escalados</span>
          </h1>
          <p className="mt-2 text-white/50">Produtos em alta nos 5 maiores marketplaces, ordenados por escala.</p>
        </motion.div>
        <MarketplaceBoard />
      </div>
    </div>
  );
}
