"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNichos } from '@/context/NichoContext';
import { useOfertaContext } from '@/context/OfertaContext';
import { Button } from '@/components/ui/Button';
import { Card3D } from '@/components/ui/Card3D';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { Plus, ArrowLeft, CheckCircle2, FileText, Link as LinkIcon, Sparkles, Target, Globe, Zap, Video, Image as ImageIcon, Upload, X, FileImage, Settings } from 'lucide-react';
import mammoth from 'mammoth';

type LandingPage = {
  name: string;
  url: string;
  type?: string;
};

type Form = {
  titulo: string;
  texto: string;
  nichoId: string;
  plataforma: string;
  tipoOferta: string;
  linguagem: string;
  status: string;
  tags: string[];
  links: string[];
  vsl?: string;
  vslDescricao?: string;
  imagem?: string;
  criativos: string[];
  videosExtras: string[];
  landingPages: LandingPage[];
  landingUrl?: string;
};

// Plataformas corretas conforme schema
const PLATAFORMAS = [
  { value: 'facebook_ads', label: 'Facebook Ads' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'tiktok_ads', label: 'TikTok Ads' },
  { value: 'instagram_ads', label: 'Instagram Ads' },
  { value: 'linkedin_ads', label: 'LinkedIn Ads' },
  { value: 'twitter_ads', label: 'Twitter Ads' },
  { value: 'pinterest_ads', label: 'Pinterest Ads' },
  { value: 'snapchat_ads', label: 'Snapchat Ads' },
];

// Tipos corretos conforme schema
const TIPOS = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'lead_generation', label: 'Lead Generation' },
  { value: 'app_install', label: 'App Install' },
  { value: 'brand_awareness', label: 'Brand Awareness' },
  { value: 'video_views', label: 'Video Views' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'traffic', label: 'Traffic' },
];

const STATUS = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'arquivada', label: 'Arquivada' },
  { value: 'teste', label: 'Teste' },
];

const LINGUAS = [
  { value: 'pt_BR', label: 'Português (BR)' },
  { value: 'en_US', label: 'English (US)' },
  { value: 'es_ES', label: 'Español (ES)' },
  { value: 'fr_FR', label: 'Français (FR)' },
];

