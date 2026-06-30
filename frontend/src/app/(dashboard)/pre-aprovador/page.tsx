"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Loader2, CheckCircle2, AlertTriangle, XCircle, Wand2, ListChecks, Ban,
  Sparkles, Copy, Check,
} from 'lucide-react';
import FeatureGate from '@/components/ui/FeatureGate';
import { preaprovadorApi, PreaproveResult, RewriteResult, Veredito, PlusApiError } from '@/lib/plus';

const VEREDITO_UI: Record<Veredito, { label: string; color: string; bg: string; icon: any }> = {
  aprovado: { label: 'Aprovado', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
  risco: { label: 'Em risco', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: AlertTriangle },
  reprovado: { label: 'Reprovado', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: XCircle },
};

function ResultPanel({ r, onFix, fixing }: { r: PreaproveResult; onFix: () => void; fixing: boolean }) {
  const ui = VEREDITO_UI[r.veredito];
  const Icon = ui.icon;
  const precisaCorrigir = r.veredito === 'risco' || r.veredito === 'reprovado';
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className={`flex items-center gap-4 rounded-2xl border p-5 ${ui.bg}`}>
        <Icon className={`w-10 h-10 ${ui.color}`} />
        <div>
          <div className={`text-xl font-black uppercase ${ui.color}`}>{ui.label}</div>
          <div className="text-sm text-white/50">Score de conformidade: <span className="font-bold text-white/80">{r.score}/100</span></div>
        </div>
        <div className="ml-auto h-14 w-14 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3"
              strokeDasharray={`${(r.score / 100) * 94.2} 94.2`} className={ui.color} strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {r.motivos?.length > 0 && (
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
            <ListChecks className="w-4 h-4 text-emerald-500" /> Motivos
          </div>
          <ul className="space-y-1 text-sm text-white/80">
            {r.motivos.map((m, i) => <li key={i} className="flex gap-2"><span className="text-white/30">•</span>{m}</li>)}
          </ul>
        </div>
      )}

      {r.termosProblema?.length > 0 && (
        <div className="rounded-xl bg-red-500/[0.06] border border-red-500/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-red-400">
            <Ban className="w-4 h-4" /> Termos problemáticos
          </div>
          <div className="flex flex-wrap gap-1.5">
            {r.termosProblema.map((t, i) => (
              <span key={i} className="rounded-md bg-red-500/15 px-2 py-0.5 text-[12px] text-red-300">{t}</span>
            ))}
          </div>
        </div>
      )}

      {r.ajustes?.length > 0 && (
        <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            <Wand2 className="w-4 h-4" /> Ajustes sugeridos
          </div>
          <ul className="space-y-1 text-sm text-white/80">
            {r.ajustes.map((a, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500">→</span>{a}</li>)}
          </ul>
        </div>
      )}

      {precisaCorrigir && (
        <button
          onClick={onFix}
          disabled={fixing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#7c3aed] py-3 text-sm font-black uppercase text-white transition hover:brightness-110 disabled:opacity-40"
        >
          {fixing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {fixing ? 'Reescrevendo...' : 'Corrigir agora — reescrever forte e dentro da política'}
        </button>
      )}
    </motion.div>
  );
}

function RewritePanel({ r }: { r: RewriteResult }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copyText = (label: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    });
  };
  const Field = ({ label, value }: { label: string; value: string }) => {
    if (!value?.trim()) return null;
    return (
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#c084fc]">{label}</span>
          <button onClick={() => copyText(label, value)}
            className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/60 hover:bg-white/10 hover:text-white transition">
            {copied === label ? <><Check className="w-3 h-3 text-emerald-400" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
          </button>
        </div>
        <p className="whitespace-pre-wrap text-sm text-white/90 leading-relaxed">{value}</p>
      </div>
    );
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-[#a855f7]/30 bg-[#a855f7]/10 px-4 py-3">
        <Sparkles className="w-5 h-5 text-[#c084fc]" />
        <div>
          <div className="text-sm font-black text-white">Versão reescrita — forte e policy-safe</div>
          {r.anguloSchwartz && <div className="text-[12px] text-white/50">{r.anguloSchwartz}</div>}
        </div>
      </div>
      <Field label="Headline" value={r.headline} />
      <Field label="Copy" value={r.copy} />
      <Field label="Descrição" value={r.descricao} />
      {r.mudancas?.length > 0 && (
        <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            <Wand2 className="w-4 h-4" /> O que mudou e por quê
          </div>
          <ul className="space-y-1 text-sm text-white/80">
            {r.mudancas.map((m, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500">→</span>{m}</li>)}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

function PreaprovadorBoard() {
  const [headline, setHeadline] = useState('');
  const [copy, setCopy] = useState('');
  const [descricao, setDescricao] = useState('');
  const [plataforma, setPlataforma] = useState<'meta' | 'google'>('meta');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreaproveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fixing, setFixing] = useState(false);
  const [rewrite, setRewrite] = useState<RewriteResult | null>(null);

  const run = async () => {
    if (!copy.trim()) { setError('Cole pelo menos a copy do anúncio.'); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    setRewrite(null);
    try {
      const res = await preaprovadorApi.run({
        headline: headline.trim() || undefined,
        copy: copy.trim(),
        descricao: descricao.trim() || undefined,
        plataforma,
      });
      setResult(res.data);
    } catch (e) {
      const err = e as PlusApiError;
      if (err.status === 503 || err.code === 'llm_unavailable') {
        setError('O pré-aprovador está temporariamente indisponível. Tente novamente em instantes.');
      } else {
        setError(err.message || 'Erro ao analisar o criativo');
      }
    } finally {
      setLoading(false);
    }
  };

  const fix = async () => {
    setFixing(true);
    setError(null);
    try {
      const res = await preaprovadorApi.rewrite({
        headline: headline.trim() || undefined,
        copy: copy.trim(),
        descricao: descricao.trim() || undefined,
        plataforma,
        termosProblema: result?.termosProblema || [],
      });
      setRewrite(res.data);
    } catch (e) {
      const err = e as PlusApiError;
      if (err.status === 503 || err.code === 'llm_unavailable') {
        setError('A reescrita está temporariamente indisponível. Tente novamente em instantes.');
      } else {
        setError(err.message || 'Erro ao reescrever o criativo');
      }
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['meta', 'google'] as const).map((p) => (
            <button key={p} onClick={() => setPlataforma(p)}
              className={`rounded-xl px-4 py-2 text-sm font-bold uppercase transition ${
                plataforma === p ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}>{p === 'meta' ? 'Meta Ads' : 'Google Ads'}</button>
          ))}
        </div>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Headline (opcional)"
          className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 px-3 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
        />
        <textarea
          value={copy}
          onChange={(e) => setCopy(e.target.value)}
          placeholder="Cole aqui a copy do anúncio que vai pra análise..."
          rows={8}
          className="w-full resize-y rounded-xl bg-white/5 border border-white/10 py-2.5 px-3 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
        />
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição / texto complementar (opcional)"
          className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 px-3 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
        />
        <button
          onClick={run}
          disabled={loading || !copy.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-black uppercase text-black transition hover:bg-emerald-400 disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {loading ? 'Analisando...' : 'Pré-aprovar criativo'}
        </button>
        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      </div>

      <div className="space-y-6">
        {result ? <ResultPanel r={result} onFix={fix} fixing={fixing} /> : (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-white/30">
            <ShieldCheck className="mb-3 w-10 h-10" />
            <p className="max-w-xs text-sm">O parecer da IA aparece aqui: veredito, score, termos de risco e ajustes para reduzir reprovação.</p>
          </div>
        )}
        {rewrite && <RewritePanel r={rewrite} />}
      </div>
    </div>
  );
}

export default function PreaprovadorPage() {
  return (
    <div className="relative min-h-screen">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12 pt-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="flex items-center gap-3 text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter">
            <ShieldCheck className="w-8 h-8 text-emerald-500" /> Pré-<span className="text-emerald-500">aprovador</span>
          </h1>
          <p className="mt-2 text-white/50">Antes de subir, descubra se seu criativo tem risco de reprovação nas políticas de anúncio.</p>
        </motion.div>
        <FeatureGate feature="criativo_preaprovador">
          <PreaprovadorBoard />
        </FeatureGate>
      </div>
    </div>
  );
}
