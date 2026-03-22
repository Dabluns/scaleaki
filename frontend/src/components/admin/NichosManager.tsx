"use client";

import { useState, useMemo } from 'react';
import { useNichos } from '@/context/NichoContext';
import { useToast } from '@/components/ui/Toast';
import * as LucideIcons from 'lucide-react';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Layers,
  Activity,
  Terminal,
  Search,
  Settings,
  ShieldCheck,
  ChevronRight,
  Database,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card3D } from '@/components/ui/Card3D';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium NichosManager v4.6 (FIXED)
// Design Path: Mastery High-Fidelity / Market Taxonomy Hub
// ─────────────────────────────────────────────────────────────────

interface NichoFormData {
  nome: string;
  slug: string;
  icone: string;
  descricao: string;
  cor: string;
  isActive: boolean;
}

const ALL_LUCIDE_ICON_NAMES: string[] = Object.keys(LucideIcons)
  .filter((k) => /^[A-Z][A-Za-z0-9]*$/.test(k))
  .filter((k) => k !== 'createLucideIcon' && k !== 'Icon' && k !== 'default');

export function NichosManager() {
  const { nichos, loading, addNicho, editNicho, removeNicho } = useNichos();
  const [showModal, setShowModal] = useState(false);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [editingNicho, setEditingNicho] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<NichoFormData>({
    nome: '', slug: '', icone: 'Layers', descricao: '', cor: '#22c55e', isActive: true
  });
  const [iconSearch, setIconSearch] = useState('');
  const toast = useToast();

  const generateSlug = (nome: string) => {
    return nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const filtrados = useMemo(() => {
    if (!searchTerm.trim()) return nichos;
    return nichos.filter(n => n.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [nichos, searchTerm]);

  const openModal = (nicho?: any) => {
    if (nicho) {
      setEditingNicho(nicho);
      setFormData({
        nome: nicho.nome,
        slug: nicho.slug,
        icone: nicho.icone || 'Layers',
        descricao: nicho.descricao || '',
        cor: nicho.cor || '#22c55e',
        isActive: nicho.isActive ?? true
      });
    } else {
      setEditingNicho(null);
      setFormData({ nome: '', slug: '', icone: 'Layers', descricao: '', cor: '#22c55e', isActive: true });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.nome) {
      toast.showToast('Identificador de Nome Requerido', 'error');
      return;
    }
    try {
      if (editingNicho) {
        await editNicho({ ...editingNicho, ...formData });
        toast.showToast('Matriz de Mercado Calibrada');
      } else {
        await addNicho({
          ...formData,
          isActive: true,
          cor: formData.cor || '#22c55e'
        });
        toast.showToast('Novo Nó de Mercado Indexado');
      }
      setShowModal(false);
    } catch {
      toast.showToast('Erro no Protocolo de Gravação', 'error');
    }
  };

  if (loading && nichos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Activity className="w-12 h-12 text-green-500 animate-spin mb-4" />
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Sincronizando Nodes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Control & Search Bar - Fixed Padding */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white/[0.02] border border-white/5 p-6 lg:p-8 rounded-[2rem]">
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-green-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="FILTRAR TAXONOMIA DE MERCADO..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-16 pr-8 py-4 text-[11px] font-black text-white placeholder:text-white/10 focus:outline-none focus:border-green-500/50 transition-all uppercase tracking-[0.2em] italic"
          />
        </div>
        <button
          onClick={() => openModal()}
          className="w-full xl:w-auto flex items-center justify-center gap-4 bg-green-500 hover:bg-green-400 text-black px-10 py-4 lg:py-5 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-[0_20px_40px_rgba(34,197,94,0.15)] transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          Indexar Segmento
        </button>
      </div>

      {/* Market Matrix Grid - Optimized Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtrados.map((nicho, idx) => {
          const Icon = (LucideIcons as any)[nicho.icone] || Layers;
          return (
            <motion.div
              key={nicho.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card3D
                variant="glass"
                className="group relative p-8 bg-[#0a0a0a] border-white/10 rounded-[2rem] overflow-hidden hover:border-green-500/30 transition-all duration-700 h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-green-500 group-hover:scale-110 group-hover:bg-green-500/10 transition-all duration-700">
                    <Icon size={28} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(nicho)}
                      className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Expurgar segmento ${nicho.nome}?`)) {
                          await removeNicho(nicho.id);
                          toast.showToast('Nó de Mercado Purpado');
                        }
                      }}
                      className="w-9 h-9 rounded-lg bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/30 hover:text-red-500 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter line-clamp-1 group-hover:text-green-500 transition-colors">
                      {nicho.nome}
                    </h3>
                    <span className="text-[8px] font-mono text-white/10 uppercase tracking-[0.2em]">{nicho.slug}</span>
                  </div>

                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-tight italic leading-relaxed line-clamp-3">
                    {nicho.descricao || 'Nenhuma descrição técnica indexada para este nó.'}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={10} className="text-green-500/40" />
                    <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">Active_Node</span>
                  </div>
                  <ChevronRight size={12} className="text-white/10 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card3D>
            </motion.div>
          );
        })}
      </div>

      {/* Editor Modal - Bulletproof Padding */}
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
              className="w-full max-w-2xl bg-[#080808] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-white/[0.02] to-transparent">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-green-500 uppercase tracking-[0.4em]">Resource_Editor // TAXONOMY</span>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                    {editingNicho ? 'Calibrar' : 'Indexar'} <span className="text-green-500">Segmento</span>
                  </h2>
                </div>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all group">
                  <X size={20} className="text-white group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="p-8 lg:p-10 space-y-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic ml-2 flex items-center gap-2">
                      <Layout size={11} /> NOME_IDENTIFICADOR
                    </label>
                    <input
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-[11px] font-bold text-white focus:border-green-500/50 transition-all outline-none"
                      value={formData.nome}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({ ...formData, nome: val, slug: generateSlug(val) });
                      }}
                      placeholder="EX: SAUDE_E_FITNESS"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic ml-2 flex items-center gap-2">
                      <Database size={11} /> SLUG_SYSTEM_ID
                    </label>
                    <input
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-6 py-4 text-[11px] font-mono text-white/20 outline-none cursor-not-allowed"
                      value={formData.slug}
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-3 relative">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic ml-2">VETOR_VISUAL</label>
                  <button
                    onClick={() => setShowIconSelector(!showIconSelector)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 flex items-center justify-between hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {(() => { const Icon = (LucideIcons as any)[formData.icone] || Layers; return <Icon size={18} className="text-green-500" />; })()}
                      <span className="font-black italic uppercase tracking-widest text-[10px] text-white">{formData.icone}</span>
                    </div>
                    <Settings size={16} className="text-white/20" />
                  </button>

                  {showIconSelector && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d0d] border border-white/10 rounded-[1.5rem] p-4 z-50 shadow-2xl overflow-hidden">
                      <input
                        value={iconSearch}
                        onChange={e => setIconSearch(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 mb-4 text-[10px] text-white/50 outline-none focus:border-green-500/50 uppercase"
                        placeholder="FILTRAR_VETORES..."
                      />
                      <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                        {ALL_LUCIDE_ICON_NAMES.filter(n => n.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 60).map(name => {
                          const Icon = (LucideIcons as any)[name];
                          return (
                            <button
                              key={name}
                              onClick={() => { setFormData({ ...formData, icone: name }); setShowIconSelector(false); }}
                              className="p-3 bg-white/[0.03] rounded-lg hover:bg-green-500 hover:text-black transition-all flex flex-col items-center"
                            >
                              <Icon size={16} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic ml-2">DESCRIÇÃO_TÉCNICA</label>
                  <textarea
                    value={formData.descricao}
                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-[11px] font-bold text-white focus:border-green-500/50 transition-all outline-none h-24 resize-none"
                    placeholder="Metadados do nicho..."
                  />
                </div>
              </div>

              <div className="p-8 lg:p-10 border-t border-white/5 bg-gradient-to-tr from-white/[0.02] to-transparent flex gap-4">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-3 bg-green-500 hover:bg-green-400 text-black py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  <Save size={16} />
                  SALVAR_NÓ
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-8 py-4 rounded-2xl border border-white/10 text-white/20 hover:text-white transition-all font-black text-[12px] uppercase tracking-widest"
                >
                  DESCARTAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}