"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOfertaContext } from '@/context/OfertaContext';
import { useNichos } from '@/context/NichoContext';
import { useAuth } from '@/context/AuthContext';
import { OfertasList } from '@/components/features/ofertas/OfertasList';
import { OfertaEditModal } from '@/components/features/ofertas/OfertaEditModal';
import { Card3D } from '@/components/ui/Card3D';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration';
import { useCounter } from '@/hooks/useCounter';
import { Heart, Search, Filter, Calendar, TrendingUp, Target, Globe, ArrowUpDown, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { Oferta } from '@/types/oferta';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium FavoritosPage v2.0
// Features: Mastery Editorial, Red Neon Accents (Focus), 
// High-Fidelity Tactical Dashboard, and Massive Typography.
// ─────────────────────────────────────────────────────────────────

export default function FavoritosPage() {
  const router = useRouter();
  const { ofertas, loading, editarOferta, removerOferta } = useOfertaContext();
  const { nichos } = useNichos();
  const { user } = useAuth();

  const [favoritos, setFavoritos] = useState<Oferta[]>([]);
  const [selectedOferta, setSelectedOferta] = useState<Oferta | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'performance' | 'date' | 'roi' | 'ctr'>('performance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id) {
      const storedFavoritos = localStorage.getItem(`favoritos_${user.id}`);
      if (storedFavoritos) {
        try {
          const favoritosIds = JSON.parse(storedFavoritos);
          setFavoritos(ofertas.filter(o => favoritosIds.includes(o.id)));
        } catch (e) { }
      }
    }
  }, [ofertas, user?.id]);

  const favoritosFiltrados = favoritos
    .filter(o => !searchTerm || o.titulo?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let aV = (a as any)[sortBy] || 0;
      let bV = (b as any)[sortBy] || 0;
      return sortOrder === 'asc' ? aV - bV : bV - aV;
    });

  const totalCount = useCounter(favoritosFiltrados.length, { duration: 1500 });

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="relative pt-10 pb-20">

      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 px-8 lg:px-12 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-500/60">Cofre de Inteligência Pessoal</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
            O SEU <span className="text-pink-500">ACERVO</span>
          </h1>
          <div className="mt-8 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-4xl font-black text-white italic leading-none">{totalCount.count}</span>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Sinais Salvos</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-4xl font-black text-pink-500 italic leading-none">Elite</span>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">Nível de Filtro</span>
            </div>
          </div>
        </div>

        {/* Tactical Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-pink-500/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <input
              type="text"
              placeholder="BUSCAR NO ACERVO..."
              className="relative px-12 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black text-white tracking-widest uppercase focus:outline-none focus:border-pink-500/30 w-full md:w-64"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={16} className="absolute left-4 top-4.5 text-white/20 group-focus-within:text-pink-500 transition-colors" />
          </div>
        </div>
      </div>

      <div className="px-8 lg:px-12">
        {favoritosFiltrados.length > 0 ? (
          <OfertasList
            ofertas={favoritosFiltrados}
            onViewOferta={(o) => router.push(`/oferta/${o.nichoId}/${o.id}`)}
            onEditOferta={user?.role === 'admin' ? (o) => { setSelectedOferta(o); setIsEditModalOpen(true); } : undefined}
            onDeleteOferta={user?.role === 'admin' ? (id) => removerOferta(id) : undefined}
            getNichoName={(id) => nichos.find(n => n.id === id)?.nome || 'Nicho'}
          />
        ) : (
          <div className="h-[50vh] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] grayscale opacity-40">
            <Heart size={60} className="text-white/10 mb-8" />
            <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-8">Nenhum sinal salvo no acervo.</p>
            <Button
              onClick={() => router.push('/ofertas')}
              className="bg-white text-black font-black text-[10px] uppercase tracking-widest px-8"
            >
              Explorar Rede
            </Button>
          </div>
        )}
      </div>

      {selectedOferta && isEditModalOpen && user?.role === 'admin' && (
        <OfertaEditModal
          oferta={selectedOferta}
          nicho={nichos.find(n => n.id === selectedOferta.nichoId)}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (o) => { await editarOferta(o); setIsEditModalOpen(false); }}
          onDelete={async (id) => { await removerOferta(id); setIsEditModalOpen(false); }}
        />
      )}
    </div>
  );
}