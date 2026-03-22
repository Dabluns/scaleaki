'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { FavoritoButton } from './FavoritoButton';
import { Oferta } from '@/types/oferta';
import { ExternalLink, Copy, Download, Heart, Globe, Anchor, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useGamification } from '@/context/GamificationContext';
import { useAuth } from '@/context/AuthContext';
import { useConfetti } from '@/lib/confetti';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium OfferActions v2.0
// Features: Tactical Quick-Action Hub, Mastery High-Fidelity,
// Industrial Interaction, Zero Gradients, Neon Emerald Accents.
// ─────────────────────────────────────────────────────────────────

interface OfferActionsProps {
  oferta: Oferta;
  onCopyText?: () => void;
  onDownload?: () => void;
}

export const OfferActions: React.FC<OfferActionsProps> = ({
  oferta,
  onCopyText,
  onDownload,
}) => {
  const toast = useToast();
  const { addXP, updateStats } = useGamification();
  const { user } = useAuth();
  const { heart } = useConfetti();

  const [showSticky, setShowSticky] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingLanding, setDownloadingLanding] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setShowSticky(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyHeadline = async () => {
    try {
      await navigator.clipboard.writeText(oferta.titulo);
      setCopied(true);
      toast.showSuccess('Headline capturada com sucesso', 2000);
      onCopyText?.();
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  const handleVisitLink = () => {
    const primaryLink = (oferta as any).metricas?.landingUrl || oferta.links?.[0];
    if (primaryLink) {
      window.open(primaryLink, '_blank');
      addXP?.('VISUALIZAR_OFERTA');
    }
  };

  const handleDownloadLandingPage = async (url: string, name: string) => {
    setDownloadingLanding(url);
    try {
      const response = await fetch('/api/ferramentas/extract-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, fullSite: false }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      const blob = new Blob([data.html], { type: 'text/html' });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `${name.replace(/\s+/g, '-').toLowerCase()}.html`;
      a.click();
      toast.showSuccess('Landing page clonada com sucesso', 2000);
      addXP?.('DOWNLOAD_LANDING');
    } catch {
      toast.showError('Falha na extração remota');
    } finally {
      setDownloadingLanding(null);
    }
  };

  const landingPages = (() => {
    const m: any = (oferta as any).metricas || {};
    const lps = m.landingPages || [];
    if (m.landingUrl && !lps.some((l: any) => l.url === m.landingUrl)) {
      return [{ url: m.landingUrl, name: 'PÁGINA PRINCIPAL', type: 'primary' }, ...lps];
    }
    return lps;
  })();

  return (
    <div className="flex flex-col gap-10">

      {/* Primary Action Terminal */}
      <div className="flex flex-wrap items-center gap-4">

        {/* ACTION: VISIT */}
        <button
          onClick={handleVisitLink}
          className="group relative flex items-center gap-4 px-8 py-5 bg-green-500 text-black rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_35px_rgba(34,197,94,0.5)]"
        >
          <Zap size={20} className="fill-black group-hover:scale-125 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-[0.3em]">Abrir link</span>
        </button>

        {/* ACTION: COPY */}
        <button
          onClick={handleCopyHeadline}
          className="group flex items-center gap-4 px-8 py-5 bg-white/[0.03] border border-white/10 text-white rounded-2xl transition-all duration-300 hover:bg-white/5 hover:border-white/20 active:scale-95"
        >
          <Copy size={18} className={clsx("transition-colors", copied ? "text-green-500" : "text-white/40")} />
          <span className="text-[11px] font-black uppercase tracking-[0.3em]">{copied ? 'HEADLINE CAPTURADA' : 'CAPTURAR HEADLINE'}</span>
        </button>

        {/* ACTION: DOWNLOAD FULL ASSETS */}
        {onDownload && (
          <button
            onClick={onDownload}
            className="group flex items-center gap-4 px-8 py-5 bg-white/[0.03] border border-white/10 text-white rounded-2xl transition-all duration-300 hover:bg-white/5 hover:border-white/20 active:scale-95"
          >
            <Download size={18} className="text-white/40 group-hover:text-cyan-500 transition-colors" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Baixar oferta</span>
          </button>
        )}

        {/* ACTION: FAVORITE */}
        <div className="relative">
          <FavoritoButton
            oferta={oferta}
            size="lg"
            variant="secondary"
            className="bg-white/[0.03] border border-white/10 hover:border-pink-500/50 hover:bg-pink-500/10 rounded-2xl h-full py-5 px-8 transition-all"
          />
        </div>
      </div>

      {/* Landing Page Cloner Section */}
      {landingPages.length > 0 && (
        <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Globe size={120} className="text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-500/60">Clonagem de Fontes Digitais</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {landingPages.map((lp: any, i: number) => (
                <button
                  key={i}
                  disabled={downloadingLanding === lp.url}
                  onClick={() => handleDownloadLandingPage(lp.url, lp.name)}
                  className="group flex items-center justify-between p-5 bg-[#050505] border border-white/5 rounded-2xl hover:border-cyan-500/30 transition-all hover:scale-[1.02] active:scale-98"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Landing Page Node {i + 1}</span>
                    <span className="text-xs font-black text-white uppercase italic">{lp.name}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-all">
                    {downloadingLanding === lp.url ? (
                      <Zap size={14} className="animate-pulse" />
                    ) : (
                      <Download size={14} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STICKY FOOTER HUB */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[100] px-8 py-6 pointer-events-none"
          >
            <div className="max-w-5xl mx-auto pointer-events-auto">
              <div className="bg-[#0d0d0d]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4 pl-4 truncate">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[200px]">{oferta.titulo}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleVisitLink} className="px-6 py-3 bg-green-500 text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all">ACESSAR</button>
                  <button onClick={handleCopyHeadline} className="px-6 py-3 bg-white/5 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">COPY</button>
                  <div className="w-px h-8 bg-white/10 mx-2" />
                  <FavoritoButton oferta={oferta} size="md" variant="ghost" className="hover:bg-white/5 rounded-xl" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
