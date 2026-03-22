"use client";

import { useParams } from 'next/navigation';
import { ExtratorHTML } from '@/components/features/ferramentas/ExtratorHTML';
import { GerenciadorMetadados } from '@/components/features/ferramentas/GerenciadorMetadados';
import { CriptografiaTexto } from '@/components/features/ferramentas/CriptografiaTexto';
import { Card3D } from '@/components/ui/Card3D';
import {
  AlertCircle,
  ArrowLeft,
  Terminal,
  Cpu,
  Activity,
  ShieldCheck,
  Zap,
  Layout
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium Ferramenta Shell v5.0
// Design Path: Mastery High-Fidelity / Operational Environment
// ─────────────────────────────────────────────────────────────────

export default function FerramentaPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : '';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getToolMetadata = () => {
    switch (slug) {
      case 'extrator-html':
        return { title: 'Extrator de HTML', code: 'PROTOCOL_HTML_X', desc: 'Sincronizador de estrutura de rede e código-fonte.' };
      case 'metadados-imagem':
        return { title: 'Gerenciador EXIF', code: 'ASSET_META_ALPHA', desc: 'Remodulador de metadados e informações de ativos.' };
      case 'criptografia-texto':
        return { title: 'Ofuscação de Textos', code: 'CRYPTO_TEXT_FLOW', desc: 'Proteção algorítmica e ofuscação de caracteres.' };
      default:
        return { title: 'Módulo Desconhecido', code: 'UNDEFINED_ID', desc: 'Identificador de recurso não localizado.' };
    }
  };

  const metadata = getToolMetadata();

  const renderFerramenta = () => {
    switch (slug) {
      case 'extrator-html':
        return <ExtratorHTML />;
      case 'metadados-imagem':
        return <GerenciadorMetadados />;
      case 'criptografia-texto':
        return <CriptografiaTexto />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-20 text-center space-y-8 bg-white/[0.01] border border-white/5 rounded-[4rem]">
            <AlertCircle size={80} className="text-red-500/20" />
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Módulo Não Encontrado</h2>
              <p className="text-white/20 uppercase text-[10px] font-bold tracking-[0.3em]">ID_RECURSO_INVÁLIDO // ERR_CODE_404</p>
            </div>
            <Link
              href="/ferramentas"
              className="px-12 py-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[12px] font-black uppercase tracking-widest text-white transition-all active:scale-95"
            >
              Retornar ao Nexus
            </Link>
          </div>
        );
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-32">

      {/* Editorial Navigation Header */}
      <div className="relative pt-24 pb-16 px-8 lg:px-20 max-w-[1700px] mx-auto overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
          <Terminal size={500} className="rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/5 pb-12">
          <div className="space-y-10 flex-1">
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/ferramentas"
                className="group flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 hover:bg-green-500 hover:text-black border border-white/5 transition-all text-white/40 font-black text-[10px] uppercase tracking-widest"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                BACK_TO_Nexus
              </Link>
              <div className="flex items-center gap-4 border-l border-white/5 pl-6">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Active_Session // TOOL_MODULE</span>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
                {metadata.title.split(' ').map((word, i) => (
                  <span key={i} className={i === metadata.title.split(' ').length - 1 ? "text-green-500" : "text-white"}>
                    {word} {i === 0 && <br />}
                  </span>
                ))}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 pt-4">
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest italic">{metadata.desc}</p>
                <div className="hidden sm:block w-px h-4 bg-white/10" />
                <span className="text-[11px] font-black text-green-500/40 uppercase tracking-[0.3em] font-mono italic">{metadata.code}</span>
              </div>
            </div>
          </div>

          {/* Module Status Monitor (Small HUD) */}
          <div className="hidden xl:flex gap-12 border-l border-white/5 pl-12">
            <div className="space-y-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Estado_Módulo</span>
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-green-500" />
                <span className="text-xl font-black text-white italic uppercase tracking-tighter">Opera_Nominal</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Protocolo_Sync</span>
              <div className="flex items-center gap-3">
                <Zap size={16} className="text-yellow-500" />
                <span className="text-xl font-black text-white italic uppercase tracking-tighter">Cloud_Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Viewport */}
      <div className="max-w-[1700px] mx-auto px-6 lg:px-20 mt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-[#0a0a0a]/40 border border-white/5 rounded-[4rem] p-4 lg:p-8 relative overflow-hidden group"
        >
          {/* HUD Graphics Background */}
          <div className="absolute top-0 right-0 p-20 opacity-[0.01] pointer-events-none group-hover:opacity-[0.02] transition-opacity duration-1000">
            <Layout size={600} className="-rotate-6" />
          </div>

          <div className="relative z-10">
            {renderFerramenta()}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
