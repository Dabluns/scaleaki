"use client";

import { AdminGuard } from '@/components/auth/AdminGuard';
import { useState, useEffect, useCallback } from 'react';
import nookies from 'nookies';
import {
  DollarSign,
  TrendingUp,
  UserPlus,
  UserMinus,
  Gem,
  CreditCard,
  Users,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Metrics {
  mrr: number;
  arpu: number;
  ltv: number | null;
  churnRate: number;
  novosMes: number;
  churnMes: number;
  assinaturasAtivas: number;
  usuariosPagantes: number;
  receitaTotal: number;
  receitaMes: number;
  breakdownPlanos: Record<string, number>;
  referencia: { mes: string; agora: string };
}

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function MetricasPage() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const cookies = nookies.get(null);
      const token = cookies['auth_token'] || '';
      const res = await fetch(`${API_URL}/admin/metrics`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setErro(`Erro ${res.status} ao carregar métricas`);
        return;
      }
      setData(await res.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao carregar métricas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const cards = data
    ? [
        { label: 'MRR', sub: 'Receita Recorrente Mensal', value: brl(data.mrr), icon: DollarSign, color: 'text-green-500', border: 'group-hover:border-green-500/40' },
        { label: 'Receita do Mês', sub: 'Pagamentos confirmados', value: brl(data.receitaMes), icon: TrendingUp, color: 'text-green-400', border: 'group-hover:border-green-500/40' },
        { label: 'Receita Total', sub: 'Acumulado histórico', value: brl(data.receitaTotal), icon: CreditCard, color: 'text-cyan-400', border: 'group-hover:border-cyan-500/40' },
        { label: 'Novos no Mês', sub: 'Assinaturas iniciadas', value: String(data.novosMes), icon: UserPlus, color: 'text-green-500', border: 'group-hover:border-green-500/40' },
        { label: 'Churn', sub: `${data.churnMes} cancel. no mês`, value: `${data.churnRate}%`, icon: UserMinus, color: data.churnRate > 0 ? 'text-red-400' : 'text-white', border: 'group-hover:border-red-500/40' },
        { label: 'LTV', sub: 'Valor por cliente', value: data.ltv === null ? '∞' : brl(data.ltv), icon: Gem, color: 'text-purple-400', border: 'group-hover:border-purple-500/40' },
        { label: 'Assinaturas Ativas', sub: `ARPU ${brl(data.arpu)}`, value: String(data.assinaturasAtivas), icon: Activity, color: 'text-yellow-500', border: 'group-hover:border-yellow-500/40' },
        { label: 'Usuários Pagantes', sub: 'Plano ativo', value: String(data.usuariosPagantes), icon: Users, color: 'text-cyan-400', border: 'group-hover:border-cyan-500/40' },
      ]
    : [];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-black relative pb-32">
        {/* Header */}
        <div className="relative pt-16 pb-12 px-8 lg:px-16 max-w-[1800px] mx-auto border-b border-white/5">
          <div className="flex items-end justify-between gap-12 flex-wrap">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Strategic_Nexus // MÉTRICAS</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-[0.8]">
                PAINEL <br />
                <span className="text-green-500">FINANCEIRO</span>
              </h1>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest font-mono">
                MRR · Novos · Churn · LTV {data ? `// ref ${new Date(data.referencia.mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}` : ''}
              </p>
            </div>
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-green-500 hover:text-black transition-all disabled:opacity-40"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 lg:px-16 pt-16">
          {erro && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 font-black text-[11px] uppercase tracking-widest mb-8">
              ❌ {erro}
            </div>
          )}

          {loading && !data && (
            <div className="text-white/30 font-black uppercase tracking-widest text-sm animate-pulse">Carregando métricas...</div>
          )}

          {data && (
            <>
              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <motion.div
                      key={c.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      className={`group p-8 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] transition-all duration-500 ${c.border}`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{c.label}</span>
                        <Icon size={18} className={c.color} />
                      </div>
                      <div className={`text-4xl font-black italic tracking-tighter ${c.color}`}>{c.value}</div>
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-2 block">{c.sub}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Breakdown por plano */}
              <div className="mt-10 p-10 bg-[#0e0e0e] border border-white/5 rounded-[3rem]">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Assinaturas Ativas por Plano</span>
                <div className="grid grid-cols-3 gap-8 mt-8">
                  {([
                    ['Mensal', data.breakdownPlanos.mensal || 0, 'text-green-400'],
                    ['Trimestral', data.breakdownPlanos.trimestral || 0, 'text-cyan-400'],
                    ['Anual', data.breakdownPlanos.anual || 0, 'text-purple-400'],
                  ] as [string, number, string][]).map(([nome, qtd, cor]) => (
                    <div key={nome} className="flex flex-col gap-1 border-l-2 border-white/5 pl-4">
                      <span className={`text-5xl font-black italic ${cor}`}>{qtd}</span>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{nome}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
