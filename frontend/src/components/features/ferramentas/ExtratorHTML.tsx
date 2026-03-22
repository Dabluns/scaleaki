"use client";

import { useState } from 'react';
import { Card3D } from '@/components/ui/Card3D';
import { Button } from '@/components/ui/Button';
import {
  Search,
  Copy,
  Download,
  AlertCircle,
  CheckCircle,
  Zap,
  Globe,
  Terminal,
  Database,
  Cpu,
  Layers,
  ShieldCheck,
  ChevronRight,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium ExtratorHTML v5.0
// Design Path: Mastery High-Fidelity / Technical Scraping Environment
// ─────────────────────────────────────────────────────────────────

export function ExtratorHTML() {
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [fullSite, setFullSite] = useState(false);
  const [resources, setResources] = useState<any[]>([]);

  const extractHTML = async () => {
    if (!url.trim()) {
      setError('POR FAVOR, INSIRA UMA URL VÁLIDA PARA INDEXAÇÃO.');
      return;
    }

    setLoading(true);
    setError('');
    setHtml('');
    setResources([]);

    try {
      const response = await fetch('/api/ferramentas/extract-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, fullSite }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'FALHA NO PROTOCOLO DE EXTRAÇÃO');
      }

      setHtml(data.html);
      if (data.fullSite && data.resources) {
        setResources(data.resources);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ERRO OPERACIONAL DESCONHECIDO');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHTML = async () => {
    if (fullSite && resources.length > 0) {
      await downloadFullSite();
      return;
    }

    let filename = 'extracted.html';
    try {
      if (url) {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '').split('.')[0];
        filename = `${hostname || 'extracted'}.html`;
      }
    } catch {
      filename = 'extracted.html';
    }

    let htmlContent = html;
    if (!htmlContent.trim().toLowerCase().startsWith('<!doctype') &&
      !htmlContent.trim().toLowerCase().startsWith('<html')) {
      htmlContent = `<!DOCTYPE html>\n${htmlContent}`;
    }

    const blob = new Blob([htmlContent], {
      type: 'text/html;charset=utf-8'
    });

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 200);
  };

  const downloadFullSite = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      let htmlContent = html;
      if (!htmlContent.trim().toLowerCase().startsWith('<!doctype') &&
        !htmlContent.trim().toLowerCase().startsWith('<html')) {
        htmlContent = `<!DOCTYPE html>\n${htmlContent}`;
      }

      const cssFolder = zip.folder('css');
      const jsFolder = zip.folder('js');
      const imagesFolder = zip.folder('images');

      const urlMap = new Map<string, string>();

      for (const resource of resources) {
        const fileName = resource.path.split('/').pop() || 'file';
        let relativePath = '';

        if (resource.type === 'css') {
          relativePath = `css/${fileName}`;
          cssFolder?.file(fileName, resource.content as string);
          htmlContent = htmlContent.replace(
            new RegExp(resource.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
            relativePath
          );
        } else if (resource.type === 'js') {
          relativePath = `js/${fileName}`;
          jsFolder?.file(fileName, resource.content as string);
          htmlContent = htmlContent.replace(
            new RegExp(resource.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
            relativePath
          );
        } else if (resource.type === 'image') {
          relativePath = `images/${fileName}`;
          imagesFolder?.file(fileName, resource.content as ArrayBuffer);
          htmlContent = htmlContent.replace(
            new RegExp(resource.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
            relativePath
          );
        }

        urlMap.set(resource.url, relativePath);
      }

      zip.file('index.html', htmlContent);

      const zipBlob = await zip.generateAsync({ type: 'blob' });

      let filename = 'site-completo.zip';
      try {
        if (url) {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname.replace('www.', '').split('.')[0];
          filename = `${hostname || 'site'}-completo.zip`;
        }
      } catch {
        filename = 'site-completo.zip';
      }

      const blobUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Erro ao criar ZIP:', error);
      setError('ERRO NA GERAÇÃO DA MATRIZ COMPRIMIDA.');
    }
  };

  return (
    <div className="space-y-12">

      {/* Control Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 flex flex-col gap-10">

          {/* Main Input Cluster */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3 ml-2">
              <Globe size={11} className="text-green-500/40" />
              URL_TARGET // DESTINO_DO_SCRAPER
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative group flex-1">
                <div className="absolute -inset-0.5 bg-green-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="HTTPS://EXEMPLO.COM/LANDING-PAGE"
                  className="relative w-full px-8 py-6 bg-[#080808] border border-white/5 rounded-2xl text-[13px] font-black text-white placeholder:text-white/10 outline-none focus:border-green-500/40 transition-all uppercase tracking-widest italic"
                  onKeyPress={(e) => e.key === 'Enter' && extractHTML()}
                />
              </div>
              <button
                onClick={extractHTML}
                disabled={loading}
                className={clsx(
                  "px-10 py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all duration-700 active:scale-95 shadow-2xl flex items-center justify-center gap-4",
                  loading ? "bg-white/5 text-white/20 cursor-wait" : "bg-green-500 text-black hover:bg-green-400"
                )}
              >
                {loading ? (
                  <>
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                    EXECUTANDO...
                  </>
                ) : (
                  <>
                    <Zap size={18} fill="currentColor" />
                    INICIALIZAR_EXTRAÇÃO
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Config Options */}
          <div className="flex flex-col sm:flex-row gap-6">
            <button
              onClick={() => setFullSite(!fullSite)}
              className={clsx(
                "flex-1 p-6 rounded-[2rem] border transition-all duration-500 text-left space-y-3 group",
                fullSite ? "bg-green-500/10 border-green-500/40" : "bg-white/[0.02] border-white/5 hover:border-white/10"
              )}
            >
              <div className="flex items-center justify-between">
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  fullSite ? "bg-green-500 text-black" : "bg-white/5 text-white/40 group-hover:text-white"
                )}>
                  <Layers size={18} />
                </div>
                <div className={clsx(
                  "w-4 h-4 rounded-full border-2 transition-all",
                  fullSite ? "bg-green-500 border-green-500" : "border-white/10"
                )} />
              </div>
              <div className="space-y-1">
                <span className={clsx("text-[10px] font-black uppercase tracking-widest", fullSite ? "text-green-500" : "text-white/40")}>Deep_Scraping</span>
                <p className="text-[12px] font-black text-white italic uppercase tracking-tighter">Site Completo (ZIP)</p>
                <p className="text-[10px] font-bold text-white/20 uppercase italic leading-none">Inclui CSS, JS e Ativos Visuais.</p>
              </div>
            </button>

            <div className="flex-1 p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 flex flex-col justify-center gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-green-500/40" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Status_Protocolo</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="text-[14px] font-black text-white italic uppercase tracking-tighter">Segurança: Nominal</span>
              </div>
            </div>
          </div>

        </div>

        {/* Technical Log / Info Cluster */}
        <div className="lg:col-span-4 p-8 bg-[#0a0a0a] border border-white/5 rounded-[3rem] flex flex-col gap-8 group">
          <div className="flex items-center gap-3 border-b border-white/5 pb-6">
            <Terminal size={14} className="text-white/20" />
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">RETRÔ_CONSOLE // STATE</span>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <span className="text-[9px] font-black text-white/10 uppercase tracking-widest leading-none">Último_Processo</span>
              <div className="text-[11px] font-mono text-white/40 uppercase tracking-tighter italic">
                {loading ? 'STATUS: EXECUTANDO_THREADS...' : html ? 'STATUS: INDEXAÇÃO_SUCESSO' : 'STATUS: AGUARDANDO_COMANDO'}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black text-white/10 uppercase tracking-widest leading-none">Arquitetura_Alvo</span>
              <div className="text-[11px] font-mono text-white/40 uppercase tracking-tighter italic">
                {url ? new URL(url).protocol.toUpperCase() : '----'} // DOM_NODE_SYNC
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 text-center">
            <div className="text-[10px] font-black text-green-500/20 uppercase tracking-widest animate-pulse italic">Monitoramento_H_Ativo</div>
          </div>
        </div>
      </div>

      {/* Results Viewport */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-8 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] flex items-center gap-8 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertCircle size={28} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Protocolo_Erro // 4X1</span>
              <p className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{error}</p>
            </div>
          </motion.div>
        )}

        {html && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Export Cluster */}
            <div className="p-8 lg:p-12 bg-white/[0.02] border border-white/5 rounded-[3.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-12 group overflow-hidden relative">
              <div className="absolute inset-0 bg-green-500/[0.01] pointer-events-none" />

              <div className="flex items-center gap-8 relative z-10">
                <div className="w-20 h-20 rounded-[2rem] bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                  <CheckCircle size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">DATA_SYNC // CONCLUÍDO</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest font-mono italic">CHAR_COUNT: {html.length}</span>
                    <div className="w-1 h-1 bg-white/5 rounded-full" />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest font-mono italic">NODES: {resources.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                <button
                  onClick={copyToClipboard}
                  className={clsx(
                    "px-10 py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all duration-700 flex items-center justify-center gap-4",
                    copied ? "bg-green-500 text-black shadow-2xl" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Copy size={18} />
                  {copied ? 'CÓPIA_REALIZADA' : 'COPIAR_HTML'}
                </button>
                <button
                  onClick={downloadHTML}
                  className="px-10 py-5 rounded-2xl bg-[#111] border border-white/5 text-white font-black text-[12px] uppercase tracking-[0.2em] transition-all hover:bg-white hover:text-black hover:border-white shadow-2xl flex items-center justify-center gap-4"
                >
                  <Download size={18} />
                  BAIXAR_MATRIZ
                </button>
              </div>
            </div>

            {/* Editor Preview Cluster */}
            <div className="bg-[#050505] border border-white/5 rounded-[3.5rem] overflow-hidden">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20" />
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic ml-4">VIEWPORT // SOURCE_CODE</span>
                </div>
                <Activity size={16} className="text-green-500/20 animate-pulse" />
              </div>
              <div className="p-10 lg:p-14 overflow-x-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-white/5 hover:scrollbar-thumb-green-500/20 scrollbar-track-transparent">
                <pre className="font-mono text-[12px] leading-relaxed text-white/40 selection:bg-green-500/20 selection:text-green-500">
                  <code className="text-cyan-500/80">{html}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function LoaderCircle({ className }: { className?: string }) {
  return <Activity className={clsx("animate-spin", className)} />;
}
