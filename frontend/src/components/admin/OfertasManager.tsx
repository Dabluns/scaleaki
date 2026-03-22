"use client";

import { useState, useEffect, useMemo } from 'react';
import { useOfertaContext } from '@/context/OfertaContext';
import { useNichos } from '@/context/NichoContext';
import { Card3D } from '@/components/ui/Card3D';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { Oferta } from '@/types/oferta';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  TrendingUp,
  Image as ImageIcon,
  Link as LinkIcon,
  Globe,
  Layers,
  Activity,
  Search,
  Zap,
  ShieldAlert,
  Target,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium OfertasManager v4.6 (FIXED)
// Design Path: Mastery High-Fidelity / Asset Controller Matrix
// ─────────────────────────────────────────────────────────────────

interface OfertaFormData {
  titulo: string;
  texto: string;
  nichoId: string;
  linguagem: Oferta['linguagem'];
  plataforma: Oferta['plataforma'];
  tipoOferta: Oferta['tipoOferta'];
  status: Oferta['status'];
  links: string[];
  metricas: string;
  vsl: string;
  imagem: string;
}

export function OfertasManager() {
  const { ofertas, loading, fetchOfertas, criarOferta, editarOferta, removerOferta } = useOfertaContext();
  const { nichos } = useNichos();
  const [showModal, setShowModal] = useState(false);
  const [editingOferta, setEditingOferta] = useState<Oferta | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const initialFormData: OfertaFormData = {
    titulo: '',
    texto: '',
    nichoId: '',
    linguagem: 'pt_BR',
    plataforma: 'facebook_ads',
    tipoOferta: 'conversions',
    status: 'ativa',
    links: [''],
    metricas: '',
    vsl: '',
    imagem: ''
  };

  const [formData, setFormData] = useState<OfertaFormData>(initialFormData);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ofertaToDelete, setOfertaToDelete] = useState<Oferta | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchOfertas();
  }, [fetchOfertas]);

  const filtradas = useMemo(() => {
    if (!searchTerm.trim()) return ofertas;
    const term = searchTerm.toLowerCase();
    return ofertas.filter(o => o.titulo.toLowerCase().includes(term) || o.texto.toLowerCase().includes(term));
  }, [ofertas, searchTerm]);

  const handleSave = async () => {
    if (!formData.titulo || !formData.nichoId) {
      toast.showToast('Preencha os campos obrigatórios', 'error');
      return;
    }

    try {
      const links = formData.links.filter(l => l.trim() !== '');

      if (editingOferta) {
        const payload: Oferta = {
          ...editingOferta,
          ...formData,
          links,
          updatedAt: new Date().toISOString()
        };
        await editarOferta(payload);
        toast.showToast('Fluxo_Ativo // Atualizado');
      } else {
        const payload: Omit<Oferta, 'id'> = {
          ...formData,
          links,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await criarOferta(payload);
        toast.showToast('Novo_Asset // Gerado');
      }
      setShowModal(false);
    } catch (error) {
      toast.showToast('Erro Crítico de Gravação', 'error');
    }
  };

  const openModal = (oferta?: Oferta) => {
    if (oferta) {
      setEditingOferta(oferta);
      setFormData({
        titulo: oferta.titulo,
        texto: oferta.texto,
        nichoId: oferta.nichoId,
        linguagem: (oferta.linguagem || 'pt_BR') as Oferta['linguagem'],
        plataforma: (oferta.plataforma || 'facebook_ads') as Oferta['plataforma'],
        tipoOferta: (oferta.tipoOferta || 'conversions') as Oferta['tipoOferta'],
        status: (oferta.status || 'ativa') as Oferta['status'],
        links: Array.isArray(oferta.links) ? (oferta.links.length > 0 ? oferta.links : ['']) : [oferta.links || ''],
        metricas: String(oferta.metricas || ''),
        vsl: oferta.vsl || '',
        imagem: oferta.imagem || ''
      });
    } else {
      setEditingOferta(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  if (loading && ofertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Activity className="w-10 h-10 text-green-500 animate-spin mb-4" />
        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Sincronizando Matriz...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Search & Control Cluster */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-6 lg:p-8 rounded-[2rem]">
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-green-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="PESQUISAR OFERTAS..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-16 pr-8 py-4 text-[11px] font-black text-white placeholder:text-white/10 focus:outline-none focus:border-green-500/50 transition-all uppercase tracking-[0.2em] italic"
          />
        </div>
        <button
          onClick={() => openModal()}
          className="w-full xl:w-auto flex items-center justify-center gap-4 bg-green-500 hover:bg-green-400 text-black px-10 py-4 lg:py-5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          Injuntar Fluxo
        </button>
      </div>

      {/* Assets Matrix Hub */}
      {filtradas.length === 0 ? (
        <div className="h-64 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-4">
          <Layers className="text-white/5 w-10 h-10" />
          <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">Sem Ativos Detectados</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtradas.map((oferta, idx) => (
            <motion.div
              key={oferta.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="h-full"
            >
              <Card3D
                variant="glass"
                className="group relative flex flex-col p-8 bg-[#0a0a0a] border-white/10 rounded-[2.5rem] overflow-hidden hover:border-green-500/30 transition-all duration-700 h-full"
              >
                {/* Asset Header Hub */}
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-1.5 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", oferta.status === 'ativa' ? 'bg-green-500' : 'bg-white/20')} />
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] font-mono">
                        UID // {oferta.id.slice(0, 8)}
                      </span>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-green-500 transition-colors truncate">
                      {oferta.titulo}
                    </h3>
                  </div>
                  <div className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2 flex-shrink-0">
                    <TrendingUp size={12} className="text-green-500" />
                    <span className="text-[9px] font-black text-white italic">{oferta.metricas || '0'} Ads</span>
                  </div>
                </div>

                {/* Stats Strip */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col gap-1">
                    <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Segmento</span>
                    <span className="text-[9px] font-bold text-white/60 uppercase truncate">{nichos.find(n => n.id === oferta.nichoId)?.nome || 'GLOBAL'}</span>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col gap-1">
                    <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Plataforma</span>
                    <span className="text-[9px] font-bold text-white/60 uppercase truncate">{oferta.plataforma.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Tooling Bar - Visible & Clickable Action Area */}
                <div className="mt-auto flex gap-3 pt-6 border-t border-white/5 relative z-20">
                  <button
                    onClick={() => openModal(oferta)}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-white/[0.04] border border-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all duration-500 font-black text-[10px] uppercase tracking-widest"
                  >
                    <Edit size={14} />
                    Configurar
                  </button>
                  <button
                    onClick={() => {
                      setOfertaToDelete(oferta);
                      setShowDeleteModal(true);
                    }}
                    className="w-14 flex items-center justify-center py-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500/40 hover:bg-red-500 hover:text-black transition-all duration-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card3D>
            </motion.div>
          ))}
        </div>
      )}

      {/* Editor Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-8 backdrop-blur-2xl bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-4xl bg-[#080808] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-white/[0.02] to-transparent">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-green-500 uppercase tracking-[0.4em]">Resource_Editor // ASSET</span>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                    {editingOferta ? 'Calibrar' : 'Injuntar'} <span className="text-green-500">Fluxo</span>
                  </h2>
                </div>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all group">
                  <X size={20} className="text-white group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic ml-2 flex items-center gap-2">
                        <Layout size={11} /> TITULAÇÃO_ASSET
                      </label>
                      <input
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-[11px] font-bold text-white outline-none focus:border-green-500/50"
                        value={formData.titulo}
                        onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                        placeholder="Nome da oferta..."
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic ml-2 flex items-center gap-2">
                        <Globe size={11} /> DESCRIÇÃO
                      </label>
                      <textarea
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-[11px] font-bold text-white outline-none focus:border-green-500/50 h-32 resize-none"
                        value={formData.texto}
                        onChange={e => setFormData({ ...formData, texto: e.target.value })}
                        placeholder="Descrição técnica..."
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic ml-2">NICHO</label>
                        <select
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-[11px] font-bold text-white outline-none focus:border-green-500/50 appearance-none"
                          value={formData.nichoId}
                          onChange={e => setFormData({ ...formData, nichoId: e.target.value })}
                        >
                          <option value="" className="bg-black">SELECT</option>
                          {nichos.map(n => <option key={n.id} value={n.id} className="bg-black">{n.nome.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic ml-2">PLATAFORMA</label>
                        <select
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-[11px] font-bold text-white outline-none focus:border-green-500/50 appearance-none"
                          value={formData.plataforma}
                          onChange={e => setFormData({ ...formData, plataforma: e.target.value as any })}
                        >
                          <option value="facebook_ads" className="bg-black">FB ADS</option>
                          <option value="google_ads" className="bg-black">GG ADS</option>
                          <option value="tiktok_ads" className="bg-black">TK ADS</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic ml-2">LANGUAGE</label>
                        <select
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-[11px] font-bold text-white outline-none focus:border-green-500/50 appearance-none"
                          value={formData.linguagem}
                          onChange={e => setFormData({ ...formData, linguagem: e.target.value as any })}
                        >
                          <option value="pt_BR" className="bg-black">PT-BR</option>
                          <option value="en_US" className="bg-black">EN-US</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic ml-2">STATUS</label>
                        <select
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-[11px] font-bold text-white outline-none focus:border-green-500/50 appearance-none"
                          value={formData.status}
                          onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        >
                          <option value="ativa" className="bg-black">ATIVA</option>
                          <option value="pausada" className="bg-black">PAUSADA</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 lg:p-10 border-t border-white/5 bg-gradient-to-tr from-white/[0.02] to-transparent flex gap-4">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-3 bg-green-500 hover:bg-green-400 text-black py-4 lg:py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                >
                  <Save size={18} />
                  VALIDAR_GRAVAÇÃO
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-8 py-4 lg:py-5 rounded-2xl border border-white/10 text-white/20 hover:text-white transition-all font-black text-[12px] uppercase tracking-widest"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="DANGER_ZONE // PURGE"
        description="A purgação deste asset é irreversível e afetará a matriz de ofertas."
        itemName={ofertaToDelete?.titulo || ''}
        onConfirm={async () => {
          setIsDeleting(true);
          if (ofertaToDelete) await removerOferta(ofertaToDelete.id);
          setIsDeleting(false);
          setShowDeleteModal(false);
          setOfertaToDelete(null);
          toast.showToast('Asset_Purged // Banco Sincronizado');
        }}
        onCancel={() => {
          setShowDeleteModal(false);
          setOfertaToDelete(null);
        }}
        isDeleting={isDeleting}
      />

    </div>
  );
}