"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Radio, Search, Loader2, ExternalLink, Eye, Heart, Share2, Flame, Play,
} from 'lucide-react';
import FeatureGate from '@/components/ui/FeatureGate';
import { adspyApi, ScaledAd, AdPlatform, AdspyQuery } from '@/lib/plus';
import { FeatureKey } from '@/lib/access';

const PLATFORMS: { id: AdPlatform; label: string; feature: FeatureKey }[] = [
  { id: 'youtube', label: 'YouTube Ads', feature: 'adspy_youtube' },
  { id: 'tiktok', label: 'TikTok Ads', feature: 'adspy_tiktok' },
];

const ORDER_OPTIONS: { value: NonNullable<AdspyQuery['orderBy']>; label: string }[] = [
  { value: 'escala', label: 'Mais escalados' },
  { value: 'views', label: 'Mais views' },
  { value: 'likes', label: 'Mais curtidas' },
  { value: 'lastSeen', label: 'Vistos recentemente' },
  { value: 'createdAt', label: 'Mais recentes' },
];

function compact(n: number | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function AdCard({ ad }: { ad: ScaledAd }) {
  return (
    <div className="group relative flex flex-col rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden hover:border-emerald-500/30 transition-colors">
      <div className="relative aspect-video bg-white/[0.02] overflow-hidden">
        {ad.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.thumbnailUrl} alt={ad.title || 'anúncio'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/10"><Play className="w-10 h-10" /></div>
        )}
        {ad.videoUrl && (
          <a href={ad.videoUrl} target="_blank" rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-12 h-12 text-white fill-white/80" />
          </a>
        )}
        {ad.escala ? (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <Flame className="w-3 h-3" /> {ad.escala}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {ad.advertiser && <span className="truncate text-[11px] font-bold uppercase tracking-wide text-emerald-400">{ad.advertiser}</span>}
        {ad.title && <h3 className="line-clamp-2 text-sm font-semibold text-white/90">{ad.title}</h3>}
        {ad.adCopy && <p className="line-clamp-2 text-[11px] text-white/40">{ad.adCopy}</p>}
        <div className="mt-auto flex items-center gap-3 text-[11px] text-white/40">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {compact(ad.views)}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {compact(ad.likes)}</span>
          <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {compact(ad.shares)}</span>
        </div>
        <div className="flex items-center gap-2">
          {ad.ctaText && <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/60">{ad.ctaText}</span>}
          {ad.landingUrl && (
            <a href={ad.landingUrl} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-[11px] text-emerald-400 hover:underline">
              Landing <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function AdspyBoard() {
  const [platform, setPlatform] = useState<AdPlatform>('youtube');
  const [ads, setAds] = useState<ScaledAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState<NonNullable<AdspyQuery['orderBy']>>('escala');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adspyApi.list(platform, { search: search || undefined, orderBy, limit: 48 });
      setAds(res.data);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar anúncios');
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [platform, search, orderBy]);

  useEffect(() => { load(); }, [load]);

  const activeFeature = PLATFORMS.find((p) => p.id === platform)!.feature;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPlatform(p.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wide transition ${
              platform === p.id ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Buscar anunciante, título ou copy..."
            className="w-full rounded-xl bg-white/5 border border-white/10 py-2 pl-10 pr-3 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
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

      <FeatureGate feature={activeFeature}>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-center text-red-300">{error}</div>
        ) : ads.length === 0 ? (
          <div className="py-20 text-center text-white/40">Nenhum anúncio coletado nesta plataforma ainda.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
          </div>
        )}
      </FeatureGate>
    </div>
  );
}

export default function AdspyPage() {
  return (
    <div className="relative min-h-screen">
      <div className="max-w-[1700px] mx-auto px-8 lg:px-12 pt-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="rounded-full bg-[#a855f7]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#c084fc]">Scaleaki+</span>
          </div>
          <h1 className="flex items-center gap-3 text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter">
            <Radio className="w-8 h-8 text-emerald-500" /> Ad <span className="text-emerald-500">Spy</span>
          </h1>
          <p className="mt-2 text-white/50">Anúncios escalados no YouTube e TikTok, ordenados por performance.</p>
        </motion.div>
        <AdspyBoard />
      </div>
    </div>
  );
}
