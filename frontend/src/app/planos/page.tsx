"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card3D } from '@/components/ui/Card3D';
import { Button } from '@/components/ui/Button';
import { CreditCard, Check, Sparkles, Zap, Crown, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium PlanosPage v2.0
// Features: Mastery High-Fidelity, Massive Typography, 
// Single-Tone Neon Accents, and Industrial Contrast.
// ─────────────────────────────────────────────────────────────────

type PlanoType = 'mensal' | 'trimestral' | 'anual';

interface Plano {
  id: PlanoType;
  nome: string;
  periodo: string;
  preco: number;
  precoOriginal?: number;
  desconto?: number;
  descricao: string;
  popular?: boolean;
  color: string;
  icon: React.ReactNode;
  beneficios: string[];
}

const planos: Plano[] = [
  {
    id: 'mensal',
    nome: 'Operação Mensal',
    periodo: 'mês',
    preco: 67.00,
    descricao: 'Acesso imediato ao ecossistema de ofertas.',
    color: '#fbbf24', // Gold
    icon: <Calendar className="w-8 h-8" />,
    beneficios: [
      'Acesso completo a todas as ofertas',
      'Filtros de inteligência básica',
      'Suporte via ticket',
      'Sincronização 24h',
    ],
  },
  {
    id: 'trimestral',
    nome: 'Escala Trimestral',
    periodo: 'trimestre',
    preco: 194.00,
    precoOriginal: 291.00,
    desconto: 33,
    descricao: 'O equilíbrio perfeito entre custo e performance.',
    color: '#22d3ee', // Cyan
    icon: <Zap className="w-8 h-8" />,
    beneficios: [
      'Tudo do plano Mensal',
      'Economia de 33%',
      'Prioridade de varredura',
      'Relatórios de mercado',
      'Acesso a API básica',
    ],
  },
  {
    id: 'anual',
    nome: 'Domínio Anual',
    periodo: 'ano',
    preco: 774.00,
    precoOriginal: 1164.00,
    desconto: 34,
    descricao: 'Padrão ouro para quem domina o mercado.',
    popular: true,
    color: '#22c55e', // Emerald
    icon: <Crown className="w-8 h-8" />,
    beneficios: [
      'Tudo do plano Trimestral',
      'Máxima economia (34%)',
      'Suporte VIP 24/7',
      'Consultoria de escala mensal',
      'Acesso antecipado a nichos',
      'API Full sem limites',
    ],
  },
];

export default function PlanosPage() {
  const router = useRouter();
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoType | null>(null);

  const handleSelecionarPlano = (planoId: PlanoType) => {
    setPlanoSelecionado(planoId);
    router.push(`/checkout?plano=${planoId}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] relative py-20 px-6 lg:px-12 overflow-hidden selection:bg-green-500/30">

      {/* Atmosphere Accents */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-green-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Editorial Header */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Infraestrutura Blindada</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter uppercase italic">
              ESCOLHA SEU <br />
              <span className="text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">COMANDO</span>
            </h1>
            <p className="text-xl text-white/30 font-bold max-w-2xl">
              Selecione o nível de acesso necessário para sua operação e comece a escalar hoje mesmo.
            </p>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {planos.map((plano, idx) => (
            <motion.div
              key={plano.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              {plano.popular && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30">
                  <div className="px-6 py-2 bg-green-500 text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                    MAIS SOLICITADO
                  </div>
                </div>
              )}

              <Card3D
                variant="glass"
                has3DRotation
                animatedBorder={plano.popular}
                className={`h-full p-10 flex flex-col justify-between bg-[#0d0d0d] border-white/5 transition-all duration-500 ${plano.popular ? 'ring-2 ring-green-500/20' : ''}`}
                style={{
                  boxShadow: plano.popular ? '0 0 50px rgba(34,197,94,0.05)' : 'none'
                }}
              >
                <div>
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-10 shadow-2xl border border-white/10"
                    style={{ backgroundColor: `${plano.color}15`, color: plano.color }}
                  >
                    {plano.icon}
                  </div>

                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">
                    {plano.nome}
                  </h3>

                  <p className="text-white/30 text-sm font-bold mb-8 leading-relaxed">
                    {plano.descricao}
                  </p>

                  <div className="flex flex-col mb-10">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-white tracking-tighter italic">
                        R$ {plano.preco.toFixed(0)}
                      </span>
                      <span className="text-white/20 font-black uppercase text-xs tracking-widest">
                        / {plano.periodo}
                      </span>
                    </div>
                    {plano.precoOriginal && (
                      <span className="text-white/20 text-xs font-bold line-through mt-2">
                        De R$ {plano.precoOriginal.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-5 mb-12">
                    {plano.beneficios.map((b, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-bold text-white/50">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => handleSelecionarPlano(plano.id)}
                  className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${plano.popular
                      ? 'bg-green-500 text-black hover:bg-white hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                >
                  {planoSelecionado === plano.id ? 'SINALIZADO' : 'ATIVAR ACESSO'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card3D>
            </motion.div>
          ))}
        </div>

        {/* Tactical Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-24 p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center grayscale opacity-50">
              <ShieldCheck size={30} className="text-white" />
            </div>
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">Protocolo de Segurança</h4>
              <p className="text-sm text-white/30 font-bold max-w-xl">
                Transações criptografadas de ponta a ponta. Acesso liberado instantaneamente após validação do gateway.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 opacity-30">VISA</div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 opacity-30">MASTER</div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 opacity-30">PIX</div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
