'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Layers, TrendingUp, Zap, ShoppingBag, ArrowRight } from 'lucide-react';
import { getNichos, getOfertas, type Nicho, type Oferta } from '@/lib/api';

export default function DashboardHome() {
  const [nichos, setNichos] = useState<Nicho[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getNichos().catch(() => []), getOfertas().catch(() => [])])
      .then(([n, o]) => {
        setNichos(n);
        setOfertas(o);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="font-display font-black text-3xl mb-2">Bem-vindo de volta</h1>
        <p className="text-muted">Aqui está um resumo do que está rodando agora.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Layers className="w-4 h-4" />} label="Nichos" value={loading ? '...' : nichos.length} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Ofertas ativas" value={loading ? '...' : ofertas.length} />
        <StatCard icon={<Zap className="w-4 h-4" />} label="Updates hoje" value="—" />
        <StatCard icon={<ShoppingBag className="w-4 h-4" />} label="Marketplace" value="+soon" badge />
      </div>

      {/* Ações rápidas */}
      <section>
        <h2 className="font-display font-bold text-xl mb-4">Ações rápidas</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <ActionCard
            href="/ofertas"
            title="Explorar ofertas"
            desc="Veja todas as ofertas escaladas por nicho"
            icon={<Layers className="w-5 h-5" />}
          />
          <ActionCard
            href="/marketplace"
            title="Marketplace"
            desc="Produtos validados de várias origens"
            icon={<ShoppingBag className="w-5 h-5" />}
            badge="Plus"
          />
          <ActionCard
            href="/adspy"
            title="AdSpy"
            desc="Análise competitiva de anúncios"
            icon={<TrendingUp className="w-5 h-5" />}
            badge="Plus"
          />
        </div>
      </section>

      {/* Nichos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl">Nichos disponíveis</h2>
          <Link href="/ofertas" className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1">
            Ver ofertas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="text-muted text-sm">Carregando...</div>
        ) : nichos.length === 0 ? (
          <div className="glass rounded-lg p-6 text-center text-muted text-sm">
            Nenhum nicho encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {nichos.slice(0, 8).map((n) => (
              <Link
                key={n.id || n.slug}
                href={`/oferta/${n.slug || n.id}`}
                className="glass-subtle rounded-lg p-4 hover:border-primary-500/40 hover:bg-white/[0.05] transition-all text-center"
              >
                <div className="text-2xl mb-1">{n.icon || '📦'}</div>
                <div className="text-sm font-medium">{n.name}</div>
                {n.count !== undefined && (
                  <div className="text-xs text-muted mt-1">{n.count} ofertas</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, badge }: { icon: React.ReactNode; label: string; value: string | number; badge?: boolean }) {
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted text-xs mb-2">
        {icon}
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display font-black text-2xl">{value}</span>
        {badge && <span className="badge-plus ml-auto">Plus</span>}
      </div>
    </div>
  );
}

function ActionCard({ href, title, desc, icon, badge }: { href: string; title: string; desc: string; icon: React.ReactNode; badge?: string }) {
  return (
    <Link href={href} className="glass rounded-lg p-5 hover:border-primary-500/40 transition-all group block">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-md bg-primary-500/10 flex items-center justify-center text-primary-400">
          {icon}
        </div>
        {badge && <span className="badge-plus">{badge}</span>}
      </div>
      <div className="font-display font-bold mb-1 group-hover:text-primary-300 transition-colors">{title}</div>
      <div className="text-sm text-muted">{desc}</div>
    </Link>
  );
}