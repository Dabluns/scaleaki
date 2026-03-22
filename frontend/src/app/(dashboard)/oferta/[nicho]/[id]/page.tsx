"use client";
import { useParams } from 'next/navigation';
import { useNichos } from '@/context/NichoContext';
import { useOfertaContext } from '@/context/OfertaContext';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Plus, X, Settings, Globe, Image as ImageIcon, Video, FileImage, FileText, Sparkles, Save, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { OfferHero } from '@/components/features/ofertas/OfferHero';
import { OfferActions } from '@/components/features/ofertas/OfferActions';
import { VideoPlayerDopamine } from '@/components/ui/VideoPlayerDopamine';
import { OfferDetails } from '@/components/features/ofertas/OfferDetails';
import { TrustSignals } from '@/components/features/ofertas/TrustSignals';
import { Card3D } from '@/components/ui/Card3D';
import { useGamification } from '@/context/GamificationContext';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Função auxiliar para baixar arquivo de URL
async function downloadFileFromUrl(url: string): Promise<Blob> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Erro ao baixar ${url}: ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    console.warn(`Não foi possível baixar ${url}:`, error);
    throw error;
  }
}

// Função para obter extensão do arquivo baseado na URL
function getFileExtension(url: string, defaultExt: string = 'bin'): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Buscar extensão no pathname inteiro (funciona com Supabase URLs)
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1] || '';
    // Remove query params e pega extensão
    const cleanName = lastPart.split('?')[0];
    const dotParts = cleanName.split('.');
    if (dotParts.length > 1) {
      const ext = dotParts.pop()?.toLowerCase() || defaultExt;
      return ext;
    }
    return defaultExt;
  } catch {
    const lastPart = url.split('/').pop() || '';
    const cleanName = lastPart.split('?')[0];
    const dotParts = cleanName.split('.');
    if (dotParts.length > 1) {
      return dotParts.pop()?.toLowerCase() || defaultExt;
    }
    return defaultExt;
  }
}

// Função para verificar se URL é imagem ou vídeo
function isImageUrl(url: string): boolean {
  const ext = getFileExtension(url, '');
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'tiff'].includes(ext) ||
    url.includes('/images/') || url.includes('bucket=images');
}

function isVideoUrl(url: string): boolean {
  const ext = getFileExtension(url, '');
  return ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'flv'].includes(ext) ||
    url.includes('/videos/') || url.includes('bucket=videos');
}

// Função para sanitizar nome de arquivo
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

