'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ExternalLink, Copy, Check, Flame, Megaphone, Clock,
  Heart, Calendar, Globe, TrendingUp, Loader2
} from 'lucide-react';
import { AnuncioFacebook, calcDaysOnAir, formatLikes } from '@/hooks/useFacebookAds';
import { FunnelAnalysisTab } from './FunnelAnalysisTab';

interface FacebookAdDetailsProps {
  anuncioId: string;
  onClose: () => void;
  onFunnelScan: (id: string) => Promise<void>;
  fetchById: (id: string) => Promise<AnuncioFacebook | null>;
}

type Tab = 'criativo' | 'detalhes' | 'funil';

export function FacebookAdDetails({ anuncioId, onClose, onFunnelScan, fetchById }: FacebookAdDetailsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('criativo');
  const [anuncio, setAnuncio] = useState<AnuncioFacebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchById(anuncioId).then(data => {
      setAnuncio(data);
      setLoading(false);
    });
  }, [anuncioId, fetchById]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const daysOnAir = calcDaysOnAir(anuncio?.deliveryStartTime ?? null);
  const isActive = !!(anuncio?.isActive && !anuncio?.deliveryStopTime);

  const platforms: string[] = (() => {
    try { return JSON.parse(anuncio?.publisherPlatforms || '[]'); } catch { return []; }
  })();

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'criativo', label: 'Criativo' },
    { id: 'detalhes', label: 'Detalhes' },
    { id: 'funil', label: 'Funil ↗' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-black/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow superior */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />

          {/* ── HEADER ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-white/5">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-2xl">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all"
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* ── CONTENT ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 size={32} className="animate-spin text-green-400" />
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Carregando Dossiê...</span>
                </div>
              </div>
            ) : !anuncio ? (
              <div className="h-[50vh] flex items-center justify-center">
                <p className="text-white/20 text-sm">Anúncio não encontrado</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* ── ABA: CRIATIVO ─────────────────────────────── */}
                {activeTab === 'criativo' && (
                  <motion.div
                    key="criativo"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-0"
                  >
                    {/* Embed do criativo */}
                    <div className="relative min-h-[420px] bg-black border-r border-white/5 flex items-center justify-center overflow-hidden">
                      {anuncio.adSnapshotUrl ? (
                        <iframe
                          src={anuncio.adSnapshotUrl}
                          className="w-full h-full min-h-[420px] border-0"
                          sandbox="allow-same-origin allow-scripts"
                          title="Criativo do anúncio"
                        />
                      ) : anuncio.landingScreenshot ? (
                        <img
                          src={anuncio.landingScreenshot}
                          alt="Landing"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-white/10">
                          <Globe size={40} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Sem Preview</span>
                        </div>
                      )}
                    </div>

                    {/* Info da página + copy */}
                    <div className="p-8 space-y-6">
                      {/* Página */}
                      <div className="flex items-center gap-4">
                        {anuncio.pageProfilePic ? (
                          <img src={anuncio.pageProfilePic} alt="" className="w-12 h-12 rounded-full border border-white/10 object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 font-black">
                            {anuncio.pageName?.[0] || 'P'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-black text-white">{anuncio.pageName || 'Página'}</p>
                          {anuncio.pageLikes != null && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Heart size={10} className="text-pink-400" />
                              <span className="text-[10px] text-white/40 font-bold">{formatLikes(anuncio.pageLikes)} curtidas</span>
                            </div>
                          )}
                        </div>
                        <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded border text-[9px] font-black uppercase tracking-widest ${
                          isActive
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-white/5 border-white/10 text-white/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
                          {isActive ? 'Ativo' : 'Inativo'}
                        </div>
                      </div>

                      {/* Copy do anúncio */}
                      {anuncio.adCopy && (
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Copy do Anúncio</span>
                            <button
                              onClick={() => handleCopy(anuncio.adCopy!)}
                              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-white/30 hover:text-green-400 transition-colors"
                            >
                              {copied ? <><Check size={10} /> Copiado</> : <><Copy size={10} /> Copiar</>}
                            </button>
                          </div>
                          <p className="text-xs text-white/70 leading-relaxed">{anuncio.adCopy}</p>
                          {anuncio.adHeadline && (
                            <p className="text-[11px] font-black text-white/50 border-t border-white/5 pt-2">{anuncio.adHeadline}</p>
                          )}
                        </div>
                      )}

                      {/* Links rápidos */}
                      <div className="space-y-2">
                        {anuncio.destinationUrl && (
                          <a
                            href={anuncio.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-green-500/30 hover:text-green-400 text-white/40 transition-all group"
                          >
                            <Globe size={12} />
                            <span className="text-[10px] font-black uppercase tracking-wider flex-1 truncate">{anuncio.destinationUrl}</span>
                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )}
                        {anuncio.adSnapshotUrl && (
                          <a
                            href={anuncio.adSnapshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 text-blue-400/60 hover:text-blue-400 transition-all group"
                          >
                            <ExternalLink size={12} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Ver na Biblioteca do Facebook</span>
                            <ExternalLink size={10} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── ABA: DETALHES ─────────────────────────────── */}
                {activeTab === 'detalhes' && (
                  <motion.div
                    key="detalhes"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-8 space-y-6"
                  >
                    {/* Métricas principais */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { icon: <Flame size={16} className="text-orange-400" />, label: 'Escala', value: anuncio.escala ?? 0, color: 'orange' },
                        { icon: <Megaphone size={16} className="text-purple-400" />, label: 'Duplicatas', value: anuncio.duplicatas ?? 0, color: 'purple' },
                        { icon: <Clock size={16} className="text-cyan-400" />, label: 'Dias no ar', value: daysOnAir, color: 'cyan' },
                        { icon: <Heart size={16} className="text-pink-400" />, label: 'Curtidas da Página', value: formatLikes(anuncio.pageLikes), color: 'pink' },
                      ].map((metric) => (
                        <div key={metric.label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-2">
                          {metric.icon}
                          <span className="text-xl font-black text-white">{metric.value}</span>
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center">{metric.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Detalhes técnicos */}
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                      <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest">Dados do Anúncio</h4>

                      <div className="space-y-3">
                        {anuncio.checkout && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-white/40 font-bold">Checkout</span>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-black">
                              {anuncio.checkout}
                            </div>
                          </div>
                        )}
                        {anuncio.tecnologia && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-white/40 font-bold">Tecnologia</span>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-black">
                              {anuncio.tecnologia}
                            </div>
                          </div>
                        )}
                        {platforms.length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-white/40 font-bold">Plataformas</span>
                            <div className="flex gap-1.5">
                              {platforms.map(p => (
                                <div key={p} className="px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[9px] font-black uppercase">{p}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/40 font-bold">Início da Veiculação</span>
                          <div className="flex items-center gap-1.5 text-[11px] font-black text-white/60">
                            <Calendar size={10} className="text-green-400" />
                            {formatDate(anuncio.deliveryStartTime)}
                          </div>
                        </div>
                        {anuncio.deliveryStopTime && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-white/40 font-bold">Fim da Veiculação</span>
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-white/60">
                              <Calendar size={10} className="text-red-400" />
                              {formatDate(anuncio.deliveryStopTime)}
                            </div>
                          </div>
                        )}
                        {anuncio.spendRange && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-white/40 font-bold">Faixa de Gasto</span>
                            <div className="flex items-center gap-1.5">
                              <TrendingUp size={10} className="text-green-400" />
                              <span className="text-[11px] font-black text-white/60">{anuncio.currency} {anuncio.spendRange}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Escala visual */}
                    {anuncio.escala != null && (
                      <div className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-orange-400/60 uppercase tracking-widest">Índice de Escala</span>
                          <div className="flex items-center gap-1.5">
                            <Flame size={14} className="text-orange-400" />
                            <span className="text-lg font-black text-orange-400">{anuncio.escala}<span className="text-xs text-orange-400/40">/100</span></span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${anuncio.escala}%` }}
                            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── ABA: FUNIL ────────────────────────────────── */}
                {activeTab === 'funil' && (
                  <motion.div
                    key="funil"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-8"
                  >
                    <FunnelAnalysisTab
                      anuncio={anuncio}
                      onScanFunnel={() => onFunnelScan(anuncio.id)}
                      onRefresh={async () => {
                        const updated = await fetchById(anuncio.id);
                        if (updated) setAnuncio(updated);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
