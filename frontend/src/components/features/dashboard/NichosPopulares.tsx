"use client";

import { useState, useEffect } from 'react';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ArrowRight, Zap, Globe, Eye } from 'lucide-react';
import Link from 'next/link';
import { useCounter } from '@/hooks/useCounter';
import { Card3D } from '@/components/ui/Card3D';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium NichosPopulares v2.1 (Hotfix)
// Fixes: Typography scaling and layout safety.
// ─────────────────────────────────────────────────────────────────

interface NichoPopular {
  nicho: {
    id: string;
    nome: string;
    slug: string;
    icone: string;
    descricao?: string;
  };
  ofertasCount: number;
  visualizacoes: number;
  trending: boolean;
}

function NichoCard({ nicho: item, position }: { nicho: NichoPopular; position: number }) {
  const visualizacoesCount = useCounter(item.visualizacoes, { duration: 1500 });

  return (
    <Link href={`/oferta/${item.nicho.slug}`} className="block group h-full">
      <Card3D
        variant="glass"
        has3DRotation
        className="p-6 md:p-8 border-white/5 bg-white/[0.02] flex flex-col justify-between h-full relative overflow-hidden"
      >
        <div className="absolute -bottom-4 -right-4 text-7xl opacity-[0.03] group-hover:opacity-[0.07] transition-opacity grayscale pointer-events-none">
          {item.nicho.icone}
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform flex-shrink-0">
              {item.nicho.icone}
            </div>
            <div className="px-2.5 py-1 bg-green-500/20 rounded-full border border-green-500/30 text-[9px] font-black text-green-500 uppercase tracking-widest whitespace-nowrap">
              #{position} TREND
            </div>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-tighter group-hover:text-green-400 transition-colors truncate">
            {item.nicho.nome}
          </h3>
          <p className="text-xs text-white/40 line-clamp-2 font-medium mb-6">
            {item.nicho.descricao || 'Nicho de alta performance com métricas otimizadas para escala global.'}
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1 truncate">Ofertas</div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Globe className="w-3 h-3 text-green-500/60 flex-shrink-0" />
              <span className="text-base font-black text-white truncate">{item.ofertasCount}</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1 truncate">Volume</div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Eye className="w-3 h-3 text-cyan-500/60 flex-shrink-0" />
              <span className="text-base font-black text-white truncate">{visualizacoesCount.count.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </Card3D>
    </Link>
  );
}

export function NichosPopulares() {
  const [nichosPopulares, setNichosPopulares] = useState<NichoPopular[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNichosPopulares = async () => {
      try {
        const res = await fetch('/api/nichos/populares?limit=3', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setNichosPopulares(data.data);
        }
      } catch (err) { console.error('Error fetching trending nichos:', err); }
      finally { setLoading(false); }
    };
    fetchNichosPopulares();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500/60">Sinais de Demanda</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tighter uppercase whitespace-normal">
            NICHOS <span className="text-green-500">QUENTES</span>
          </h2>
        </div>

        <Link
          href="/nichos"
          className="group flex items-center gap-3 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all flex-shrink-0"
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white">Ver Mercados</span>
          <ArrowRight className="w-4 h-4 text-green-500 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nichosPopulares.map((item, index) => (
          <NichoCard key={item.nicho.id} nicho={item} position={index + 1} />
        ))}
      </div>
    </div>
  );
}