export default function DetalheOfertaPage() {
  const params = useParams();
  const slug = typeof params.nicho === 'string' ? params.nicho : Array.isArray(params.nicho) ? params.nicho[0] : '';
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const { nichos } = useNichos();
  const { ofertas, fetchOfertas } = useOfertaContext();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const { updateStats } = useGamification();
  const nicho = Array.isArray(nichos) ? nichos.find(n => n.slug === slug) : undefined;
  const ofertasValidas = Array.isArray(ofertas) ? ofertas : [];
  const oferta = ofertasValidas.find(o => o.id === id && o.nichoId === nicho?.id);

  const [ofertaDetalhe, setOfertaDetalhe] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [uploadingVsl, setUploadingVsl] = useState(false);
  const [uploadingImagemPrincipal, setUploadingImagemPrincipal] = useState(false);
  const [uploadingCriativo, setUploadingCriativo] = useState(false);
  const [uploadErro, setUploadErro] = useState('');
  const [savingImagemPrincipal, setSavingImagemPrincipal] = useState(false);
  const [savingVsl, setSavingVsl] = useState(false);
  const [savingVslDescricao, setSavingVslDescricao] = useState(false);
  const [uploadingVslDescricao, setUploadingVslDescricao] = useState(false);
  const [addingCriativo, setAddingCriativo] = useState(false);
  const [msgImg, setMsgImg] = useState('');
  const [msgVsl, setMsgVsl] = useState('');
  const [msgVslDescricao, setMsgVslDescricao] = useState('');
  const [msgCriativo, setMsgCriativo] = useState('');
  const [editingVslDescricao, setEditingVslDescricao] = useState(false);
  const [vslDescricaoText, setVslDescricaoText] = useState('');
  const [vslDescricaoExpanded, setVslDescricaoExpanded] = useState(false);

  const o = ofertaDetalhe || oferta;
  const showVslExperience = Boolean(o?.vsl || o?.vslDescricao || isAdmin);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setErro('');
    fetch(`/api/ofertas/${id}`, { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (r.ok) {
          setOfertaDetalhe(data);
          setVslDescricaoText(data.vslDescricao || '');
          updateStats?.({ ofertasVisualizadas: 1 });
          fetch(`/api/ofertas/${id}/view`, {
            method: 'POST',
            credentials: 'include'
          }).catch(() => { });
        } else {
          setErro(data?.error || 'Erro ao carregar oferta');
        }
      })
      .catch(() => setErro('Erro ao carregar oferta'))
      .finally(() => setLoading(false));
  }, [id, updateStats]);

  useEffect(() => {
    const vslDescricao = o?.vslDescricao;
    if (vslDescricao) {
      setVslDescricaoText(vslDescricao);
    }
    setVslDescricaoExpanded(false);
  }, [id]);

  function normalizeLinks(links: any): string[] {
    if (!links) return [];
    if (Array.isArray(links)) return links as string[];
    if (typeof links === 'string') {
      try {
        let parsed = JSON.parse(links);
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        if (Array.isArray(parsed)) return parsed as string[];
        // Handle {criativos: [...]} object format from bot
        if (parsed && typeof parsed === 'object') {
          const urls: string[] = [];
          if (Array.isArray(parsed.criativos)) urls.push(...parsed.criativos);
          Object.entries(parsed).forEach(([key, val]) => {
            if (key !== 'criativos' && key !== 'html' && Array.isArray(val)) {
              urls.push(...(val as string[]));
            }
          });
          return urls;
        }
        return [links];
      } catch {
        return links.startsWith('http') ? [links] : [];
      }
    }
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
  }

  const handleCopyText = () => {
    if (o) {
      navigator.clipboard.writeText(o.texto);
      showToast('Texto copiado! 📋', 'success', 2000);
    }
  };

  const handleDownload = async () => {
    if (!o) return;

    try {
      showToast('Preparando assets... 📦', 'info', 3000);
      const zip = new JSZip();
      const folderName = sanitizeFileName(o.titulo || 'oferta');
      const assetsFolder = zip.folder(folderName);
      if (!assetsFolder) throw new Error('Erro ao criar pasta no ZIP');

      // === IMAGEM PRINCIPAL ===
      if (o.imagem) {
        try {
          const blob = await downloadFileFromUrl(o.imagem);
          const ext = getFileExtension(o.imagem, 'jpg');
          assetsFolder.file(`imagem_principal.${ext}`, blob);
        } catch {
          assetsFolder.file('imagem_principal_url.txt', o.imagem);
        }
      }

      // === CRIATIVOS ===
      const links = normalizeLinks(o.links);
      const imageLinks = links.filter(l => isImageUrl(l));
      const videoLinks = links.filter(l => isVideoUrl(l));
      const otherLinks = links.filter(l => !isImageUrl(l) && !isVideoUrl(l));

      if (imageLinks.length > 0 || videoLinks.length > 0) {
        const criativosFolder = assetsFolder.folder('criativos');
        if (criativosFolder) {
          for (let i = 0; i < imageLinks.length; i++) {
            try {
              const blob = await downloadFileFromUrl(imageLinks[i]);
              const ext = getFileExtension(imageLinks[i], 'jpg');
              criativosFolder.file(`imagem_${i + 1}.${ext}`, blob);
            } catch {
              criativosFolder.file(`imagem_${i + 1}_url.txt`, imageLinks[i]);
            }
          }
          for (let i = 0; i < videoLinks.length; i++) {
            try {
              const blob = await downloadFileFromUrl(videoLinks[i]);
              const ext = getFileExtension(videoLinks[i], 'mp4');
              criativosFolder.file(`video_${i + 1}.${ext}`, blob);
            } catch {
              criativosFolder.file(`video_${i + 1}_url.txt`, videoLinks[i]);
            }
          }
          if (otherLinks.length > 0) criativosFolder.file('outros_links.txt', otherLinks.join('\n'));
        }
      }

      // === VSL ===
      if (o.vsl) {
        const vslFolder = assetsFolder.folder('vsl');
        if (vslFolder) {
          try {
            const vslBlob = await downloadFileFromUrl(o.vsl);
            const ext = getFileExtension(o.vsl, 'mp4');
            vslFolder.file(`vsl.${ext}`, vslBlob);
          } catch {
            vslFolder.file('vsl_url.txt', o.vsl);
          }
        }
      }

      // === TRANSCRIÇÃO ===
      if (o.vslDescricao) {
        const vslFolder = assetsFolder.folder('vsl') || assetsFolder;
        vslFolder.file('transcricao_vsl.txt', o.vslDescricao);
      }

      // === TEXTO DA OFERTA ===
      if (o.texto && o.texto !== 'Sem descrição') {
        assetsFolder.file('descricao_oferta.txt', o.texto);
      }

      // === GRÁFICO DE CRIATIVOS (Screenshot) ===
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        let chartElement = document.querySelector('[data-chart-container="true"]') as HTMLElement;
        if (!chartElement) {
          const cardWithSvg = Array.from(document.querySelectorAll('div')).find(el => el.querySelector('svg') && el.textContent?.includes('Criativos')) as HTMLElement;
          if (cardWithSvg) chartElement = cardWithSvg;
        }
        if (chartElement) {
          const canvas = await html2canvas(chartElement, { backgroundColor: '#0a0a0a', scale: 2, logging: false, useCORS: true, allowTaint: true });
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), 'image/png', 0.95));
          if (blob) assetsFolder.file('grafico_criativos.png', blob);
        }
      } catch { }

      // === MÉTRICAS ===
      const metricas = (o as any)?.metricas || {};
      const chartData = metricas?.chartData;
      if (chartData && Array.isArray(chartData) && chartData.length > 0) {
        const anunciosData = {
          oferta: o.titulo,
          totalAnuncios: chartData.reduce((sum: number, d: any) => sum + (d.anuncios || 0), 0),
          dadosMensais: chartData.map((d: any) => ({ mes: d.month, ano: d.year, mesAno: `${d.month}/${d.year}`, quantidadeAnuncios: d.anuncios || 0 }))
        };
        assetsFolder.file('anuncios_mensais.json', JSON.stringify(anunciosData, null, 2));
      }

      // === GERAR E BAIXAR ZIP ===
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}_assets.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Assets baixados com sucesso! 🎉', 'success', 3000);
    } catch (error) {
      console.error('Download error:', error);
      showToast('Erro ao preparar assets. Tente novamente.', 'error', 3000);
    }
  };

  if (loading) return (
    <div className="relative min-h-screen px-6 lg:px-12 py-12">
      <div className="max-w-[1600px] mx-auto space-y-16">
        <SkeletonCard shimmer gradient lines={1} className="h-64 rounded-[3rem]" />
        <div className="grid grid-cols-2 gap-4"><SkeletonCard shimmer gradient /><SkeletonCard shimmer gradient /></div>
        <SkeletonCard shimmer gradient lines={3} />
      </div>
    </div>
  );

  if (!o) return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-text-secondary mb-4">{erro || 'Oferta não encontrada.'}</div>
        <Link href="/ofertas" className="text-green-500 hover:text-green-400">← Voltar para Ofertas</Link>
      </div>
    </div>
  );

  const favoritosCount = 0;

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10">
        <div className="px-6 lg:px-12 pt-12 pb-6">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
              <Link href="/ofertas" className="hover:text-green-500 transition-colors">Infraestrutura</Link>
              <span className="opacity-30">//</span>
              <Link href={`/oferta/${nicho?.slug || ''}`} className="hover:text-green-500 transition-colors">{nicho?.nome || 'Node'}</Link>
              <span className="opacity-30">//</span>
              <span className="text-white/40 truncate max-w-[40ch] italic">{o.titulo}</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <section className="relative mb-16"><OfferHero oferta={o} nicho={nicho} /></section>
          <section className="relative mb-16"><OfferActions oferta={o} onCopyText={handleCopyText} onDownload={handleDownload} /></section>
          <section className="relative mb-16"><TrustSignals oferta={o} favoritosCount={favoritosCount} /></section>

          {showVslExperience && (
            <section className="relative mb-20">
              {o.vsl && (
                <div className="space-y-10">
                  <div className="flex items-center justify-between border-b border-white/5 pb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-10 bg-green-500 rounded-full" />
                      <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">VÍDEO DE <span className="text-green-500">CONVERSÃO</span></h2>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={async () => {
                          setSavingVsl(true);
                          const res = await fetch('/api/ofertas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, vsl: null }) });
                          if (res.ok) { setOfertaDetalhe((prev: any) => ({ ...(prev ?? {}), vsl: null })); showToast('VSL removida.', 'success', 3000); }
                          setSavingVsl(false);
                        }}
                        className="text-[10px] font-black px-4 py-2 bg-red-500 text-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
                      >DELETAR VSL</button>
                    )}
                  </div>
                  <VideoPlayerDopamine src={o.vsl} poster={o.imagem} title={o.titulo} />
                </div>
              )}

              <div className={o.vsl ? 'mt-12' : ''}>
                {(o.vslDescricao || isAdmin) && !editingVslDescricao && (
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Transcrição de Mídia Digital</h3>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => setEditingVslDescricao(true)}
                        className="text-[9px] font-black px-4 py-2 bg-white/5 border border-white/10 text-white uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                      >{o.vslDescricao ? 'MODIFICAR' : 'INDEXAR'} DESCRIÇÃO</button>
                    )}
                  </div>
                )}

                {editingVslDescricao && isAdmin ? (
                  <div className="space-y-4 p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Editor de Transcrição</h3>
                      <button onClick={() => { setEditingVslDescricao(false); setVslDescricaoText(o.vslDescricao || ''); }} className="text-[9px] font-black text-white/30 hover:text-white uppercase tracking-widest">CANCELAR</button>
                    </div>
                    <textarea
                      value={vslDescricaoText}
                      onChange={(e) => setVslDescricaoText(e.target.value)}
                      className="w-full min-h-[300px] p-6 bg-black border border-white/10 rounded-2xl text-white italic placeholder:text-white/10 outline-none focus:border-green-500/50 transition-all resize-none"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={async () => {
                          setSavingVslDescricao(true);
                          const res = await fetch('/api/ofertas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, vslDescricao: vslDescricaoText }) });
                          if (res.ok) { setOfertaDetalhe((prev: any) => ({ ...(prev ?? {}), vslDescricao: vslDescricaoText })); setEditingVslDescricao(false); showToast('Descrição salva!', 'success', 3000); }
                          setSavingVslDescricao(false);
                        }}
                        disabled={savingVslDescricao}
                        className="px-6 py-3 bg-green-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
                      >{savingVslDescricao ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}</button>
                    </div>
                  </div>
                ) : o.vslDescricao ? (
                  <div className="p-8 lg:p-10 rounded-3xl bg-white/[0.02] border border-white/5">
                    <div className="relative">
                      <div
                        className="text-white/70 whitespace-pre-line leading-relaxed text-[15px] font-bold max-w-4xl transition-all duration-500 overflow-hidden"
                        style={{
                          maxHeight: vslDescricaoExpanded || o.vslDescricao.length < 400 ? '100000px' : '180px',
                        }}
                      >
                        {o.vslDescricao}
                      </div>

                      {/* Gradient fade overlay */}
                      {!vslDescricaoExpanded && o.vslDescricao.length >= 400 && (
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent pointer-events-none" />
                      )}
                    </div>

                    {o.vslDescricao.length >= 400 && (
                      <button
                        onClick={() => setVslDescricaoExpanded(!vslDescricaoExpanded)}
                        className="mt-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300"
                      >
                        <span className={`${vslDescricaoExpanded ? 'text-white/40 hover:text-white' : 'text-green-500 hover:text-green-400'} transition-colors`}>
                          {vslDescricaoExpanded ? '↑ REDUZIR TEXTO' : '↓ LER TRANSCRIÇÃO COMPLETA'}
                        </span>
                        <div className={`h-px flex-1 max-w-[100px] transition-all duration-500 ${vslDescricaoExpanded ? 'bg-white/10' : 'bg-green-500/30'}`} />
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </section>
          )}

          <section className="relative mb-20"><OfferDetails oferta={o} /></section>

          {isAdmin && (
            <section className="relative mb-20 border-t border-white/10 pt-20">
              <div className="p-12 rounded-[3rem] bg-[#0d0d0d] border border-green-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Settings size={180} className="text-green-500 group-hover:rotate-45 transition-transform duration-1000" /></div>
                <div className="relative z-10 mb-12">
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.5em]">Central de Comando</span>
                  <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">PAINEL <span className="text-green-500">ADMIN</span></h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                  <div className="space-y-6 md:col-span-2">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Gerenciar Pontos de Conversão</div>
                    {((o as any)?.metricas?.landingPages || []).map((landing: any, index: number) => (
                      <div key={index} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <input id={`admin-landing-name-${index}`} defaultValue={landing.name} className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                        <input id={`admin-landing-url-${index}`} defaultValue={landing.url} className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                        <button onClick={async () => {
                          const name = (document.getElementById(`admin-landing-name-${index}`) as any).value;
                          const url = (document.getElementById(`admin-landing-url-${index}`) as any).value;
                          const metricas = { ...(o as any).metricas };
                          metricas.landingPages[index] = { name, url, type: 'variacao' };
                          await fetch('/api/ofertas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, metricas }) });
                          setOfertaDetalhe({ ...o, metricas }); showToast('Atualizado', 'success', 2000);
                        }} className="px-4 bg-green-500 text-black text-[10px] font-black rounded-xl">SALVAR</button>
                      </div>
                    ))}
                    <div className="flex gap-4 p-6 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                      <input id="admin-new-landing-name" placeholder="NOME DO NÓ" className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                      <input id="admin-new-landing-url" placeholder="URL FONTE" className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                      <button onClick={async () => {
                        const name = (document.getElementById('admin-new-landing-name') as any).value;
                        const url = (document.getElementById('admin-new-landing-url') as any).value;
                        if (!url) return;
                        const metricas = { ...(o as any).metricas || { landingPages: [] } };
                        metricas.landingPages = [...(metricas.landingPages || []), { name, url, type: 'variacao' }];
                        await fetch('/api/ofertas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, metricas }) });
                        setOfertaDetalhe({ ...o, metricas }); showToast('Adicionado', 'success', 2000);
                      }} className="px-4 bg-white text-black text-[10px] font-black rounded-xl italic">ADICIONAR_NÓ</button>
                    </div>
                  </div>

                  {/* MÍDIA PRINCIPAL: IMAGEM & VSL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em]">IMAGEM_HOST_PROTOCOL</span>
                        <span className="text-[8px] text-white/20 uppercase tracking-widest">Sincronização de Identidade Visual</span>
                      </div>
                      <div className="flex gap-2">
                        <input id="admin-img-url" defaultValue={o.imagem} className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white/50" />
                        <button onClick={async () => {
                          const imagem = (document.getElementById('admin-img-url') as any).value;
                          await fetch('/api/ofertas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, imagem }) });
                          setOfertaDetalhe({ ...o, imagem }); showToast('Endereço IP de Imagem salvo.', 'success', 2000);
                        }} className="px-6 bg-white text-black text-[10px] font-black rounded-xl">SAVE</button>
                      </div>
                      <label className="flex items-center justify-between p-6 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-green-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                            <ImageIcon size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">SUBIR_ARQUIVO_LOCAL</span>
                            <span className="text-[8px] text-white/20 uppercase">JPG, PNG, WEBP (MAX 5MB)</span>
                          </div>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingImagemPrincipal(true);
                          try {
                            const fd = new FormData(); fd.set('file', file); fd.set('kind', 'imagem');
                            const res = await fetch('/api/upload', { method: 'POST', body: fd });
                            const data = await res.json();
                            if (res.ok) {
                              const imagem = data.url;
                              await fetch('/api/ofertas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, imagem }) });
                              setOfertaDetalhe({ ...o, imagem }); showToast('Identidade Visual Sincronizada.', 'success', 2000);
                            }
                          } catch { showToast('Erro no protocolo de upload.', 'error', 3000); }
                          finally { setUploadingImagemPrincipal(false); }
                        }} />
                        {uploadingImagemPrincipal && <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full" />}
                      </label>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">VSL_CORE_STREAM</span>
                        <span className="text-[8px] text-white/20 uppercase tracking-widest">Fluxo de Dados de Alta Conversão</span>
                      </div>
                      <div className="flex gap-2">
                        <input id="admin-vsl-url" defaultValue={o.vsl} className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white/50" />
                        <button onClick={async () => {
                          const vsl = (document.getElementById('admin-vsl-url') as any).value;
                          await fetch('/api/ofertas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, vsl }) });
                          setOfertaDetalhe({ ...o, vsl }); showToast('Stream URL salva.', 'success', 2000);
                        }} className="px-6 bg-white text-black text-[10px] font-black rounded-xl">SAVE</button>
                      </div>
                      <label className="flex items-center justify-between p-6 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-cyan-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                            <Video size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">SINCRONIZAR_MP4_LOCAL</span>
                            <span className="text-[8px] text-white/20 uppercase">MP4, WEBM (MAX 50MB)</span>
                          </div>
                        </div>
                        <input type="file" accept="video/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingVsl(true);
                          try {
                            const fd = new FormData(); fd.set('file', file); fd.set('kind', 'vsl');
                            const res = await fetch('/api/upload', { method: 'POST', body: fd });
                            const data = await res.json();
                            if (res.ok) {
                              const vsl = data.url;
                              await fetch('/api/ofertas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, vsl }) });
                              setOfertaDetalhe({ ...o, vsl }); showToast('Core Stream Sincronizado.', 'success', 2000);
                            }
                          } catch { showToast('Erro no stream de dados.', 'error', 3000); }
                          finally { setUploadingVsl(false); }
                        }} />
                        {uploadingVsl && <div className="animate-spin w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full" />}
                      </label>
                    </div>
                  </div>

                  {/* CRIATIVOS: IMAGEM & VÍDEO ARQUIVO */}
                  <div className="md:col-span-2 pt-10 border-t border-white/5 space-y-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">ASSET_COLLECTION_INPUT</span>
                      <span className="text-[8px] text-white/20 uppercase tracking-widest">Injeção de Criativos via Sistema de Arquivo</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center justify-center gap-4 p-8 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[2rem] cursor-pointer hover:border-yellow-500/20 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-yellow-500"><ImageIcon size={24} /></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">INJETAR_IMAGEM</span>
                          <span className="text-[8px] text-white/10 uppercase italic">Multi-Storage Protocol</span>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingCriativo(true);
                          try {
                            const fd = new FormData(); fd.set('file', file); fd.set('kind', 'extra');
                            const res = await fetch('/api/upload', { method: 'POST', body: fd });
                            const data = await res.json();
                            if (res.ok) {
                              const currentLinks = Array.isArray(o.links) ? o.links : [];
                              const links = [...currentLinks, data.url];
                              await fetch('/api/ofertas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, links }) });
                              setOfertaDetalhe({ ...o, links }); showToast('Asset Visual Indexado.', 'success', 2000);
                            }
                          } catch { showToast('Erro na injeção de asset.', 'error', 3000); }
                          finally { setUploadingCriativo(false); }
                        }} />
                      </label>

                      <label className="flex items-center justify-center gap-4 p-8 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[2rem] cursor-pointer hover:border-blue-500/20 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-blue-500"><Video size={24} /></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">INJETAR_VÍDEO</span>
                          <span className="text-[8px] text-white/10 uppercase italic">Media Stream Injection</span>
                        </div>
                        <input type="file" accept="video/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingCriativo(true);
                          try {
                            const fd = new FormData(); fd.set('file', file); fd.set('kind', 'extra');
                            const res = await fetch('/api/upload', { method: 'POST', body: fd });
                            const data = await res.json();
                            if (res.ok) {
                              const currentLinks = Array.isArray(o.links) ? o.links : [];
                              const links = [...currentLinks, data.url];
                              await fetch('/api/ofertas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, links }) });
                              setOfertaDetalhe({ ...o, links }); showToast('Asset Media Indexado.', 'success', 2000);
                            }
                          } catch { showToast('Erro na injeção de stream.', 'error', 3000); }
                          finally { setUploadingCriativo(false); }
                        }} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
        <div className="h-32" />
      </div>
    </div>
  );
}
