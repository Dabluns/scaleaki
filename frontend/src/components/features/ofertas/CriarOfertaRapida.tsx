"use client";

import { useState } from 'react';
import { useOfertaContext } from '@/context/OfertaContext';
import { useNichos } from '@/context/NichoContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { 
  Plus, 
  Save, 
  X, 
  Sparkles,
  Target,
  Link as LinkIcon,
  Video,
  Upload
} from 'lucide-react';

interface CriarOfertaRapidaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (oferta: any) => void;
}

export function CriarOfertaRapida({ isOpen, onClose, onSuccess }: CriarOfertaRapidaProps) {
  const { nichos } = useNichos();
  const { criarOferta } = useOfertaContext();
  
  const [formData, setFormData] = useState({
    titulo: '',
    texto: '',
    nichoId: '',
    plataforma: 'facebook_ads',
    linguagem: 'pt_BR',
    links: [''],
    vsl: '',
    imagem: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingVsl, setUploadingVsl] = useState(false);
  const [uploadingImagem, setUploadingImagem] = useState(false);
  const [uploadingCriativos, setUploadingCriativos] = useState(false);
  const [msgVsl, setMsgVsl] = useState('');
  const [msgImagem, setMsgImagem] = useState('');
  const [msgCriativos, setMsgCriativos] = useState('');
  const [uploadingTxt, setUploadingTxt] = useState(false);
  const [msgTxt, setMsgTxt] = useState('');

  const updateField = (field: string, value: any) => {
    if (field === 'imagem') {
      setFormData(prev => ({
        ...prev,
        imagem: value,
        // garantir que a imagem principal não fique na lista de criativos
        links: prev.links.filter(l => l !== value)
      }));
      if (errors['links']) setErrors(prev => ({ ...prev, ['links']: '' }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, '']
    }));
  };

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const updateLink = (index: number, value: string) => {
    setFormData(prev => {
      // não permitir que um criativo seja igual à imagem principal
      if (value === prev.imagem) return prev;
      const next = prev.links.map((link, i) => i === index ? value : link);
      // deduplicar
      const dedup = Array.from(new Set(next));
      return { ...prev, links: dedup };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }
    if (!formData.texto.trim()) {
      newErrors.texto = 'Texto é obrigatório';
    }
    if (!formData.nichoId) {
      newErrors.nichoId = 'Selecione um nicho';
    }
    const hasAnyLink = formData.links.some(link => link.trim());
    const hasVsl = !!formData.vsl?.trim();
    const hasImagem = !!formData.imagem?.trim();
    if (!hasAnyLink && !hasVsl && !hasImagem) {
      newErrors.links = 'Adicione pelo menos um link, uma VSL ou uma imagem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const filteredLinks = formData.links.filter(link => link.trim());
      
      const ofertaData = {
        ...formData,
        links: filteredLinks,
        tipoOferta: 'ecommerce' as const,
        status: 'ativa' as const,
        isActive: true
      };

      const success = await criarOferta(ofertaData);
      if (success) {
        onSuccess?.(ofertaData);
        handleClose();
      }
    } catch (error) {
      console.error('Erro ao criar oferta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      titulo: '',
      texto: '',
      nichoId: '',
      plataforma: 'facebook_ads',
      linguagem: 'pt_BR',
      links: [''],
      vsl: '',
      imagem: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Criar Oferta Rápida"
      size="lg"
    >
      <div className="space-y-6">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <div className="text-center mb-4">
            <Sparkles className="w-8 h-8 text-accent mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-text-primary">Informações Básicas</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Título da Oferta *
            </label>
            <Input
              value={formData.titulo}
              onChange={(e) => updateField('titulo', e.target.value)}
              placeholder="Ex: Curso Completo de Marketing Digital"
              className={errors.titulo ? 'border-error' : ''}
            />
            {errors.titulo && (
              <p className="text-error text-sm mt-1">{errors.titulo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Descrição da Oferta *
            </label>
            <textarea
              value={formData.texto}
              onChange={(e) => updateField('texto', e.target.value)}
              placeholder="Descreva sua oferta de forma atrativa..."
              rows={3}
              className={`w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none ${
                errors.texto ? 'border-error' : ''
              }`}
            />
            {errors.texto && (
              <p className="text-error text-sm mt-1">{errors.texto}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Nicho *
            </label>
            <select
              value={formData.nichoId}
              onChange={(e) => updateField('nichoId', e.target.value)}
              className={`w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                errors.nichoId ? 'border-error' : ''
              }`}
            >
              <option value="">Selecione um nicho</option>
              {nichos.map((nicho) => (
                <option key={nicho.id} value={nicho.id}>
                  {nicho.nome}
                </option>
              ))}
            </select>
            {errors.nichoId && (
              <p className="text-error text-sm mt-1">{errors.nichoId}</p>
            )}
          </div>
        </div>

        {/* Bloco: Transcrição (.txt) */}
        <div className="space-y-4">
          <div className="text-center mb-2">
            <h3 className="text-lg font-semibold text-text-primary">Transcrição (opcional)</h3>
            <p className="text-xs text-text-secondary">Envie um arquivo .txt com a transcrição da VSL ou roteiro</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="text/plain"
              id="criar-transc-file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setUploadingTxt(true); setMsgTxt('');
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('kind', 'transcricao');
                  const up = await fetch('/api/upload', { method: 'POST', body: fd, cache: 'no-store' });
                  const payload = await up.json();
                  if (!up.ok) throw new Error(payload?.error || 'Falha no upload');
                  // ler o conteúdo do txt e anexar ao texto da oferta
                  const resp = await fetch(payload.url as string);
                  const txt = await resp.text();
                  setFormData(prev => ({ ...prev, texto: prev.texto ? `${prev.texto}\n\n${txt}` : txt }));
                  setMsgTxt('Transcrição carregada'); setTimeout(() => setMsgTxt(''), 2500);
                } catch {
                  setMsgTxt('Erro no upload'); setTimeout(() => setMsgTxt(''), 2500);
                } finally {
                  setUploadingTxt(false);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <Button
              type="button"
              onClick={() => (document.getElementById('criar-transc-file') as HTMLInputElement)?.click()}
              disabled={uploadingTxt}
              className="h-9 px-3"
            >
              {uploadingTxt ? 'Enviando...' : 'Enviar .txt'}
            </Button>
            {msgTxt && <span className="text-xs text-success">{msgTxt}</span>}
          </div>
        </div>

        {/* Configurações Rápidas */}
        <div className="space-y-4">
          <div className="text-center mb-4">
            <Target className="w-8 h-8 text-info mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-text-primary">Configurações</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Plataforma
              </label>
              <select
                value={formData.plataforma}
                onChange={(e) => updateField('plataforma', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="facebook_ads">Facebook Ads</option>
                <option value="google_ads">Google Ads</option>
                <option value="instagram_ads">Instagram Ads</option>
                <option value="tiktok_ads">TikTok Ads</option>
                <option value="linkedin_ads">LinkedIn Ads</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Idioma
              </label>
              <select
                value={formData.linguagem}
                onChange={(e) => updateField('linguagem', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="pt_BR">Português (BR)</option>
                <option value="en_US">English (US)</option>
                <option value="es_ES">Español (ES)</option>
                <option value="fr_FR">Français (FR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <div className="text-center mb-4">
            <LinkIcon className="w-8 h-8 text-info mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-text-primary">Links da Oferta</h3>
          </div>

          <div className="space-y-2">
            {formData.links.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={link}
                  onChange={(e) => updateLink(index, e.target.value)}
                  placeholder="https://exemplo.com/oferta"
                  className="flex-1"
                />
                {formData.links.length > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => removeLink(index)}
                    className="px-3 py-2"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={addLink}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Adicionar Link
            </Button>
          </div>
          {errors.links && (
            <p className="text-error text-sm mt-1">{errors.links}</p>
          )}
        </div>

        {/* Campos Opcionais */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              URL do VSL (opcional)
            </label>
            <Input
              value={formData.vsl}
              onChange={(e) => updateField('vsl', e.target.value)}
              placeholder="https://exemplo.com/vsl"
              icon={<Video size={16} />}
            />
            {formData.vsl?.trim() && (
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <video
                  src={formData.vsl}
                  controls
                  className="w-full h-48 bg-black"
                />
              </div>
            )}
            {/* Upload de VSL MP4 */}
            <div className="flex items-center gap-2 mt-2">
              <input type="file" accept="video/mp4" id="criar-vsl-file" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploadingVsl(true); setMsgVsl('');
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('kind', 'vsl');
                    const up = await fetch('/api/upload', { method: 'POST', body: fd, cache: 'no-store' });
                    const payload = await up.json();
                    if (!up.ok) throw new Error(payload?.error || 'Falha no upload');
                    updateField('vsl', payload.url as string);
                    setMsgVsl('VSL enviada'); setTimeout(() => setMsgVsl(''), 2500);
                  } catch {
                    setMsgVsl('Erro no upload'); setTimeout(() => setMsgVsl(''), 2500);
                  } finally {
                    setUploadingVsl(false);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => (document.getElementById('criar-vsl-file') as HTMLInputElement)?.click()}
                disabled={uploadingVsl}
                className="h-9 px-3"
              >
                {uploadingVsl ? 'Enviando...' : 'Enviar MP4'}
              </Button>
              {msgVsl && <span className="text-xs text-success">{msgVsl}</span>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              URL da Imagem (opcional)
            </label>
            <Input
              value={formData.imagem}
              onChange={(e) => updateField('imagem', e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              icon={<Upload size={16} />}
            />
            {formData.imagem?.trim() && (
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                {/* preview da imagem principal */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.imagem}
                  alt="Prévia da imagem"
                  className="w-full h-40 object-cover bg-surface-secondary"
                />
              </div>
            )}
            {/* Upload de imagem principal */}
            <div className="flex items-center gap-2 mt-2">
              <input type="file" accept="image/*" id="criar-img-file" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploadingImagem(true); setMsgImagem('');
                    const fd = new FormData();
                    fd.append('file', file);
                    const up = await fetch('/api/upload', { method: 'POST', body: fd, cache: 'no-store' });
                    const payload = await up.json();
                    if (!up.ok) throw new Error(payload?.error || 'Falha no upload');
                    setFormData(prev => ({
                      ...prev,
                      imagem: payload.url as string,
                      links: prev.links.filter(l => l !== payload.url)
                    }));
                    setMsgImagem('Imagem enviada'); setTimeout(() => setMsgImagem(''), 2500);
                  } catch {
                    setMsgImagem('Erro no upload'); setTimeout(() => setMsgImagem(''), 2500);
                  } finally {
                    setUploadingImagem(false);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => (document.getElementById('criar-img-file') as HTMLInputElement)?.click()}
                disabled={uploadingImagem}
                className="h-9 px-3"
              >
                {uploadingImagem ? 'Enviando...' : 'Enviar Imagem'}
              </Button>
              {msgImagem && <span className="text-xs text-success">{msgImagem}</span>}
            </div>
          </div>

          {/* Upload de criativos para links */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Enviar criativos (adiciona aos Links)
            </label>
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" id="criar-criativos-file" multiple className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  try {
                    setUploadingCriativos(true); setMsgCriativos('');
                    const uploaded: string[] = [];
                    for (const f of files) {
                      const fd = new FormData();
                      fd.append('file', f);
                      const up = await fetch('/api/upload', { method: 'POST', body: fd, cache: 'no-store' });
                      const payload = await up.json();
                      if (!up.ok) throw new Error(payload?.error || 'Falha no upload');
                      uploaded.push(payload.url as string);
                    }
                    setFormData(prev => ({ ...prev, links: [...prev.links.filter(l => l.trim()), ...uploaded] }));
                    setMsgCriativos(`Enviado ${uploaded.length}`); setTimeout(() => setMsgCriativos(''), 2500);
                  } catch {
                    setMsgCriativos('Erro no upload'); setTimeout(() => setMsgCriativos(''), 2500);
                  } finally {
                    setUploadingCriativos(false);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => (document.getElementById('criar-criativos-file') as HTMLInputElement)?.click()}
                disabled={uploadingCriativos}
                className="h-9 px-3"
              >
                {uploadingCriativos ? 'Enviando...' : 'Enviar Imagens'}
              </Button>
              {msgCriativos && <span className="text-xs text-success">{msgCriativos}</span>}
            </div>
            {/* Prévia dos criativos adicionados aos links (imagens) */}
            {formData.links.some(l => /\.(png|jpe?g|webp|gif|svg)$/i.test(l)) && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {formData.links.filter(l => /\.(png|jpe?g|webp|gif|svg)$/i.test(l)).map((url, idx) => (
                  <div
                    key={url + idx}
                    className={`relative overflow-hidden rounded-md border ${formData.imagem === url ? 'border-accent ring-2 ring-accent/30' : 'border-border'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Criativo" className="w-full h-20 object-cover bg-surface-secondary" />
                    <div className="absolute inset-x-0 bottom-0 p-1 bg-surface/80 backdrop-blur">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          imagem: url,
                          links: prev.links.filter(l => l !== url)
                        }))}
                        className="w-full text-xs text-center px-2 py-1 rounded bg-accent text-white hover:bg-accent-hover transition"
                        aria-label="Definir como imagem principal"
                      >
                        {formData.imagem === url ? 'Imagem principal' : 'Usar como principal'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bloco simples: Imagem Principal */}
          <div className="mt-4 rounded-xl border border-border bg-surface">
            <div className="px-4 py-2 border-b border-border font-semibold text-text-primary">Imagem Principal</div>
            <div className="p-4 flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-border bg-surface-secondary flex items-center justify-center">
                {formData.imagem?.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.imagem} alt="Imagem principal" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-text-tertiary text-xs text-center px-2">Sem imagem</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => (document.getElementById('criar-img-file') as HTMLInputElement)?.click()}
                  className="h-9 px-3"
                >
                  Enviar imagem
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => updateField('imagem', '')}
                  disabled={!formData.imagem?.trim()}
                  className="h-9 px-3"
                >
                  Remover
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="primary"
            className="flex items-center gap-2"
          >
            {loading ? (
              <LoadingSpinner size={16} />
            ) : (
              <Save size={16} />
            )}
            Criar Oferta
          </Button>
        </div>
      </div>
    </Modal>
  );
} 