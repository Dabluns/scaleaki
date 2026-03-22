'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Oferta } from '@/types/oferta';
import { FileText, Image, Lightbulb, Link2, Info, Activity, Database, Play, Video, ExternalLink, Trash2, Download } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { AnunciosChart } from './AnunciosChart';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium OfferDetails v2.0
// Features: Mastery High-Fidelity, Tactical Tab Interface,
// Industrial Typography, No Gradients, Neon Accents.
// ─────────────────────────────────────────────────────────────────

interface OfferDetailsProps {
  oferta: Oferta;
}

type TabType = 'descricao' | 'criativos' | 'insights';

export const OfferDetails: React.FC<OfferDetailsProps> = ({ oferta }) => {
  const [activeTab, setActiveTab] = useState<TabType>('descricao');
  const { isAdmin } = useAuth();
  const [textoExpanded, setTextoExpanded] = useState(false);

  const normalizeLinks = (links: any): string[] => {
    if (!links) return [];
    if (Array.isArray(links)) return links;
    if (typeof links === 'string') {
      try {
        let parsed = JSON.parse(links);
        // Handle double-stringified JSON
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        if (Array.isArray(parsed)) return parsed;
        // Handle {criativos: [...], html: '...'} format from bot
        if (parsed && typeof parsed === 'object') {
          const urls: string[] = [];
          if (Array.isArray(parsed.criativos)) urls.push(...parsed.criativos);
          // Add any other URL arrays if present
          Object.entries(parsed).forEach(([key, val]) => {
            if (key !== 'criativos' && key !== 'html' && Array.isArray(val)) {
              urls.push(...(val as string[]));
            }
          });
          return urls;
        }
        return [links];
      } catch { return links.startsWith('http') ? [links] : []; }
    }
    // Handle object directly (not stringified)
    if (typeof links === 'object' && links !== null) {
      const urls: string[] = [];
      if (Array.isArray(links.criativos)) urls.push(...links.criativos);
      Object.entries(links).forEach(([key, val]) => {
        if (key !== 'criativos' && key !== 'html' && Array.isArray(val)) {
          urls.push(...(val as string[]));
        }
      });
      return urls;
    }
    return [];
  };

  const [links, setLinks] = useState<string[]>(() => normalizeLinks(oferta.links));
  useEffect(() => setLinks(normalizeLinks(oferta.links)), [oferta.links]);

  // Categorizar links por tipo
  const categorizedLinks = useMemo(() => links.map(link => {
    const isImage = /\.(jpg|jpeg|png|webp|gif|svg|bmp)(\?|$)/i.test(link) || (link.includes('/images/') && !link.includes('/videos/'));
    const isVideo = /\.(mp4|webm|mov|avi|mkv|ogg)(\?|$)/i.test(link) || link.includes('/videos/');
    return { url: link, type: isImage ? 'image' as const : isVideo ? 'video' as const : 'other' as const };
  }), [links]);

  async function removeLink(target: string) {
    const next = links.filter(l => l !== target);
    setLinks(next);
    try {
      await fetch('/api/ofertas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: (oferta as any).id, links: next })
      });
    } catch { }
  }

  const tabs = [
    { id: 'descricao' as TabType, label: 'RELATÓRIO DE CÓPIA', icon: FileText },
    { id: 'criativos' as TabType, label: 'BANCO DE ASSETS', icon: Image },
    { id: 'insights' as TabType, label: 'INTELIGÊNCIA', icon: Activity },
  ];

  return (
    <div className="flex flex-col gap-10">

      {/* Tactical Tab Hub */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all",
                active ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white"
              )}
            >
              <Icon size={14} className={clsx(active ? "text-black" : "text-white/40")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Core */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'descricao' && (
            <motion.div
              key="desc"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="relative"
            >
              <div className="p-8 lg:p-10 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                  <FileText size={160} className="text-white" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-green-500/60">Transcrição de Texto Original</h2>
                  </div>

                  {!oferta.texto || oferta.texto === 'Sem descrição' ? (
                    <div className="text-lg font-black text-white/30 italic uppercase tracking-tighter">
                      CONTEÚDO NÃO INDEXADO
                    </div>
                  ) : (
                    <>
                      {/* Text content with collapse/expand */}
                      <div className="relative">
                        <div
                          className="text-[15px] font-bold text-white/70 leading-relaxed whitespace-pre-line max-w-4xl transition-all duration-500 overflow-hidden"
                          style={{
                            maxHeight: textoExpanded ? '100000px' : '180px',
                          }}
                        >
                          {oferta.texto}
                        </div>

                        {/* Gradient fade overlay (only when collapsed and text is long) */}
                        {!textoExpanded && oferta.texto.length > 300 && (
                          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent pointer-events-none" />
                        )}
                      </div>

                      {/* Read more / Read less button */}
                      {oferta.texto.length > 300 && (
                        <button
                          onClick={() => setTextoExpanded(!textoExpanded)}
                          className="mt-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 group/btn"
                        >
                          <span className={`${textoExpanded ? 'text-white/40 hover:text-white' : 'text-green-500 hover:text-green-400'} transition-colors`}>
                            {textoExpanded ? '↑ REDUZIR TEXTO' : '↓ LER TRANSCRIÇÃO COMPLETA'}
                          </span>
                          <div className={`h-px flex-1 max-w-[100px] transition-all duration-500 ${textoExpanded ? 'bg-white/10' : 'bg-green-500/30'}`} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'criativos' && (
            <motion.div
              key="assets"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Stats Bar */}
              <div className="flex items-center gap-6 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                    {categorizedLinks.length} Assets Indexados
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                  <span className="text-green-500/50">{categorizedLinks.filter(l => l.type === 'image').length} IMG</span>
                  <span className="text-cyan-500/50">{categorizedLinks.filter(l => l.type === 'video').length} VID</span>
                  <span className="text-purple-500/50">{categorizedLinks.filter(l => l.type === 'other').length} URL</span>
                </div>
              </div>

              {/* Unified Asset Grid */}
              {categorizedLinks.length === 0 ? (
                <div className="h-[30vh] border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center">
                  <Image className="w-16 h-16 text-white/5 mb-4" />
                  <span className="text-[10px] font-black text-white/15 uppercase tracking-[0.5em]">Nenhum Asset Encontrado</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {categorizedLinks.map(({ url, type }, i) => (
                    <div key={i} className="group relative aspect-[4/3] rounded-[1.5rem] overflow-hidden border border-white/10 hover:border-green-500/30 transition-all duration-500 shadow-2xl bg-[#0a0a0a]">

                      {/* THUMBNAIL */}
                      {type === 'image' ? (
                        <img
                          src={url}
                          alt={`Asset ${i + 1}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : type === 'video' ? (
                        <video
                          src={url}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          muted
                          preload="metadata"
                          playsInline
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => { })}
                          onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#111] to-[#0a0a0a]">
                          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-3">
                            <Link2 size={28} className="text-purple-500/60" />
                          </div>
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">External Link</span>
                        </div>
                      )}

                      {/* Fallback for broken images */}
                      <div className="hidden w-full h-full flex-col items-center justify-center bg-[#0a0a0a]">
                        <Image size={32} className="text-white/10 mb-2" />
                        <span className="text-[8px] text-white/10 uppercase">Erro ao carregar</span>
                      </div>

                      {/* TYPE BADGE */}
                      <div className="absolute top-3 left-3 z-10">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10 ${type === 'image' ? 'bg-green-500/10' : type === 'video' ? 'bg-cyan-500/10' : 'bg-purple-500/10'
                          }`}>
                          {type === 'video' && <Play size={10} className="text-cyan-500" />}
                          {type === 'image' && <Image size={10} className="text-green-500" />}
                          {type === 'other' && <Link2 size={10} className="text-purple-500" />}
                          <span className={`text-[8px] font-black uppercase tracking-wider ${type === 'image' ? 'text-green-500' : type === 'video' ? 'text-cyan-500' : 'text-purple-500'
                            }`}>
                            {type === 'image' ? 'IMG' : type === 'video' ? 'VIDEO' : 'LINK'}
                          </span>
                        </div>
                      </div>

                      {/* PLAY ICON for videos */}
                      {type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <Play size={24} className="text-white ml-1" fill="white" />
                          </div>
                        </div>
                      )}

                      {/* HOVER OVERLAY with actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                        {/* File name */}
                        <span className="text-[9px] font-mono text-white/50 truncate mb-3">
                          {url.split('/').pop()?.substring(0, 30)}
                        </span>
                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-black rounded-xl hover:scale-[1.02] transition-transform text-[9px] font-black uppercase tracking-wider"
                          >
                            <ExternalLink size={12} />
                            Abrir
                          </a>
                          <a
                            href={url}
                            download
                            target="_blank"
                            className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all"
                          >
                            <Download size={14} />
                          </a>
                          {isAdmin && (
                            <button
                              onClick={() => removeLink(url)}
                              className="w-10 h-10 flex items-center justify-center bg-red-500/20 backdrop-blur-sm text-red-400 rounded-xl hover:bg-red-500/40 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="intel"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="p-10 rounded-[3rem] bg-[#050505] border border-white/5 relative overflow-hidden">
                <AnunciosChart oferta={oferta} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'CLASSIFICAÇÃO', value: oferta.tipoOferta || 'N/A' },
                  { label: 'STATUS ATUAL', value: oferta.status || 'N/A' },
                  { label: 'VALOR ESTIMADO', value: oferta.receita ? `R$ ${oferta.receita.toLocaleString()}` : 'CONFIDENCIAL' }
                ].map((item, i) => (
                  <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] block mb-2">{item.label}</span>
                    <span className="text-xl font-black text-white italic uppercase">{item.value}</span>
                  </div>
                ))}
              </div>

              {oferta.tags && oferta.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {oferta.tags.map((tag, i) => (
                    <span key={i} className="px-4 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-[10px] font-black text-white/50 uppercase tracking-widest">#{tag}</span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
