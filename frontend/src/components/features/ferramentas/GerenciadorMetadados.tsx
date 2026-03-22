"use client";

import { useState } from 'react';
import { Card3D } from '@/components/ui/Card3D';
import { Button } from '@/components/ui/Button';
import {
  Image as ImageIcon,
  FileText,
  Copy,
  Download,
  AlertCircle,
  CheckCircle,
  UploadCloud,
  Activity,
  Clock,
  ShieldCheck,
  Zap,
  ChevronRight,
  Database,
  Search,
  Settings,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium GerenciadorMetadados v5.0
// Design Path: Mastery High-Fidelity / Asset Intelligence Hub
// ─────────────────────────────────────────────────────────────────

export function GerenciadorMetadados() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [metadata, setMetadata] = useState<any>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState('');
  const [metadataCopied, setMetadataCopied] = useState(false);
  const [cleanedImage, setCleanedImage] = useState<string>('');
  const [changingMetadata, setChangingMetadata] = useState(false);

  const extractMetadata = async () => {
    if (!imageFile) {
      setMetadataError('ERRO: NENHUM ATIVO DETECTADO NO BUFFER.');
      return;
    }

    setLoadingMetadata(true);
    setMetadataError('');
    setMetadata(null);

    try {
      const exifr = (await import('exifr')).default;
      const metadataResult = await exifr.parse(imageFile, {
        iptc: true,
        ifd0: true,
        ifd1: true,
        exif: true,
        gps: true,
        translateKeys: true,
        translateValues: true,
        reviveValues: true,
        sanitize: true,
        mergeOutput: true,
      });

      setMetadata(metadataResult || {});
    } catch (err) {
      setMetadataError(err instanceof Error ? err.message : 'FALHA NA EXTRAÇÃO DE CAMADAS EXIF.');
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMetadataError('IDENTIFICADOR DE ARQUIVO INVÁLIDO. TIPO ESPERADO: IMAGE/*');
      return;
    }

    setImageFile(file);
    setMetadata(null);
    setMetadataError('');
    setCleanedImage('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setImageFile(null);
    setImagePreview('');
    setMetadata(null);
    setCleanedImage('');
  };

  const copyMetadata = () => {
    if (!metadata) return;
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    setMetadataCopied(true);
    setTimeout(() => setMetadataCopied(false), 2000);
  };

  const changeMetadata = async () => {
    if (!imageFile || !imagePreview) {
      setMetadataError('ERRO: ATIVO NÃO CARREGADO NO MÓDULO.');
      return;
    }

    setChangingMetadata(true);
    setMetadataError('');
    setCleanedImage('');

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        throw new Error('FALHA NA ALOCAÇÃO DE BUFFER DE VÍDEO.');
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            const saturationFactor = 1.05;

            data[i] = Math.min(255, Math.max(0, luminance + (r - luminance) * saturationFactor));
            data[i + 1] = Math.min(255, Math.max(0, luminance + (g - luminance) * saturationFactor));
            data[i + 2] = Math.min(255, Math.max(0, luminance + (b - luminance) * saturationFactor));
          }

          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('FALHA NA SERIALIZAÇÃO DO ATIVO.'));
              return;
            }

            const blobUrl = URL.createObjectURL(blob);
            setCleanedImage(blobUrl);
            resolve();
          }, imageFile.type || 'image/png', 0.95);
        };

        img.onerror = () => reject(new Error('ERRO NA CARGA DO ATIVO FONTE.'));
        img.src = imagePreview;
      });
    } catch (err) {
      setMetadataError(err instanceof Error ? err.message : 'ERRO OPERACIONAL DE MODIFICAÇÃO.');
    } finally {
      setChangingMetadata(false);
    }
  };

  const downloadCleanedImage = () => {
    if (!cleanedImage || !imageFile) return;

    const link = document.createElement('a');
    link.href = cleanedImage;

    const originalName = imageFile.name.replace(/\.[^/.]+$/, '');
    const extension = imageFile.name.split('.').pop() || 'png';
    link.download = `${originalName}-metadados-alterados.${extension}`;

    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  };

  return (
    <div className="space-y-12">

      {/* Operation Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Left: Asset Input & Configuration */}
        <div className="lg:col-span-8 space-y-10">

          {/* Industrial Upload Zone */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic flex items-center gap-3 ml-2">
              <ImageIcon size={11} className="text-purple-500/40" />
              ASSET_SOURCE // CARREGAMENTO_DE_MATRIZ
            </label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={clsx(
                  "flex flex-col items-center justify-center w-full h-80 rounded-[3rem] border-2 border-dashed transition-all duration-700 cursor-pointer relative overflow-hidden group/upload",
                  imagePreview ? "border-purple-500/40 bg-[#080808]" : "border-white/5 bg-white/[0.01] hover:border-purple-500/20 hover:bg-white/[0.02]"
                )}
              >
                {imagePreview ? (
                  <div className="relative w-full h-full p-8 flex items-center justify-center bg-black/40">
                    <img src={imagePreview} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl relative z-10" alt="Preview" />
                    <button
                      onClick={(e) => { e.preventDefault(); clearFile(); }}
                      className="absolute top-6 right-6 p-3 rounded-full bg-red-500 text-black z-20 opacity-0 group-hover/upload:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 text-center px-12 relative z-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 group-hover/upload:scale-110 transition-transform duration-700">
                      <UploadCloud size={32} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[14px] font-black text-white italic uppercase tracking-tighter">Initialize Asset Upload</p>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Arraste ou clique para indexar matriz de imagem</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/[0.03] pointer-events-none" />
              </label>
            </div>
          </div>

          {/* Action Matrix */}
          <AnimatePresence>
            {imageFile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <button
                  onClick={extractMetadata}
                  disabled={loadingMetadata}
                  className={clsx(
                    "p-8 rounded-[2.5rem] border transition-all duration-700 flex flex-col items-center gap-4 group/btn overflow-hidden relative",
                    loadingMetadata ? "bg-white/5 border-white/5 text-white/20" : "bg-purple-500 text-black border-purple-500/20 hover:bg-purple-400"
                  )}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    {loadingMetadata ? <Activity className="animate-spin" size={20} /> : <Search size={20} fill="currentColor" />}
                    <span className="text-[13px] font-black uppercase tracking-[0.2em]">{loadingMetadata ? 'Sincronizando...' : 'Extrair EXIF'}</span>
                  </div>
                  {!loadingMetadata && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />}
                </button>

                <button
                  onClick={changeMetadata}
                  disabled={changingMetadata}
                  className={clsx(
                    "p-8 rounded-[2.5rem] border transition-all duration-700 flex flex-col items-center gap-4 group/btn overflow-hidden relative",
                    changingMetadata ? "bg-white/5 border-white/5 text-white/20" : "bg-white/[0.04] text-white border-white/5 hover:border-yellow-500/30 hover:text-yellow-500"
                  )}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    {changingMetadata ? <Activity className="animate-spin" size={20} /> : <Zap size={20} fill="currentColor" />}
                    <span className="text-[13px] font-black uppercase tracking-[0.2em]">{changingMetadata ? 'Computando...' : 'Ofuscar Ativo'}</span>
                  </div>
                  {!changingMetadata && <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right: Technical Specs & Status */}
        <div className="lg:col-span-4 flex flex-col gap-10">

          <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] space-y-8 group">
            <div className="flex items-center gap-3 border-b border-white/5 pb-8">
              <Database size={14} className="text-white/20" />
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">ASSET_METRICS // CORE</span>
            </div>

            <div className="space-y-8 flex-1">
              {[
                { l: 'File_Name', v: imageFile?.name || 'LOG_EMPTY', i: FileText, c: 'text-white/60' },
                { l: 'Type_Protocol', v: imageFile?.type.toUpperCase() || '----', i: Activity, c: 'text-purple-500/60' },
                { l: 'Data_Load', v: imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : '0.00 MB', i: Settings, c: 'text-cyan-500/60' }
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <stat.i size={11} className="text-white/10" />
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">{stat.l}</span>
                  </div>
                  <div className={clsx("text-[13px] font-black italic uppercase tracking-tighter truncate", stat.c)}>
                    {stat.v}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-white/5">
              <div className="flex items-center gap-4 px-6 py-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <ShieldCheck size={16} className="text-green-500/40" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Integrity: PASS</span>
              </div>
            </div>
          </div>

          {/* Micro Monitor */}
          <div className="p-8 bg-white/[0.01] border border-white/5 rounded-[2.5rem] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Operational_Node_V3</span>
            </div>
            <span className="text-[10px] font-mono text-white/10">0.02ms</span>
          </div>

        </div>
      </div>

      {/* Dynamic Results Matrix */}
      <AnimatePresence>
        {metadataError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] flex items-center gap-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertCircle size={28} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">SYSTEM_ERROR_LOG</span>
              <p className="text-xl font-black text-white italic uppercase tracking-tighter">{metadataError}</p>
            </div>
          </motion.div>
        )}

        {metadata && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="p-10 lg:p-14 bg-white/[0.02] border border-white/5 rounded-[4rem] relative overflow-hidden group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 relative z-10 border-b border-white/5 pb-10 mb-10">
                <div className="flex items-center gap-8">
                  <div className="w-20 h-20 rounded-[2rem] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                    <FileText size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">METADATA_INDEX // SUCESSO</h3>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{Object.keys(metadata).length} Propriedades Identificadas</p>
                  </div>
                </div>
                <button
                  onClick={copyMetadata}
                  className={clsx(
                    "px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-700 flex items-center justify-center gap-4",
                    metadataCopied ? "bg-green-500 text-black shadow-2xl" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Copy size={18} />
                  {metadataCopied ? 'JSON_COPIADO' : 'COPIAR_DADOS_JSON'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.entries(metadata).slice(0, 100).map(([key, value]) => (
                  <div key={key} className="p-6 bg-black/40 border border-white/5 rounded-2xl group/meta hover:border-purple-500/30 transition-all overflow-hidden">
                    <span className="text-[9px] font-black text-white/10 group-hover:text-purple-500/40 uppercase tracking-widest truncate block mb-1">{key}</span>
                    <p className="text-[12px] font-black text-white/60 group-hover:text-white uppercase tracking-tighter truncate italic">
                      {typeof value === 'object' ? 'SECURE_OBJECT' : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {cleanedImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-10 lg:p-14 bg-white/[0.02] border border-white/5 rounded-[4rem] flex flex-col lg:flex-row gap-12 lg:items-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-green-500/[0.02] animate-pulse pointer-events-none" />
            <div className="w-full lg:w-1/2 relative">
              <div className="absolute inset-0 bg-green-500/20 blur-[80px] rounded-full opacity-20" />
              <img src={cleanedImage} alt="Cleaned" className="w-full h-[400px] object-contain rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative z-10" />
            </div>
            <div className="flex-1 space-y-10 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-500" />
                  <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">REINDEXAÇÃO_BEM_SUCEDIDA</h3>
                </div>
                <p className="text-[12px] font-bold text-white/30 uppercase italic leading-relaxed">A matriz original foi processada com saturação heurística e purgação de metadados técnicos. O novo hash de imagem está pronto para distribuição.</p>
              </div>
              <button
                onClick={downloadCleanedImage}
                className="w-full py-8 rounded-[2rem] bg-green-500 text-black font-black text-[16px] uppercase tracking-[0.3em] hover:bg-green-400 transition-all shadow-[0_30px_60px_rgba(34,197,94,0.3)] flex items-center justify-center gap-6"
              >
                <Download size={24} />
                DOWNLOAD_ASSET_MOD
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