export default function CriarOfertaPage() {
  const router = useRouter();
  const { nichos } = useNichos();
  const { criarOferta } = useOfertaContext();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<{
    imagem?: boolean;
    vsl?: boolean;
    criativo?: boolean;
    vslDescricao?: boolean;
    extraVideo?: boolean;
  }>({});
  
  const [form, setForm] = useState<Form>({
    titulo: '',
    texto: '',
    nichoId: '',
    plataforma: 'facebook_ads',
    tipoOferta: 'ecommerce',
    linguagem: 'pt_BR',
    status: 'ativa',
    tags: [],
    links: [''],
    vsl: '',
    vslDescricao: '',
    imagem: '',
    criativos: [],
    videosExtras: [],
    landingPages: [],
    landingUrl: '',
  });

  function setField<K extends keyof Form>(key: K, value: Form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key as string]) setErrors(prev => ({ ...prev, [key as string]: '' }));
  }

  function validate(s: 1 | 2 | 3 | 4) {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.titulo.trim()) e.titulo = 'Informe um título';
      if (!form.texto.trim()) e.texto = 'Descreva a oferta';
      if (!form.nichoId) e.nichoId = 'Selecione um nicho';
    }
    if (s === 4) {
      const hasLink = form.links.some(l => l.trim());
      const hasMidia = !!(form.vsl?.trim() || form.imagem?.trim());
      const hasCriativo = form.criativos.length > 0;
      const hasExtraVideo = form.videosExtras.length > 0;
      if (!hasLink && !hasMidia && !hasCriativo && !hasExtraVideo) {
        e.links = 'Adicione ao menos um link, uma VSL, uma imagem, um criativo ou um vídeo extra';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleFileUpload(file: File, kind: 'imagem' | 'vsl' | 'extra'): Promise<string | null> {
    try {
      const fd = new FormData();
      fd.set('file', file);
      fd.set('kind', kind);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || 'Falha no upload', 'error', 3000);
        return null;
      }
      return data.url as string;
    } catch (error) {
      showToast('Erro no upload', 'error', 3000);
      return null;
    }
  }

  async function handleSubmit() {
    if (!validate(1) || !validate(4)) return;
    setLoading(true);
    try {
      const links = form.links.filter(l => l.trim());
      const metricas: any = {};
      
      // Adicionar landing pages às métricas
      if (form.landingPages.length > 0) {
        metricas.landingPages = form.landingPages;
      }
      if (form.landingUrl) {
        metricas.landingUrl = form.landingUrl;
      }

      // Combinar links principais com criativos
      const allLinks = [...links, ...form.criativos, ...form.videosExtras];

      const ok = await criarOferta({
        titulo: form.titulo,
        texto: form.texto,
        nichoId: form.nichoId,
        plataforma: form.plataforma as any,
        tipoOferta: form.tipoOferta as any,
        linguagem: form.linguagem as any,
        status: form.status as any,
        tags: form.tags.length > 0 ? form.tags : undefined,
        links: allLinks,
        vsl: form.vsl || undefined,
        vslDescricao: form.vslDescricao || undefined,
        imagem: form.imagem || undefined,
        metricas: Object.keys(metricas).length > 0 ? metricas : undefined,
        isActive: true,
      } as any);
      
      if (ok) {
        showToast('Oferta criada com sucesso! 🎉', 'success', 3000);
        router.push('/ofertas');
      } else {
        showToast('Erro ao criar oferta', 'error', 3000);
      }
    } catch (error) {
      showToast('Erro ao criar oferta', 'error', 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Atmosférico */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(16,185,129,0.15),_transparent_70%)] rounded-full blur-[100px] animate-float" style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-0 right-[15%] w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(6,182,212,0.15),_transparent_70%)] rounded-full blur-[100px] animate-float" style={{ animationDuration: '25s', animationDelay: '-5s' }} />
      </div>

      {/* Header Dopaminérgico */}
      <div className="relative bg-gradient-to-br from-surface via-surface-secondary to-surface border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 flex items-center gap-4">
            <Button 
              variant="secondary" 
              onClick={() => router.back()} 
              className="flex items-center gap-2 group"
              hasRipple
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <div className="absolute inset-0 blur-md bg-accent/30 rounded-full animate-pulse opacity-50" />
                  <Plus className="relative w-8 h-8 text-accent" 
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))',
                    }}
                  />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-accent via-cyan-500 to-green-500 bg-clip-text text-transparent">
                  Criar Nova Oferta
                </h1>
              </div>
              <p className="text-text-secondary mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent/60" />
                Siga as 4 etapas. Você pode ajustar depois.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stepper Dopaminérgico */}
        <Card3D variant="floating" className="mb-8 p-6">
          <div className="flex items-center justify-center gap-4">
            {[1,2,3,4].map((n) => (
              <div key={n} className="flex items-center gap-4 flex-1">
                <div className="flex flex-col items-center gap-2">
                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                    step > n 
                      ? 'bg-accent text-white border-accent shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110' 
                      : step === n 
                        ? 'bg-gradient-to-r from-accent to-cyan-500 text-white border-transparent shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110 animate-pulse' 
                        : 'bg-surface-secondary text-text-secondary border-border'
                  }`}>
                    {step > n ? <CheckCircle2 className="w-6 h-6 animate-elastic-bounce" /> : n}
                    {step === n && (
                      <div className="absolute inset-0 rounded-full shimmer opacity-30" />
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${
                    step >= n ? 'text-accent' : 'text-text-tertiary'
                  }`}>
                    {n === 1 ? 'Básico' : n === 2 ? 'Config' : n === 3 ? 'Mídia' : 'Extras'}
                  </span>
                </div>
                {n < 4 && (
                  <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                    step > n 
                      ? 'bg-gradient-to-r from-accent to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                      : step === n
                        ? 'bg-gradient-to-r from-accent/50 to-transparent'
                        : 'bg-surface-secondary'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </Card3D>

        <Card3D variant="elevated" hover className="p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="relative inline-block mb-2">
                  <div className="absolute inset-0 blur-md bg-accent/20 rounded-full animate-pulse" />
                  <Sparkles className="relative w-6 h-6 text-accent mx-auto" 
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))',
                    }}
                  />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-accent to-cyan-500 bg-clip-text text-transparent mt-1">
                  Informações Básicas
                </h2>
                <p className="text-sm text-text-secondary mt-1">Título, descrição, nicho e status</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Título *</label>
                <Input 
                  value={form.titulo} 
                  onChange={(e)=>setField('titulo', e.target.value)} 
                  placeholder="Ex.: Curso de Marketing Digital Completo" 
                  className={errors.titulo ? 'border-error' : ''} 
                />
                {errors.titulo && <p className="text-error text-xs mt-1">{errors.titulo}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Descrição *</label>
                <textarea
                  value={form.texto}
                  onChange={(e)=>setField('texto', e.target.value)}
                  rows={6}
                  placeholder="Explique a oferta de forma detalhada e objetiva..."
                  className={`w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent ${errors.texto ? 'border-error' : ''}`}
                />
                {errors.texto && <p className="text-error text-xs mt-1">{errors.texto}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" />
                  Nicho *
                </label>
                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ${errors.nichoId ? 'border-2 border-error rounded-lg p-2' : ''}`}>
                  {Array.isArray(nichos) && nichos.length > 0 ? (
                    nichos.map((n) => {
                      const isSelected = form.nichoId === n.id;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setField('nichoId', n.id)}
                          className="group relative"
                        >
                          <Card3D
                            variant={isSelected ? 'neon' : 'elevated'}
                            hover
                            glow={isSelected}
                            has3DRotation
                            className={`w-full h-20 transition-all duration-300 ${
                              isSelected 
                                ? 'scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                                : 'hover:scale-105'
                            } ${errors.nichoId ? 'border-error' : ''}`}
                          >
                            <div className="flex flex-col items-center justify-center h-full gap-2 relative overflow-hidden">
                              {isSelected && (
                                <>
                                  <div className="absolute inset-0 shimmer opacity-30" />
                                  <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-cyan-500/10 to-green-500/20" />
                                </>
                              )}
                              <div className="relative z-10 flex flex-col items-center gap-1">
                                <div className={`p-1.5 rounded-full transition-all ${
                                  isSelected 
                                    ? 'bg-gradient-to-r from-accent to-cyan-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' 
                                    : 'bg-surface-secondary group-hover:bg-accent/20'
                                }`}>
                                  <Target className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-text-secondary group-hover:text-accent'}`} />
                                </div>
                                <span className={`text-xs font-semibold text-center px-1 ${
                                  isSelected 
                                    ? 'text-accent' 
                                    : 'text-text-secondary group-hover:text-text-primary'
                                }`}>
                                  {n.nome}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center animate-elastic-bounce">
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          </Card3D>
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-8 text-text-secondary">
                      Carregando nichos...
                    </div>
                  )}
                </div>
                {errors.nichoId && <p className="text-error text-xs mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-error rounded-full" />
                  {errors.nichoId}
                </p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-accent" />
                  Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {STATUS.map((s) => {
                    const isSelected = form.status === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setField('status', s.value)}
                        className="group relative"
                      >
                        <Card3D
                          variant={isSelected ? 'neon' : 'elevated'}
                          hover
                          glow={isSelected}
                          className={`w-full h-14 transition-all duration-300 ${
                            isSelected ? 'scale-105' : 'hover:scale-105'
                          }`}
                        >
                          <div className="flex items-center justify-center h-full gap-2 relative overflow-hidden px-4">
                            {isSelected && (
                              <>
                                <div className="absolute inset-0 shimmer opacity-30" />
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/10" />
                              </>
                            )}
                            <span className={`text-sm font-semibold ${isSelected ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'}`}>
                              {s.label}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-accent animate-elastic-bounce" />
                            )}
                          </div>
                        </Card3D>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="relative inline-block mb-2">
                  <div className="absolute inset-0 blur-md bg-accent/20 rounded-full animate-pulse" />
                  <FileText className="relative w-6 h-6 text-accent mx-auto" 
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))',
                    }}
                  />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-accent to-cyan-500 bg-clip-text text-transparent mt-1">
                  Configurações
                </h2>
                <p className="text-sm text-text-secondary mt-1">Plataforma, tipo, idioma e tags</p>
              </div>

              {/* Plataforma */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  Plataforma
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PLATAFORMAS.map((p) => {
                    const isSelected = form.plataforma === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setField('plataforma', p.value)}
                        className="group relative"
                      >
                        <Card3D
                          variant={isSelected ? 'neon' : 'elevated'}
                          hover
                          glow={isSelected}
                          className={`w-full h-16 transition-all duration-300 ${
                            isSelected ? 'scale-105' : 'hover:scale-105'
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center h-full gap-1 relative overflow-hidden">
                            {isSelected && (
                              <>
                                <div className="absolute inset-0 shimmer opacity-30" />
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-cyan-500/10" />
                              </>
                            )}
                            <span className={`text-xs font-semibold text-center px-2 ${isSelected ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'}`}>
                              {p.label.replace(' Ads', '')}
                            </span>
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                        </Card3D>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" />
                  Tipo de Oferta
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {TIPOS.map((t) => {
                    const isSelected = form.tipoOferta === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setField('tipoOferta', t.value)}
                        className="group relative"
                      >
                        <Card3D
                          variant={isSelected ? 'neon' : 'elevated'}
                          hover
                          glow={isSelected}
                          className={`w-full h-16 transition-all duration-300 ${
                            isSelected ? 'scale-105' : 'hover:scale-105'
                          }`}
                        >
                          <div className="flex items-center justify-center h-full gap-2 relative overflow-hidden px-4">
                            {isSelected && (
                              <>
                                <div className="absolute inset-0 shimmer opacity-30" />
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/10" />
                              </>
                            )}
                            <span className={`text-xs font-semibold text-center ${isSelected ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'}`}>
                              {t.label}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-accent animate-elastic-bounce" />
                            )}
                          </div>
                        </Card3D>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Idioma */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-accent" />
                  Idioma
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {LINGUAS.map((l) => {
                    const isSelected = form.linguagem === l.value;
                    return (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setField('linguagem', l.value)}
                        className="group relative"
                      >
                        <Card3D
                          variant={isSelected ? 'neon' : 'elevated'}
                          hover
                          glow={isSelected}
                          className={`w-full h-16 transition-all duration-300 ${
                            isSelected ? 'scale-105' : 'hover:scale-105'
                          }`}
                        >
                          <div className="flex items-center justify-center h-full gap-2 relative overflow-hidden px-4">
                            {isSelected && (
                              <>
                                <div className="absolute inset-0 shimmer opacity-30" />
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/10" />
                              </>
                            )}
                            <Globe className={`w-4 h-4 ${isSelected ? 'text-accent' : 'text-text-secondary group-hover:text-accent'}`} />
                            <span className={`text-sm font-semibold ${isSelected ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'}`}>
                              {l.label}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-accent animate-elastic-bounce" />
                            )}
                          </div>
                        </Card3D>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Tags (opcional)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-semibold border border-accent/30"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setField('tags', form.tags.filter((_, idx) => idx !== i))}
                        className="hover:text-accent-hover"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma tag e pressione Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const value = input.value.trim();
                        if (value && !form.tags.includes(value)) {
                          setField('tags', [...form.tags, value]);
                          input.value = '';
                        }
                      }
                    }}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="relative inline-block mb-2">
                  <div className="absolute inset-0 blur-md bg-accent/20 rounded-full animate-pulse" />
                  <ImageIcon className="relative w-6 h-6 text-accent mx-auto" 
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))',
                    }}
                  />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-accent to-cyan-500 bg-clip-text text-transparent mt-1">
                  Mídia Principal
                </h2>
                <p className="text-sm text-text-secondary mt-1">Imagem, VSL e descrição do VSL</p>
              </div>

              {/* Imagem Principal */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-accent" />
                  Imagem Principal
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    value={form.imagem || ''}
                    onChange={(e) => setField('imagem', e.target.value)}
                    placeholder="URL da imagem (https://...)"
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <label className="flex-1 px-3 py-2 bg-surface/50 border border-border rounded-lg text-sm text-text-secondary cursor-pointer hover:border-accent transition-all flex items-center gap-2">
                      <Upload className="w-4 h-4 text-accent" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(prev => ({ ...prev, imagem: true }));
                          const url = await handleFileUpload(file, 'imagem');
                          if (url) {
                            setField('imagem', url);
                            showToast('Imagem enviada com sucesso! ✅', 'success', 2000);
                          }
                          setUploading(prev => ({ ...prev, imagem: false }));
                        }}
                      />
                      <span className="flex-1 text-xs">Upload</span>
                    </label>
                  </div>
                </div>
                {uploading.imagem && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <LoadingSpinner size={16} />
                    Enviando imagem...
                  </div>
                )}
                {form.imagem && (
                  <div className="mt-2">
                    <img src={form.imagem} alt="Preview" className="max-w-full h-32 object-cover rounded-lg border border-border" />
                  </div>
                )}
              </div>

              {/* VSL */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                  <Video className="w-4 h-4 text-accent" />
                  VSL (Video Sales Letter)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    value={form.vsl || ''}
                    onChange={(e) => setField('vsl', e.target.value)}
                    placeholder="URL do vídeo (https://...)"
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <label className="flex-1 px-3 py-2 bg-surface/50 border border-border rounded-lg text-sm text-text-secondary cursor-pointer hover:border-accent transition-all flex items-center gap-2">
                      <Upload className="w-4 h-4 text-accent" />
                      <input
                        type="file"
                        accept="video/mp4"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(prev => ({ ...prev, vsl: true }));
                          const url = await handleFileUpload(file, 'vsl');
                          if (url) {
                            setField('vsl', url);
                            showToast('VSL enviada com sucesso! ✅', 'success', 2000);
                          }
                          setUploading(prev => ({ ...prev, vsl: false }));
                        }}
                      />
                      <span className="flex-1 text-xs">Upload MP4</span>
                    </label>
                  </div>
                </div>
                {uploading.vsl && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <LoadingSpinner size={16} />
                    Enviando VSL...
                  </div>
                )}
              </div>

              {/* Descrição do VSL */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  Descrição do VSL (opcional)
                </label>
                <div className="space-y-2">
                  <textarea
                    value={form.vslDescricao || ''}
                    onChange={(e) => setField('vslDescricao', e.target.value)}
                    rows={6}
                    placeholder="Digite ou cole a descrição do VSL aqui..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <div className="flex gap-2">
                    <label className="flex-1 px-3 py-2 bg-surface/50 border border-border rounded-lg text-sm text-text-secondary cursor-pointer hover:border-accent transition-all flex items-center gap-2">
                      <Upload className="w-4 h-4 text-accent" />
                      <input
                        type="file"
                        accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(prev => ({ ...prev, vslDescricao: true }));
                          try {
                            const fileName = file.name.toLowerCase();
                            let text: string;
                            
                            if (fileName.endsWith('.docx')) {
                              // Ler arquivo .docx usando mammoth
                              const arrayBuffer = await file.arrayBuffer();
                              const result = await mammoth.extractRawText({ arrayBuffer });
                              text = result.value;
                            } else {
                              // Ler arquivo .txt normalmente
                              text = await file.text();
                            }
                            
                            setField('vslDescricao', text);
                            showToast('Descrição do VSL carregada! ✅', 'success', 2000);
                          } catch {
                            showToast('Erro ao ler arquivo', 'error', 2000);
                          }
                          setUploading(prev => ({ ...prev, vslDescricao: false }));
                        }}
                      />
                      <span className="flex-1 text-xs">Upload .txt/.docx</span>
                    </label>
                  </div>
                </div>
                {uploading.vslDescricao && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <LoadingSpinner size={16} />
                    Carregando descrição...
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="relative inline-block mb-2">
                  <div className="absolute inset-0 blur-md bg-accent/20 rounded-full animate-pulse" />
                  <LinkIcon className="relative w-6 h-6 text-accent mx-auto" 
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))',
                    }}
                  />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-accent to-cyan-500 bg-clip-text text-transparent mt-1">
                  Links, Criativos e Landing Pages
                </h2>
                <p className="text-sm text-text-secondary mt-1">Adicione links, criativos e landing pages</p>
              </div>

              {/* Links Principais */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-primary">Links Principais (opcional)</label>
                {form.links.map((l, i) => (
                  <div className="flex items-center gap-2" key={i}>
                    <Input 
                      value={l} 
                      onChange={(e)=>{
                        const next = [...form.links]; 
                        next[i] = e.target.value; 
                        setField('links', next);
                      }} 
                      placeholder="https://..." 
                      className="flex-1" 
                    />
                    {form.links.length > 1 && (
                      <Button 
                        variant="secondary" 
                        onClick={()=>{ 
                          const next = form.links.filter((_,idx)=>idx!==i); 
                          setField('links', next); 
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="secondary" onClick={()=>setField('links', [...form.links, ''])}>
                  <Plus className="w-4 h-4" /> Adicionar link
                </Button>
                {errors.links && <p className="text-error text-xs">{errors.links}</p>}
              </div>

              {/* Criativos */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-accent" />
                  Criativos (imagens adicionais)
                </label>
                <div className="space-y-2">
                  {form.criativos.map((criativo, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={criativo}
                        onChange={(e) => {
                          const next = [...form.criativos];
                          next[i] = e.target.value;
                          setField('criativos', next);
                        }}
                        placeholder="URL do criativo (https://...)"
                        className="flex-1"
                      />
                      <Button
                        variant="secondary"
                        onClick={() => setField('criativos', form.criativos.filter((_, idx) => idx !== i))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="URL do criativo ou faça upload"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const value = input.value.trim();
                          if (value && !form.criativos.includes(value)) {
                            setField('criativos', [...form.criativos, value]);
                            input.value = '';
                          }
                        }
                      }}
                      className="flex-1"
                    />
                    <label className="px-3 py-2 bg-surface/50 border border-border rounded-lg text-sm text-text-secondary cursor-pointer hover:border-accent transition-all flex items-center gap-2">
                      <Upload className="w-4 h-4 text-accent" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(prev => ({ ...prev, criativo: true }));
                          const url = await handleFileUpload(file, 'extra');
                          if (url) {
                            setField('criativos', [...form.criativos, url]);
                            showToast('Criativo adicionado! ✅', 'success', 2000);
                          }
                          setUploading(prev => ({ ...prev, criativo: false }));
                        }}
                      />
                      <span className="text-xs">Upload</span>
                    </label>
                  </div>
                </div>
                {uploading.criativo && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <LoadingSpinner size={16} />
                    Enviando criativo...
                  </div>
                )}
              </div>

              {/* Vídeos Extras */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                  <Video className="w-4 h-4 text-accent" />
                  Vídeos extras (opcional)
                </label>
                <div className="space-y-2">
                  {form.videosExtras.map((videoUrl, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={videoUrl}
                        onChange={(e) => {
                          const next = [...form.videosExtras];
                          next[i] = e.target.value;
                          setField('videosExtras', next);
                        }}
                        placeholder="URL do vídeo (https://...)"
                        className="flex-1"
                      />
                      <Button
                        variant="secondary"
                        onClick={() => setField('videosExtras', form.videosExtras.filter((_, idx) => idx !== i))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input
                      placeholder="URL do vídeo ou faça upload"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const value = input.value.trim();
                          if (value && !form.videosExtras.includes(value)) {
                            setField('videosExtras', [...form.videosExtras, value]);
                            input.value = '';
                          }
                        }
                      }}
                      className="flex-1"
                    />
                    <label className="px-3 py-2 bg-surface/50 border border-border rounded-lg text-sm text-text-secondary cursor-pointer hover:border-accent transition-all flex items-center gap-2">
                      <Upload className="w-4 h-4 text-accent" />
                      <input
                        type="file"
                        accept="video/mp4"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(prev => ({ ...prev, extraVideo: true }));
                          const url = await handleFileUpload(file, 'vsl');
                          if (url) {
                            setField('videosExtras', [...form.videosExtras, url]);
                            showToast('Vídeo extra adicionado! ✅', 'success', 2000);
                          }
                          setUploading(prev => ({ ...prev, extraVideo: false }));
                        }}
                      />
                      <span className="text-xs whitespace-nowrap">Upload MP4</span>
                    </label>
                  </div>
                </div>
                {uploading.extraVideo && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <LoadingSpinner size={16} />
                    Enviando vídeo extra...
                  </div>
                )}
              </div>

              {/* Landing Pages */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-accent" />
                  Landing Pages (opcional)
                </label>
                <div className="space-y-3">
                  {form.landingPages.map((landing, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={landing.name}
                        onChange={(e) => {
                          const next = [...form.landingPages];
                          next[i] = { ...next[i], name: e.target.value };
                          setField('landingPages', next);
                        }}
                        placeholder="Nome (ex: Página de Captura)"
                        className="flex-1"
                      />
                      <Input
                        value={landing.url}
                        onChange={(e) => {
                          const next = [...form.landingPages];
                          next[i] = { ...next[i], url: e.target.value };
                          setField('landingPages', next);
                        }}
                        placeholder="URL (https://...)"
                        className="flex-1"
                      />
                      <Button
                        variant="secondary"
                        onClick={() => setField('landingPages', form.landingPages.filter((_, idx) => idx !== i))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    onClick={() => setField('landingPages', [...form.landingPages, { name: '', url: '', type: 'variacao' }])}
                  >
                    <Plus className="w-4 h-4" /> Adicionar Landing Page
                  </Button>
                </div>

                {/* Landing Page Principal (compatibilidade) */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Landing Page Principal (compatibilidade)
                  </label>
                  <Input
                    value={form.landingUrl || ''}
                    onChange={(e) => setField('landingUrl', e.target.value)}
                    placeholder="URL da landing page principal (https://...)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navegação Dopaminérgica */}
          <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-6">
            <Button 
              variant="secondary" 
              onClick={()=>setStep(prev => (prev === 1 ? 1 : (prev-1) as any))}
              className="flex items-center gap-2 group"
              hasRipple
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              {step < 4 ? (
                <Button 
                  variant="gradient" 
                  hasGlow
                  onClick={()=>{ if (validate(step)) setStep((step+1) as any); }}
                  className="flex items-center gap-2"
                  hasRipple
                >
                  Próximo
                  <Sparkles size={16} className="animate-pulse" />
                </Button>
              ) : (
                <Button 
                  variant="gradient" 
                  hasGlow
                  onClick={handleSubmit} 
                  className="flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]" 
                  disabled={loading}
                  hasRipple
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size={16} />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="animate-pulse" />
                      Criar Oferta
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card3D>
      </div>
    </div>
  );
}
