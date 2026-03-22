"use client";
import { useParams, useRouter } from 'next/navigation';
import { useNichos } from '@/context/NichoContext';
import { useOfertaContext } from '@/context/OfertaContext';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useMemo, useCallback } from 'react';
import { OfertaEditModal } from '@/components/features/ofertas/OfertaEditModal';
import { Search, Filter, Calendar, TrendingUp, Edit3, Target, ArrowDownRight, Globe, Layers, Zap, Activity, Clock, Trash2, CheckSquare, Square, XCircle, AlertTriangle } from 'lucide-react';
import { Oferta } from '@/types/oferta';
import { Card3D } from '@/components/ui/Card3D';
import { useCounter } from '@/hooks/useCounter';
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration';
import { OfertaCard } from '@/components/features/ofertas/OfertaCard';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · NicheOffersPage v3.0
// Features: Mastery High-Fidelity, Industrial Technical HUB,
// Editorial Typography, Tactical Search & Meta-Data.
// ─────────────────────────────────────────────────────────────────

export default function OfertasPorNichoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.nicho === 'string' ? params.nicho : Array.isArray(params.nicho) ? params.nicho[0] : '';
  const { nichos } = useNichos();
  const { ofertas, editarOferta, removerOferta } = useOfertaContext();
  const { isAdmin } = useAuth();

  const nicho = Array.isArray(nichos) ? nichos.find(n => n.slug === slug) : undefined;
  const ofertasValidas = Array.isArray(ofertas) ? ofertas : [];

  // Estados
  const [busca, setBusca] = useState('');
  const [linguagem, setLinguagem] = useState('');
  const [ordenarPor, setOrdenarPor] = useState<'performance' | 'data'>('performance');
  const [selectedOferta, setSelectedOferta] = useState<Oferta | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Bulk select states (admin only)
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Extrair linguagens disponíveis
  const linguagensDisponiveis = useMemo(() => {
    const set = new Set<string>();
    ofertasValidas.forEach(o => { if (o.nichoId === nicho?.id) set.add(o.linguagem); });
    return Array.from(set);
  }, [ofertasValidas, nicho]);

  // Filtro e ordenação
  const ofertasFiltradas = useMemo(() => {
    let filtradas = ofertasValidas.filter(o => o.nichoId === nicho?.id);
    if (linguagem) filtradas = filtradas.filter(o => o.linguagem === linguagem);
    if (busca) {
      const termo = busca.toLowerCase();
      filtradas = filtradas.filter(o =>
        o.titulo.toLowerCase().includes(termo) ||
        o.texto.toLowerCase().includes(termo)
      );
    }
    if (ordenarPor === 'performance') {
      filtradas = filtradas.slice().sort((a, b) => (Number(b.metricas) || 0) - (Number(a.metricas) || 0));
    } else {
      filtradas = filtradas.slice().sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    }
    return filtradas;
  }, [ofertasValidas, nicho, linguagem, busca, ordenarPor]);

  const handleViewOferta = (oferta: Oferta) => {
    if (slug) {
      router.push(`/oferta/${slug}/${oferta.id}`);
    }
  };

  const handleEditOferta = (oferta: Oferta) => {
    setSelectedOferta(oferta);
    setIsEditModalOpen(true);
  };

  const handleDeleteOferta = async (ofertaId: string) => {
    await removerOferta(ofertaId);
  };

  // Bulk selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(ofertasFiltradas.map(o => o.id)));
  }, [ofertasFiltradas]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
  }, []);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      let successCount = 0;

      for (const id of ids) {
        try {
          const res = await fetch('/api/ofertas', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
            credentials: 'include',
          });
          if (res.ok) successCount++;
          // Pequena pausa entre deletes para não sobrecarregar
          await new Promise(r => setTimeout(r, 100));
        } catch {
          // Continua para o próximo mesmo se um falhar
        }
      }

      setSelectedIds(new Set());
      setShowBulkConfirm(false);
      setSelectionMode(false);

      // Recarregar a página para refletir as exclusões
      window.location.reload();
    } catch (err) {
      console.error('Bulk delete error:', err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSaveOferta = async (oferta: Oferta) => {
    await editarOferta(oferta);
    setIsEditModalOpen(false);
    setSelectedOferta(null);
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    setSelectedOferta(null);
  };

  const getNichoName = (nichoId: string) => {
    if (nicho?.id === nichoId) return nicho.nome;
    const foundNicho = Array.isArray(nichos) ? nichos.find(n => n.id === nichoId) : undefined;
    return foundNicho?.nome || 'Nicho';
  };

  // Estatísticas para contadores animados
  const totalOfertas = ofertasFiltradas.length;
  const ofertasAtivas = ofertasFiltradas.filter(o => o.status === 'ativa').length;
  const linguagensUnicas = new Set(ofertasFiltradas.map(o => o.linguagem)).size;

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const totalCount = useCounter(totalOfertas, { duration: 1500, startOnMount: true });
  const ativasCount = useCounter(ofertasAtivas, { duration: 1500, startOnMount: true });
  const linguagensCount = useCounter(linguagensUnicas, { duration: 1500, startOnMount: true });

  return (
    <div className="min-h-screen bg-black relative">

      {/* Editorial Header Hub */}
      <div className="relative pt-16 pb-12 px-8 lg:px-16 max-w-[1800px] mx-auto border-b border-white/5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Node // {slug.toUpperCase()}</span>
                <span className="text-[10px] text-white/10 italic">Global_Scan_Active</span>
              </div>
            </div>

            <h1 className="text-7xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
              OFERTAS: <span className="text-green-500">{nicho?.nome || slug}</span>
            </h1>

            <div className="flex items-center gap-6">
              {isAdmin && (
                <div className="bg-green-500 text-black px-4 py-1.5 rounded-full flex items-center gap-2">
                  <Edit3 size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Admin_Control_HUB</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-white/20" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">Última Varredura: {mounted ? new Date().toLocaleTimeString() : '--:--:--'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {[
              { value: 'performance' as const, label: 'Performance', icon: Activity, color: 'text-green-500' },
              { value: 'data' as const, label: 'Data', icon: Clock, color: 'text-cyan-500' },
            ].map((option) => {
              const Icon = option.icon;
              const isSelected = ordenarPor === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setOrdenarPor(option.value)}
                  className={clsx(
                    "flex flex-col items-center gap-2 p-5 rounded-3xl border transition-all duration-500 min-w-[120px]",
                    isSelected
                      ? "bg-white/[0.03] border-green-500/30 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                      : "bg-transparent border-white/5 text-white/20 hover:bg-white/[0.01]"
                  )}
                >
                  <Icon size={18} className={isSelected ? option.color : 'text-current'} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Industrial HUD Metrics Bar */}
      <div className="max-w-[1800px] mx-auto px-8 lg:px-16 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="bg-[#080808] p-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Layers size={12} className="text-green-500/50" />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Capacidade_Ativos</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white italic">{totalCount.count.toString().padStart(2, '0')}</span>
              <span className="text-[10px] font-black text-white/10 uppercase tracking-tighter italic">OFERTAS INDEXADAS</span>
            </div>
          </div>
          <div className="bg-[#080808] p-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-yellow-500/50" />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Status_Atividade</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-green-500 italic">{ativasCount.count.toString().padStart(2, '0')}</span>
              <span className="text-[10px] font-black text-white/10 uppercase tracking-tighter italic">FLUXOS ATIVOS</span>
            </div>
          </div>
          <div className="bg-[#080808] p-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Globe size={12} className="text-cyan-500/50" />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Escopo_Linguagem</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-cyan-500 italic">{linguagensCount.count.toString().padStart(2, '0')}</span>
              <span className="text-[10px] font-black text-white/10 uppercase tracking-tighter italic">DIALETOS DISPONÍVEIS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Filter Hub */}
      <div className="max-w-[1800px] mx-auto px-8 lg:px-16 pb-12">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Search Input */}
          <div className="relative group flex-1">
            <div className="absolute -inset-2 bg-green-500/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-green-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="FILTRAR MATRIZ DE OFERTAS..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-16 pr-8 py-6 bg-white/[0.02] border border-white/10 rounded-[2rem] text-[12px] font-black text-white placeholder:text-white/10 outline-none focus:border-green-500/50 transition-all uppercase tracking-[0.2em] italic"
            />
          </div>

          {/* Language Selector */}
          <div className="relative group min-w-[300px]">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-cyan-500 transition-colors pointer-events-none" size={18} />
            <select
              value={linguagem}
              onChange={e => setLinguagem(e.target.value)}
              className="w-full pl-16 pr-12 py-6 bg-white/[0.02] border border-white/10 rounded-[2rem] text-[12px] font-black text-white outline-none focus:border-cyan-500/50 transition-all uppercase tracking-[0.2em] italic appearance-none cursor-pointer"
            >
              <option value="" className="bg-black">TODAS AS LINGUAGENS</option>
              {linguagensDisponiveis.map(l => (
                <option key={l} value={l} className="bg-black">
                  {l === 'pt-BR' ? 'PORTUGUÊS (BR)' : l.toUpperCase()}
                </option>
              ))}
            </select>
            <ArrowDownRight className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10" size={18} />
          </div>
        </div>
      </div>

      {/* Admin Bulk Actions Bar */}
      {isAdmin && ofertasFiltradas.length > 0 && (
        <div className="max-w-[1800px] mx-auto px-8 lg:px-16 pb-6">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
              className={clsx(
                'flex items-center gap-3 px-6 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300',
                selectionMode
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
              )}
            >
              {selectionMode ? <XCircle size={16} /> : <CheckSquare size={16} />}
              {selectionMode ? 'CANCELAR SELEÇÃO' : 'SELECIONAR OFERTAS'}
            </motion.button>

            {selectionMode && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={selectedIds.size === ofertasFiltradas.length ? deselectAll : selectAll}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] font-black uppercase tracking-[0.15em] text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
                >
                  {selectedIds.size === ofertasFiltradas.length ? <Square size={14} /> : <CheckSquare size={14} />}
                  {selectedIds.size === ofertasFiltradas.length ? 'DESMARCAR TODAS' : 'SELECIONAR TODAS'}
                </motion.button>

                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                  {selectedIds.size} de {ofertasFiltradas.length} selecionadas
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Offers Matrix Rendering */}
      <div className="max-w-[1800px] mx-auto px-8 lg:px-16 pb-32">
        {ofertasFiltradas.length === 0 ? (
          <div className="relative min-h-[50vh] rounded-[3rem] bg-white/[0.01] border border-white/[0.04] flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.5) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />
            <EmptyStateIllustration
              illustration="searching"
              title="Sinal de Oferta não Detectado"
              message="A varredura tática não encontrou ativos com os parâmetros atuais. Ajuste os filtros ou aguarde novos sinais do mercado."
              cta="REINICIAR VARREDURA"
              onCtaClick={() => { setBusca(''); setLinguagem(''); }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            {ofertasFiltradas.map((oferta, idx) => (
              <motion.div
                key={oferta.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="relative"
              >
                {/* Selection Checkbox Overlay */}
                {selectionMode && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => { e.stopPropagation(); toggleSelection(oferta.id); }}
                    className={clsx(
                      'absolute top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border-2 backdrop-blur-md',
                      selectedIds.has(oferta.id)
                        ? 'bg-green-500 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                        : 'bg-black/60 border-white/20 hover:border-white/40'
                    )}
                  >
                    {selectedIds.has(oferta.id) ? (
                      <CheckSquare size={18} className="text-white" />
                    ) : (
                      <Square size={18} className="text-white/40" />
                    )}
                  </motion.button>
                )}

                {/* Selection Ring */}
                <div className={clsx(
                  'rounded-[2rem] transition-all duration-300',
                  selectionMode && selectedIds.has(oferta.id) && 'ring-2 ring-green-500/50 ring-offset-2 ring-offset-black'
                )}>
                  <OfertaCard
                    oferta={oferta}
                    onView={selectionMode ? () => toggleSelection(oferta.id) : handleViewOferta}
                    getNichoName={getNichoName}
                    isAdmin={isAdmin && !selectionMode}
                    onDelete={isAdmin && !selectionMode ? handleDeleteOferta : undefined}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bulk Delete Bar */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-6 px-8 py-4 rounded-[2rem] bg-[#0d0d0d]/95 border border-red-500/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(239,68,68,0.15)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Trash2 size={18} className="text-red-400" />
                </div>
                <div>
                  <div className="text-white font-black text-sm">{selectedIds.size} oferta{selectedIds.size > 1 ? 's' : ''}</div>
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Selecionada{selectedIds.size > 1 ? 's' : ''} para exclusão</div>
                </div>
              </div>

              <div className="w-px h-10 bg-white/10" />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBulkConfirm(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              >
                <Trash2 size={14} />
                EXCLUIR SELECIONADAS
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exitSelectionMode}
                className="p-2 rounded-lg text-white/30 hover:text-white/60 transition-colors"
              >
                <XCircle size={20} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {showBulkConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => !isBulkDeleting && setShowBulkConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-8 rounded-[2rem] bg-[#111] border border-red-500/20 shadow-[0_30px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(239,68,68,0.1)]"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Confirmar Exclusão</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Ação irreversível</p>
                </div>
              </div>

              <p className="text-sm text-white/50 mb-8 leading-relaxed">
                Você está prestes a excluir <span className="text-red-400 font-black">{selectedIds.size} oferta{selectedIds.size > 1 ? 's' : ''}</span> permanentemente. Esta ação não pode ser desfeita.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkConfirm(false)}
                  disabled={isBulkDeleting}
                  className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-white/50 font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex-1 py-4 rounded-xl bg-red-500 text-white font-black text-[11px] uppercase tracking-widest hover:bg-red-400 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isBulkDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      EXCLUINDO...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      EXCLUIR {selectedIds.size}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Edição */}
      <AnimatePresence>
        {isEditModalOpen && selectedOferta && (
          <OfertaEditModal
            oferta={selectedOferta}
            nicho={nicho}
            onClose={closeModal}
            onSave={handleSaveOferta}
            onDelete={handleDeleteOferta}
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
         .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}