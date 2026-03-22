'use client';

import React from 'react';
import { Play, Maximize2, Shield } from 'lucide-react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium VideoPlayerDopamine v2.0
// Features: Mastery High-Fidelity, Industrial Technical Video Node,
// Editorial Typography, Monospace Meta-Data, No Soft Gradients.
// ─────────────────────────────────────────────────────────────────

interface VideoPlayerDopamineProps {
  src: string;
  poster?: string | null;
  title?: string;
}

function getYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/embed/')) return url;
    }
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch { }
  return null;
}

function getVimeoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch { }
  return null;
}

export const VideoPlayerDopamine: React.FC<VideoPlayerDopamineProps> = ({ src, poster, title }) => {
  const yt = getYouTubeEmbed(src);
  const vimeo = getVimeoEmbed(src);
  const isEmbed = Boolean(yt || vimeo);
  const embedSrc = yt || vimeo || '';

  return (
    <div className="relative group/player rounded-[3.5rem] overflow-hidden bg-[#0a0a0a] border border-white/5 shadow-2xl">

      {/* Editorial Header Hub */}
      <div className="absolute top-0 inset-x-0 z-20 px-10 py-8 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col gap-1 drop-shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Node_Stream_Active</span>
          </div>
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
            {title || 'CONTEÚDO_DESCONHECIDO'}
          </h3>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
          <Shield size={12} className="text-green-500" />
          <span className="text-[9px] font-black text-white uppercase tracking-widest">PROTOCOLO_PROTEGIDO</span>
        </div>
      </div>

      {/* Decorative Corner Meta-Data */}
      <div className="absolute bottom-8 left-10 z-20 pointer-events-none opacity-0 group-hover/player:opacity-100 transition-opacity duration-500">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">RES_AUTO_ADAPTIVE</span>
          <span className="text-[8px] font-mono text-green-500/50">ENC::RAW_MEDIA_BLOB_ACTIVE</span>
        </div>
      </div>

      {/* Main Video Surface */}
      <div className="relative aspect-video w-full bg-black shadow-inner">
        {isEmbed ? (
          <iframe
            src={embedSrc}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={title || 'VSL_STREAM'}
          />
        ) : (
          <video
            className="w-full h-full object-cover"
            controls
            poster={poster || undefined}
          >
            <source src={src} />
            NODE_ERROR: VIDEO_FORMAT_NOT_SUPPORTED
          </video>
        )}

        {/* Overlay Darkener for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/20 pointer-events-none opacity-100 group-hover/player:opacity-0 transition-opacity duration-700" />
      </div>

      {/* Tactical Glow Footer */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-green-500 animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.5)]" />

    </div>
  );
};

export default VideoPlayerDopamine;
