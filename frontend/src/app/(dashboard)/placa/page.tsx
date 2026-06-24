"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Loader2, Send, Truck, CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-react';
import PlusGate from '@/components/ui/PlusGate';
import { placaApi, PlacaRequest, PlacaStatus, PlusApiError } from '@/lib/plus';

const STATUS_UI: Record<PlacaStatus, { label: string; color: string; icon: any }> = {
  pendente: { label: 'Em análise', color: 'text-amber-400', icon: Clock },
  aprovada: { label: 'Aprovada', color: 'text-emerald-400', icon: CheckCircle2 },
  enviada: { label: 'Enviada', color: 'text-cyan-400', icon: Truck },
  rejeitada: { label: 'Rejeitada', color: 'text-red-400', icon: XCircle },
};

function brl(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function PlacaRow({ p }: { p: PlacaRequest }) {
  const ui = STATUS_UI[p.status];
  const Icon = ui.icon;
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-black text-white">{brl(p.faturamento)}</div>
          <div className="text-[12px] text-white/40">Período: {p.periodo}</div>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] font-bold uppercase ${ui.color}`}>
          <Icon className="w-3.5 h-3.5" /> {ui.label}
        </span>
      </div>
      {p.observacao && <p className="mt-3 text-sm text-white/60">{p.observacao}</p>}
      {p.adminNote && (
        <div className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-[12px] text-white/60">
          <span className="font-bold text-white/80">Nota do time:</span> {p.adminNote}
        </div>
      )}
      {p.trackingUrl && (
        <a href={p.trackingUrl} target="_blank" rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-[12px] text-cyan-400 hover:underline">
          Rastrear envio <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

function PlacaBoard() {
  const [faturamento, setFaturamento] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [comprovante, setComprovante] = useState('');
  const [observacao, setObservacao] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [list, setList] = useState<PlacaRequest[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const loadList = () => {
    placaApi.mine().then((r) => setList(r.data)).catch(() => {}).finally(() => setLoadingList(false));
  };

  useEffect(() => { loadList(); }, []);

  const submit = async () => {
    setError(null);
    setOk(false);
    const fat = Number(faturamento);
    if (!fat || fat <= 0) { setError('Informe um faturamento válido.'); return; }
    if (!periodo.trim()) { setError('Informe o período (ex: 2026-06 ou Q2 2026).'); return; }
    setSubmitting(true);
    try {
      await placaApi.request({
        faturamento: fat,
        periodo: periodo.trim(),
        comprovante: comprovante.trim() || undefined,
        observacao: observacao.trim() || undefined,
      });
      setOk(true);
      setFaturamento(''); setPeriodo(''); setComprovante(''); setObservacao('');
      loadList();
    } catch (e) {
      const err = e as PlusApiError;
      setError(err.message || 'Erro ao enviar solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-white/60">Solicitar placa</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] uppercase text-white/40">Faturamento (R$)</label>
            <input
              type="number" value={faturamento} onChange={(e) => setFaturamento(e.target.value)}
              placeholder="50000"
              className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 px-3 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase text-white/40">Período</label>
            <input
              value={periodo} onChange={(e) => setPeriodo(e.target.value)}
              placeholder="2026-06"
              className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 px-3 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase text-white/40">Comprovante (URL do print/extrato)</label>
          <input
            value={comprovante} onChange={(e) => setComprovante(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 px-3 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase text-white/40">Observação (opcional)</label>
          <textarea
            value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={3}
            placeholder="Algo que o time precise saber..."
            className="w-full resize-y rounded-xl bg-white/5 border border-white/10 py-2.5 px-3 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <button
          onClick={submit} disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-black uppercase text-black transition hover:bg-emerald-400 disabled:opacity-40"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {submitting ? 'Enviando...' : 'Solicitar minha placa'}
        </button>
        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {ok && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Solicitação enviada! O time vai analisar e te dar retorno.</div>}
      </div>

      {/* Lista */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-white/60">Minhas solicitações</h2>
        {loadingList ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-white/30">
            Você ainda não solicitou nenhuma placa.
          </div>
        ) : (
          <div className="space-y-3">{list.map((p) => <PlacaRow key={p.id} p={p} />)}</div>
        )}
      </div>
    </div>
  );
}

export default function PlacaPage() {
  return (
    <div className="relative min-h-screen">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12 pt-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="rounded-full bg-[#a855f7]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#c084fc]">Scaleaki+</span>
          </div>
          <h1 className="flex items-center gap-3 text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter">
            <Award className="w-8 h-8 text-emerald-500" /> Placa de <span className="text-emerald-500">Faturamento</span>
          </h1>
          <p className="mt-2 text-white/50">Bateu um marco de faturamento? Solicite sua placa física do Scaleaki.</p>
        </motion.div>
        <PlusGate upsell="A placa de faturamento é um benefício exclusivo do Scaleaki+.">
          <PlacaBoard />
        </PlusGate>
      </div>
    </div>
  );
}
