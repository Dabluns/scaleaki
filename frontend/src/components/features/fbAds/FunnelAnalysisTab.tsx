'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Code2, Zap, Network, RefreshCw, ExternalLink, Loader2,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { AnuncioFacebook, parseJsonField } from '@/hooks/useFacebookAds';

interface FunnelAnalysisTabProps {
  anuncio: AnuncioFacebook;
  onScanFunnel: () => Promise<void>;
}

const PIXEL_COLORS: Record<string, string> = {
  'Facebook Pixel': 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  'Google Analytics': 'text-red-400 bg-red-400/10 border-red-400/30',
  'Google Tag Manager': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  'Google Analytics 4': 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  'Google Ads': 'text-green-400 bg-green-400/10 border-green-400/30',
  'TikTok Pixel': 'text-pink-400 bg-pink-400/10 border-pink-400/30',
  'Snapchat Pixel': 'text-yellow-300 bg-yellow-300/10 border-yellow-300/30',
};

export function FunnelAnalysisTab({ anuncio, onScanFunnel }: FunnelAnalysisTabProps) {
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const pixels = parseJsonField<string>(anuncio.activePixels);
  const subdomains = parseJsonField<string>(anuncio.funnelSubdomains);
  const services = parseJsonField<string>(anuncio.externalServices);

  const hasFunnelData = anuncio.urlscanUuid || pixels.length > 0 || subdomains.length > 0;

  const handleScan = async () => {
    setScanning(true);
    setScanDone(false);
    setScanError(null);
    try {
      await onScanFunnel();
      setScanDone(true);
    } catch (err: any) {
      setScanError(err.message || 'Erro ao iniciar análise');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {scanError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={14} />
          {scanError}
        </div>
      )}
      {/* Screenshot da landing page */}
      {anuncio.landingScreenshot && (
        <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/40 relative group">
          <img
            src={anuncio.landingScreenshot}
            alt="Landing page screenshot"
            className="w-full object-cover max-h-64 group-hover:scale-[1.02] transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <a
              href={anuncio.destinationUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:border-green-500/40 hover:text-green-400 transition-all"
            >
              <Globe size={12} />
              Abrir Página de Vendas
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {/* Checkout e Tecnologia */}
      {(anuncio.checkout || anuncio.tecnologia) && (
        <div className="grid grid-cols-2 gap-3">
          {anuncio.checkout && (
            <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
              <span className="text-[9px] font-black text-cyan-500/60 uppercase tracking-widest block mb-2">
                Plataforma de Checkout
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                <span className="text-sm font-black text-cyan-300">{anuncio.checkout}</span>
              </div>
            </div>
          )}
          {anuncio.tecnologia && (
            <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
              <span className="text-[9px] font-black text-purple-500/60 uppercase tracking-widest block mb-2">
                Tecnologia do Site
              </span>
              <div className="flex items-center gap-2">
                <Code2 size={12} className="text-purple-400" />
                <span className="text-sm font-black text-purple-300">{anuncio.tecnologia}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pixels ativos */}
      {pixels.length > 0 && (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-yellow-400" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Pixels Ativos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pixels.map(pixel => (
              <div
                key={pixel}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${
                  PIXEL_COLORS[pixel] || 'text-white/50 bg-white/5 border-white/10'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                {pixel}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subdomínios do funil */}
      {subdomains.length > 0 && (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Network size={14} className="text-green-400" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
              Subdomínios do Funil ({subdomains.length})
            </span>
          </div>
          <div className="space-y-2">
            {subdomains.map(sub => (
              <div key={sub} className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 hover:border-green-500/20 transition-colors group">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span className="text-[11px] font-mono text-white/60 group-hover:text-white/80 transition-colors flex-1">{sub}</span>
                <a href={`https://${sub}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink size={10} className="text-white/20 hover:text-green-400 transition-colors" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Serviços externos */}
      {services.length > 0 && (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={14} className="text-blue-400" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Serviços Externos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {services.map(svc => (
              <div key={svc} className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-300 uppercase tracking-wider">
                {svc}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sem dados — estado vazio */}
      {!hasFunnelData && !scanning && (
        <div className="p-10 rounded-2xl border border-dashed border-white/10 flex flex-col items-center gap-4">
          <Network size={32} className="text-white/10" />
          <div className="text-center">
            <p className="text-[11px] font-black text-white/30 uppercase tracking-widest">Análise de Funil Não Iniciada</p>
            <p className="text-[10px] text-white/20 mt-1">Inicie um scan para mapear o funil desta oferta</p>
          </div>
        </div>
      )}

      {/* Botão de (re)análise */}
      <div className="pt-2">
        <AnimatePresence mode="wait">
          {scanDone ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400"
            >
              <CheckCircle2 size={16} />
              <span className="text-[11px] font-black uppercase tracking-widest">Scan Iniciado — Resultados em ~60 segundos</span>
            </motion.div>
          ) : (
            <motion.button
              key="scan"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleScan}
              disabled={scanning || !anuncio.destinationUrl}
              className="w-full py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white/50 font-black text-[10px] uppercase tracking-widest hover:border-green-500/30 hover:text-green-400 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {scanning ? (
                <><Loader2 size={14} className="animate-spin" /> Submetendo Scan...</>
              ) : (
                <><RefreshCw size={14} /> {hasFunnelData ? '[ Reanalisar Funil ]' : '[ Iniciar Análise de Funil ]'}</>
              )}
            </motion.button>
          )}
        </AnimatePresence>
        {!anuncio.destinationUrl && (
          <div className="flex items-center gap-1.5 mt-2 px-3">
            <AlertCircle size={10} className="text-yellow-500/60" />
            <span className="text-[9px] text-yellow-500/40 font-bold">URL de destino não disponível para este anúncio</span>
          </div>
        )}
      </div>
    </div>
  );
}
