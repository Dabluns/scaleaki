"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Network, Loader2, Globe, CreditCard, Cpu, Target, Layers, Link2, History, Eye,
} from 'lucide-react';
import FeatureGate from '@/components/ui/FeatureGate';
import { funilApi, FunnelExtraction, PlusApiError } from '@/lib/plus';

function InfoBlock({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
        <Icon className="w-4 h-4 text-emerald-500" /> {label}
      </div>
      <div className="text-sm text-white/80">{children}</div>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  if (!items?.length) return <span className="text-white/30">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <span key={i} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/70">{it}</span>
      ))}
    </div>
  );
}

function FunnelResult({ f }: { f: FunnelExtraction }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-black text-white">
          <Globe className="w-5 h-5 text-emerald-500" /> {f.domain}
        </h3>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
          f.status === 'done' ? 'bg-emerald-500/15 text-emerald-400'
          : f.status === 'failed' ? 'bg-red-500/15 text-red-400'
          : 'bg-amber-500/15 text-amber-400'
        }`}>{f.status}</span>
      </div>

      {f.screenshot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={f.screenshot} alt="screenshot" className="w-full rounded-xl border border-white/5" loading="lazy" />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoBlock icon={CreditCard} label="Checkout">{f.checkout || <span className="text-white/30">não detectado</span>}</InfoBlock>
        <InfoBlock icon={Cpu} label="Stack / Tecnologia">{f.tecnologia || <span className="text-white/30">não detectado</span>}</InfoBlock>
        <InfoBlock icon={Target} label="Pixels ativos"><Chips items={f.activePixels} /></InfoBlock>
        <InfoBlock icon={Layers} label="Subdomínios do funil"><Chips items={f.subdomains} /></InfoBlock>
        <InfoBlock icon={Link2} label="Serviços externos"><Chips items={f.externalServices} /></InfoBlock>
        <InfoBlock icon={Eye} label="Visitas estimadas/mês">
          {f.estimatedVisits != null ? new Intl.NumberFormat('pt-BR').format(f.estimatedVisits) : <span className="text-white/30">indisponível</span>}
        </InfoBlock>
      </div>

      {f.redirectChain?.length > 0 && (
        <InfoBlock icon={Link2} label="Cadeia de redirects">
          <ol className="list-decimal list-inside space-y-0.5 text-[12px] text-white/60">
            {f.redirectChain.map((u, i) => <li key={i} className="truncate">{u}</li>)}
          </ol>
        </InfoBlock>
      )}
    </motion.div>
  );
}

function FunilBoard() {
  const [domain, setDomain] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<FunnelExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<FunnelExtraction[]>([]);

  const loadHistory = useCallback(() => {
    funilApi.list(1, 15).then((r) => setHistory(r.data)).catch(() => {});
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const run = async () => {
    const d = domain.trim();
    if (!d) return;
    setRunning(true);
    setError(null);
    try {
      const res = await funilApi.extract(d);
      setResult(res.data);
      loadHistory();
    } catch (e) {
      const err = e as PlusApiError;
      setError(err.message || 'Erro ao analisar o funil');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !running && run()}
            placeholder="dominio-do-concorrente.com"
            className="w-full rounded-xl bg-white/5 border border-white/10 py-3 pl-10 pr-3 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <button
          onClick={run}
          disabled={running || !domain.trim()}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black uppercase text-black transition hover:bg-emerald-400 disabled:opacity-40"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
          {running ? 'Analisando...' : 'Mapear funil'}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      {result && <FunnelResult f={result} />}

      {history.length > 0 && (
        <div className="pt-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
            <History className="w-4 h-4" /> Análises recentes
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => setResult(h)}
                className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3 text-left hover:border-emerald-500/30 transition-colors"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white/90">{h.domain}</div>
                  <div className="text-[11px] text-white/40">{h.checkout || 'checkout n/d'}</div>
                </div>
                <span className={`ml-2 h-2 w-2 shrink-0 rounded-full ${
                  h.status === 'done' ? 'bg-emerald-500' : h.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FunilPage() {
  return (
    <div className="relative min-h-screen">
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12 pt-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="rounded-full bg-[#a855f7]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#c084fc]">Scaleaki+</span>
          </div>
          <h1 className="flex items-center gap-3 text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter">
            <Network className="w-8 h-8 text-emerald-500" /> Extrator de <span className="text-emerald-500">Funil</span>
          </h1>
          <p className="mt-2 text-white/50">Cole o domínio de um concorrente e veja checkout, stack, pixels e estrutura do funil.</p>
        </motion.div>
        <FeatureGate feature="trafego_funil">
          <FunilBoard />
        </FeatureGate>
      </div>
    </div>
  );
}
