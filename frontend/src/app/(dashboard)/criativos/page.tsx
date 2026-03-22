"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useOfertaContext } from '@/context/OfertaContext';
import {
  Image,
  Video,
  FileImage,
  Download,
  ExternalLink,
  Search,
  Filter,
  Activity,
  Layers,
  Zap,
  Globe,
  Clock,
  ShieldCheck,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { Card3D } from '@/components/ui/Card3D';
import { motion, AnimatePresence } from 'framer-motion';
import { useCounter } from '@/hooks/useCounter';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium CriativosMatrix v3.5
// Design Path: Mastery High-Fidelity / Tactical Asset Intelligence
// ─────────────────────────────────────────────────────────────────

interface Criativo {
  id: string;
  url: string;
  tipo: 'imagem' | 'vsl' | 'video';
  ofertaId: string;
  ofertaTitulo: string;
  createdAt: string;
}

export default function CriativosPage() {
  const { ofertas, fetchOfertas } = useOfertaContext();
  const [criativos, setCriativos] = useState<Criativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'imagem' | 'vsl' | 'video'>('todos');
  const [ofertasCompletas, setOfertasCompletas] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchOfertas({ limit: 1000 });
  }, [fetchOfertas]);

  // Capturar dados completos
  useEffect(() => {
    if (ofertas.length === 0) {
      if (!loading) return; // Se parou de carregar e não tem ofertas
      setLoading(false);
      return;
    }

    const buscarOfertasCompletas = async () => {
      setLoading(true);
      try {
        const ofertasDetalhadas = await Promise.all(
          ofertas.map(async (oferta) => {
            try {
              const response = await fetch(`/api/ofertas/${oferta.id}`, { cache: 'no-store' });
              const data = await response.json();
              if (response.ok) return data.data || data;
              return oferta;
            } catch {
              return oferta;
            }
          })
        );
        setOfertasCompletas(ofertasDetalhadas);
      } catch (error) {
        setOfertasCompletas(ofertas);
      }
    };

    buscarOfertasCompletas();
  }, [ofertas]);

  // Processar criativos
  useEffect(() => {
    if (ofertasCompletas.length === 0) {
      if (ofertas.length === 0) setLoading(false);
      return;
    }

    const todosCriativos: Criativo[] = [];
    ofertasCompletas.forEach((oferta) => {
      if (!oferta) return;

      if (oferta.imagem) {
        todosCriativos.push({
          id: `img-${oferta.id}-main`,
          url: oferta.imagem,
          tipo: 'imagem',
          ofertaId: oferta.id,
          ofertaTitulo: oferta.titulo,
          createdAt: oferta.createdAt as string,
        });
      }

      if (oferta.vsl) {
        todosCriativos.push({
          id: `vsl-${oferta.id}`,
          url: oferta.vsl,
          tipo: 'vsl',
          ofertaId: oferta.id,
          ofertaTitulo: oferta.titulo,
          createdAt: oferta.createdAt as string,
        });
      }

      let linksArray: string[] = [];
      if (oferta.links) {
        if (Array.isArray(oferta.links)) {
          linksArray = oferta.links;
        } else if (typeof oferta.links === 'string') {
          try {
            let parsed = JSON.parse(oferta.links);
            // Handle double-stringified JSON
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
            if (Array.isArray(parsed)) {
              linksArray = parsed;
            } else if (parsed && typeof parsed === 'object') {
              // Handle {criativos: [...]} format from bot
              if (Array.isArray(parsed.criativos)) linksArray.push(...parsed.criativos);
              Object.entries(parsed).forEach(([key, val]) => {
                if (key !== 'criativos' && key !== 'html' && Array.isArray(val)) {
                  linksArray.push(...(val as string[]));
                }
              });
            } else {
              linksArray = [oferta.links];
            }
          } catch {
            if (oferta.links.startsWith('http')) linksArray = [oferta.links];
          }
        } else if (typeof oferta.links === 'object') {
          // Handle non-stringified object
          const linksObj = oferta.links as any;
          if (Array.isArray(linksObj.criativos)) linksArray.push(...linksObj.criativos);
          Object.entries(linksObj).forEach(([key, val]) => {
            if (key !== 'criativos' && key !== 'html' && Array.isArray(val)) {
              linksArray.push(...(val as string[]));
            }
          });
        }
      }

      linksArray.forEach((link, index) => {
        if (!link || typeof link !== 'string' || link.trim() === '') return;

        const isImage = /\.(jpg|jpeg|png|webp|gif|svg|bmp|ico)(\?|$)/i.test(link) || link.includes('images');
        const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(link) || link.includes('videos');

        if (isImage) {
          todosCriativos.push({
            id: `link-img-${oferta.id}-${index}`,
            url: link,
            tipo: 'imagem',
            ofertaId: oferta.id,
            ofertaTitulo: oferta.titulo,
            createdAt: oferta.updatedAt || oferta.createdAt || new Date().toISOString(),
          });
        } else if (isVideo || link.includes('vsl') || link.includes('video')) {
          todosCriativos.push({
            id: `link-video-${oferta.id}-${index}`,
            url: link,
            tipo: link.includes('vsl') ? 'vsl' : 'video',
            ofertaId: oferta.id,
            ofertaTitulo: oferta.titulo,
            createdAt: oferta.updatedAt || oferta.createdAt || new Date().toISOString(),
          });
        }
      });
    });

    todosCriativos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const criativosUnicos = todosCriativos.filter((c, i, s) => s.findIndex(x => x.url === c.url && x.ofertaId === c.ofertaId) === i);

    setCriativos(criativosUnicos);
    setLoading(false);
  }, [ofertasCompletas]);

  const criativosFiltrados = useMemo(() => {
    let filtrados = criativos;
    if (filterTipo !== 'todos') filtrados = filtrados.filter(c => c.tipo === filterTipo);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(c => c.ofertaTitulo.toLowerCase().includes(term) || c.url.toLowerCase().includes(term));
    }
    return filtrados;
  }, [criativos, filterTipo, searchTerm]);

  const totalCount = useCounter(criativos.length, { duration: 1500 });
  const imagesCount = useCounter(criativos.filter(c => c.tipo === 'imagem').length, { duration: 1500 });
  const videoCount = useCounter(criativos.filter(c => c.tipo !== 'imagem').length, { duration: 1500 });

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'imagem': return { label: 'IMG_STATIC', color: 'text-green-500', bg: 'bg-green-500/10', icon: FileImage };
      case 'vsl': return { label: 'VSL_STREAM', color: 'text-cyan-500', bg: 'bg-cyan-500/10', icon: Video };
      case 'video': return { label: 'MP4_MOTION', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Video };
      default: return { label: 'GENERIC_ASSET', color: 'text-white/40', bg: 'bg-white/5', icon: Layers };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-black">
        <div className="w-20 h-20 relative">
          <div className="absolute inset-0 border-2 border-green-500/20 rounded-full animate-ping" />
          <div className="absolute inset-0 border-t-2 border-green-500 rounded-full animate-spin" />
          <Cpu size={32} className="absolute inset-0 m-auto text-green-500 animate-pulse" />
        </div>
        <span className="mt-10 text-[10px] font-black text-white/20 uppercase tracking-[0.8em] animate-pulse">Sincronizando Matriz de Criativos</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative pb-32">

      {/* Editorial Header Hub */}
      <div className="relative pt-16 pb-12 px-8 lg:px-16 max-w-[1800px] mx-auto border-b border-white/5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Central_Assets // DATAHUB</span>
                <span className="text-[10px] text-white/10 italic">Global_Scan_Active</span>
              </div>
            </div>

            <h1 className="text-7xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
              DIRETÓRIO <br />
              <span className="text-green-500">CRIATIVOS</span>
            </h1>

            <div className="flex items-center gap-6">
              <div className="bg-white/5 px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
                <ShieldCheck size={12} className="text-green-500" />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Protocolo de Alta Fidelidade Ativo</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-white/20" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">
                  Último Scan: {mounted ? new Date().toLocaleTimeString() : '--:--:--'}
                </span>
              </div>
            </div>
          </div>

          {/* Industrial HUD Metrics */}
          <div className="grid grid-cols-3 gap-8 min-w-[450px]">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Ativos_Total</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white italic">{totalCount.count.toString().padStart(2, '0')}</span>
                <span className="text-[10px] font-black text-white/10 uppercase italic">Nodes</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Img_Matrix</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-green-500 italic">{imagesCount.count.toString().padStart(2, '0')}</span>
                <span className="text-[10px] font-black text-white/10 uppercase italic">Units</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Motion_Scope</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-cyan-500 italic">{videoCount.count.toString().padStart(2, '0')}</span>
                <span className="text-[10px] font-black text-white/10 uppercase italic">Flows</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Control Bar */}
      <div className="max-w-[1800px] mx-auto px-8 lg:px-16 py-12">
        <div className="flex flex-col xl:flex-row gap-8 items-stretch">
          {/* Search Module */}
          <div className="relative group flex-1">
            <div className="absolute -inset-2 bg-green-500/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-green-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="FILTRAR MATRIZ DE ASSETS..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-6 bg-white/[0.02] border border-white/10 rounded-[2rem] text-[12px] font-black text-white placeholder:text-white/10 outline-none focus:border-green-500/50 transition-all uppercase tracking-[0.2em] italic"
            />
          </div>

          {/* Type Filters HUB */}
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
            {(['todos', 'imagem', 'vsl', 'video'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFilterTipo(tipo)}
                className={clsx(
                  "px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                  filterTipo === tipo
                    ? "bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                    : "text-white/20 hover:text-white/60 hover:bg-white/5"
                )}
              >
                {tipo === 'todos' ? 'FULL_SCAN' : tipo.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assets Matrix Grid */}
      <div className="max-w-[1800px] mx-auto px-8 lg:px-16">
        {criativosFiltrados.length === 0 ? (
          <div className="h-[40vh] border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center">
            <Layers className="w-20 h-20 text-white/5 mb-8" />
            <h2 className="text-[12px] font-black text-white/20 uppercase tracking-[0.8em]">Fluxo_Inexistente</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
            {criativosFiltrados.map((criativo, idx) => {
              const badge = getTipoBadge(criativo.tipo);
              const Icon = badge.icon;

              return (
                <motion.div
                  key={criativo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <Card3D
                    variant="glass"
                    has3DRotation
                    className="group relative flex flex-col p-8 bg-[#0d0d0d] border-white/5 rounded-[3rem] overflow-hidden hover:border-green-500/20 transition-all duration-700"
                  >
                    {/* Asset Viewport */}
                    <div className="relative h-64 w-full bg-[#080808] rounded-[2rem] overflow-hidden mb-8 border border-white/5 group-hover:border-green-500/30 transition-all duration-700">
                      {criativo.tipo === 'imagem' ? (
                        <img
                          src={criativo.url}
                          alt={criativo.ofertaTitulo}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%230a0a0a" width="400" height="300"/%3E%3Ctext fill="%23333" x="50%25" y="50%25" text-anchor="middle" font-family="monospace" font-size="20"%3E_INVALID_RESOURCE_%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-br from-[#0d0d0d] to-black">
                          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-green-500/50 group-hover:scale-110 transition-all duration-700">
                            <Video size={36} className={badge.color} />
                          </div>
                          <span className="mt-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Motion_Pulse_Detected</span>
                        </div>
                      )}

                      {/* Asset Metadata HUD Overlay */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10", badge.bg)}>
                          <Icon size={12} className={badge.color} />
                          <span className={clsx("text-[9px] font-black uppercase tracking-widest", badge.color)}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="bg-black/80 backdrop-blur-md p-2 rounded-xl border border-white/10">
                          <Globe size={12} className="text-white/40" />
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex-1 space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-green-500/40 uppercase tracking-[0.3em]">Node_Provenance // OFERTA</span>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-green-500 transition-colors duration-500 truncate">
                          {criativo.ofertaTitulo}
                        </h3>
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group-hover:bg-white/[0.04] transition-all">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Resource_Link</span>
                          <span className="text-[10px] font-mono text-white/40 truncate w-[140px]">
                            {criativo.url.split('/').pop()}
                          </span>
                        </div>
                        <ShieldCheck size={14} className="text-green-500/30" />
                      </div>

                      {/* Tactical Action Menu */}
                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={() => window.open(criativo.url, '_blank')}
                          className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-green-500 text-white/40 hover:text-black transition-all duration-500 font-black text-[10px] uppercase tracking-widest group/btn"
                        >
                          <ExternalLink size={14} className="group-hover/btn:scale-110 transition-transform" />
                          Explorar
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = criativo.url;
                            link.download = `${criativo.ofertaTitulo}-${criativo.tipo}`;
                            link.target = '_blank';
                            link.click();
                          }}
                          className="w-14 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 text-white/20 hover:text-white transition-all duration-500"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  </Card3D>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
