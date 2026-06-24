"use client";

import Link from 'next/link';
import { ShoppingBag, Radio, Network, ShieldCheck, Clapperboard, Award, ArrowUpRight } from 'lucide-react';

const FEATURES = [
  { href: '/marketplace', icon: ShoppingBag, title: 'Marketplaces', desc: 'Produtos escalados em 5 marketplaces' },
  { href: '/adspy', icon: Radio, title: 'Ad Spy', desc: 'Anúncios em alta no YouTube e TikTok' },
  { href: '/funil', icon: Network, title: 'Extrator de Funil', desc: 'Checkout, stack e pixels do concorrente' },
  { href: '/pre-aprovador', icon: ShieldCheck, title: 'Pré-aprovador', desc: 'Risco de reprovação antes de subir' },
  { href: '/scaleflix', icon: Clapperboard, title: 'Scaleflix', desc: 'Videoaulas pra extrair o máximo' },
  { href: '/placa', icon: Award, title: 'Placa', desc: 'Sua placa de faturamento física' },
];

export function PlusFeaturesGrid() {
  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Arsenal Scaleaki+</h2>
        <span className="rounded-full bg-[#a855f7]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#c084fc]">Plus</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.href}
              href={f.href}
              className="group relative flex flex-col gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-5 transition-colors hover:border-emerald-500/30"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-white/20 transition-colors group-hover:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide text-white/90">{f.title}</h3>
                <p className="mt-1 text-[12px] text-white/40">{f.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
