"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clapperboard, Loader2, Play, Clock, X } from 'lucide-react';
import PlusGate from '@/components/ui/PlusGate';
import { scaleflixApi, ScaleflixVideo } from '@/lib/plus';

function fmtDuration(sec: number | null): string {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Converte URL do YouTube/Vimeo em embed; senão devolve como está. */
function toEmbed(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

function VideoModal({ video, onClose }: { video: ScaleflixVideo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/60 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
          <iframe
            src={toEmbed(video.videoUrl)}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        </div>
        <h3 className="mt-4 text-lg font-black text-white">{video.title}</h3>
        {video.description && <p className="mt-1 text-sm text-white/50">{video.description}</p>}
      </div>
    </div>
  );
}

function VideoCard({ v, onPlay }: { v: ScaleflixVideo; onPlay: () => void }) {
  return (
    <button onClick={onPlay} className="group flex flex-col rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden text-left hover:border-emerald-500/30 transition-colors">
      <div className="relative aspect-video bg-white/[0.02] overflow-hidden">
        {v.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/10"><Clapperboard className="w-10 h-10" /></div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-12 h-12 text-white fill-white/80" />
        </div>
        {v.durationSec ? (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
            <Clock className="w-3 h-3" /> {fmtDuration(v.durationSec)}
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-white/90">{v.title}</h3>
        {v.description && <p className="mt-1 line-clamp-2 text-[11px] text-white/40">{v.description}</p>}
      </div>
    </button>
  );
}

function ScaleflixBoard() {
  const [videos, setVideos] = useState<ScaleflixVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<ScaleflixVideo | null>(null);

  useEffect(() => {
    scaleflixApi.list()
      .then((r) => setVideos(r.data))
      .catch((e) => setError(e.message || 'Erro ao carregar vídeos'))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ScaleflixVideo[]>();
    for (const v of videos) {
      const k = v.module || 'Geral';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(v);
    }
    return Array.from(map.entries());
  }, [videos]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-center text-red-300">{error}</div>;
  if (videos.length === 0) return <div className="py-20 text-center text-white/40">Nenhuma videoaula publicada ainda.</div>;

  return (
    <div className="space-y-12">
      {grouped.map(([module, items]) => (
        <section key={module}>
          <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-white/60">{module}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((v) => <VideoCard key={v.id} v={v} onPlay={() => setActive(v)} />)}
          </div>
        </section>
      ))}
      {active && <VideoModal video={active} onClose={() => setActive(null)} />}
    </div>
  );
}

export default function ScaleflixPage() {
  return (
    <div className="relative min-h-screen">
      <div className="max-w-[1700px] mx-auto px-8 lg:px-12 pt-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="rounded-full bg-[#a855f7]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#c084fc]">Scaleaki+</span>
          </div>
          <h1 className="flex items-center gap-3 text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter">
            <Clapperboard className="w-8 h-8 text-emerald-500" /> Scale<span className="text-emerald-500">flix</span>
          </h1>
          <p className="mt-2 text-white/50">Videoaulas de como extrair o máximo do Scaleaki, do onboarding ao avançado.</p>
        </motion.div>
        <PlusGate upsell="As videoaulas Scaleflix são exclusivas do Scaleaki+.">
          <ScaleflixBoard />
        </PlusGate>
      </div>
    </div>
  );
}
