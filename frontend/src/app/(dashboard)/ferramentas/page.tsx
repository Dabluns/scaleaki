"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card3D } from '@/components/ui/Card3D';
import {
  Search,
  Image as ImageIcon,
  Lock,
  Zap,
  ArrowRight,
  Wrench,
  Cpu,
  Activity,
  Globe,
  Terminal,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCounter } from '@/hooks/useCounter';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium Toolbox Matrix v5.0
// Design Path: Mastery High-Fidelity / Strategic Command HUD
// ─────────────────────────────────────────────────────────────────

interface Ferramenta {
  slug: string;
  titulo: string;
  descricao: string;
  IconComponent: React.ComponentType<{ className?: string, size?: number }>;
  cor: string;
  gradiente: string;
  id_tecnico: string;
  tags: string[];
}

const ferramentas: Ferramenta[] = [
  {
    slug: 'extrator-html',
    titulo: 'Extrator de HTML',
    id_tecnico: 'PROTOCOL_HTML_X',
    descricao: 'Extraia o código HTML de qualquer site. Suporta extração completa com CSS, JavaScript e imagens.',
    IconComponent: Globe,
    cor: 'green',
    gradiente: 'from-green-500/20 to-emerald-500/20',
    tags: ['Network', 'Scraping', 'Structure']
  },
  {
    slug: 'metadados-imagem',
    titulo: 'Gerenciador EXIF',
    id_tecnico: 'ASSET_META_ALPHA',
    descricao: 'Extraia ou altere metadados EXIF, GPS e informações técnicas de suas imagens para garantir anonimato ou precisão.',
    IconComponent: ImageIcon,
    cor: 'purple',
    gradiente: 'from-purple-500/20 to-pink-500/20',
    tags: ['Asset', 'Privacy', 'GPS']
  },
  {
    slug: 'criptografia-texto',
    titulo: 'Ofuscação de Textos',
    id_tecnico: 'CRYPTO_TEXT_FLOW',
    descricao: 'Ofusque textos para torná-los indecifráveis para algoritmos de rastreamento de redes sociais. Proteção contra shadowban.',
    IconComponent: Lock,
    cor: 'blue',
    gradiente: 'from-blue-500/20 to-indigo-500/20',
    tags: ['Security', 'Algorithm', 'Text']
  },
];

export default function FerramentasPage() {
  const resourceCount = useCounter(ferramentas.length, { duration: 1500 });
  const latencyStub = useCounter(24, { duration: 2000 });

  return (
    <div className="min-h-screen bg-black text-white pb-32 overflow-x-hidden">

      {/* Editorial Technical Header */}
      <div className="relative pt-20 pb-16 px-8 lg:px-20 max-w-[1700px] mx-auto border-b border-white/5">
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
          <Wrench size={500} className="rotate-12" />
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 lg:items-end">
          <div className="lg:col-span-7 space-y-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] italic">System_Resources // OPERATIONAL_HUB</span>
                <span className="text-[10px] text-white/10 italic font-mono hidden sm:inline">Build_4922_Stable</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-7xl lg:text-9xl font-black italic uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
                TOOLBOX <br />
                <span className="text-green-500">MATRIX</span>
              </h1>
              <p className="max-w-xl text-[12px] font-bold text-white/30 uppercase tracking-tight italic leading-relaxed pt-2">
                Conjunto de ferramentas táticas para processamento de ativos, extração de metadados e otimização de fluxos operacionais em escala.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="bg-green-500/10 px-5 py-2 rounded-full flex items-center gap-3 border border-green-500/10">
                <ShieldCheck size={14} className="text-green-500" />
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Acesso de Nível Administrativo Ativo</span>
              </div>
            </div>
          </div>

          {/* HUD Metrics Cluster */}
          <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-8 relative z-10">
            {[
              { label: 'Recursos_Ativos', val: resourceCount.count.toString().padStart(2, '0'), unit: 'Modules', color: 'text-white' },
              { label: 'Cloud_Latency', val: latencyStub.count.toString(), unit: 'ms', color: 'text-cyan-500' },
              { label: 'Security_Layer', val: 'V5', unit: 'AES', color: 'text-green-500' }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-2 p-2 group/stat">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest border-l-2 border-white/5 pl-3 group-hover/stat:border-green-500 transition-colors">{stat.label}</span>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className={clsx("text-5xl font-black italic transition-all duration-700", stat.color)}>{stat.val}</span>
                  <span className="text-[10px] font-black text-white/10 uppercase italic">{stat.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbox Grid Matrix */}
      <div className="max-w-[1700px] mx-auto px-6 lg:px-20 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12">
          {ferramentas.map((ferramenta, index) => (
            <motion.div
              key={ferramenta.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className="h-full"
            >
              <Link href={`/ferramentas/${ferramenta.slug}`} className="group h-full block">
                <Card3D
                  variant="glass"
                  className="p-10 lg:p-12 relative overflow-hidden h-full flex flex-col bg-white/[0.01] border-white/5 hover:border-green-500/20 transition-all duration-1000 group-hover:bg-white/[0.03] rounded-[3rem]"
                >
                  {/* Background HUD Graphics */}
                  <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12">
                    <ferramenta.IconComponent size={250} />
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-12">
                      <div className={clsx(
                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 border border-white/5 group-hover:scale-110",
                        ferramenta.cor === 'green' ? 'bg-green-500/10 text-green-500 group-hover:bg-green-500/20' :
                          ferramenta.cor === 'purple' ? 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20' :
                            'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20'
                      )}>
                        <ferramenta.IconComponent size={32} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em] italic mb-1">Module_ID</span>
                        <span className="text-[12px] font-black text-white/30 uppercase tracking-tighter italic font-mono group-hover:text-green-500 transition-colors">
                          {ferramenta.id_tecnico}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {ferramenta.tags.map(tag => (
                          <span key={tag} className="text-[8px] font-black text-white/20 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-3xl lg:text-4xl font-black text-white italic uppercase tracking-tighter leading-none group-hover:text-green-500 transition-colors">
                        {ferramenta.titulo}
                      </h2>
                      <p className="text-[11px] font-bold text-white/20 uppercase tracking-tight italic leading-relaxed group-hover:text-white/40 transition-colors line-clamp-4">
                        {ferramenta.descricao}
                      </p>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Acesso_Liberado</span>
                      </div>
                      <div className="flex items-center gap-2 group-hover:gap-4 transition-all text-green-500/40 group-hover:text-green-500">
                        <span className="text-[10px] font-black uppercase tracking-widest">Acessar</span>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </Card3D>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
