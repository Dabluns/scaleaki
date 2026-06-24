"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import { useAccess } from '../../context/AccessContext';

type Props = {
  children: ReactNode;
  /** Texto do upsell mostrado no overlay. */
  upsell?: string;
  /** Mostra o conteúdo borrado por baixo do upsell (default true). */
  blur?: boolean;
};

/**
 * Gate por tier Plus para features SEM FeatureKey no /account/access
 * (Scaleflix, Placa — backend usa requirePaid, mas comercialmente são Plus).
 * Para features com FeatureKey use <FeatureGate feature=...>.
 */
export default function PlusGate({ children, upsell = 'Este recurso é exclusivo do Scaleaki+.', blur = true }: Props) {
  const { access, loading } = useAccess();

  if (loading) {
    return <div className="animate-pulse rounded-xl bg-white/5 h-40 w-full" />;
  }

  if (access?.tier === 'plus') return <>{children}</>;

  return (
    <div className="relative rounded-xl overflow-hidden">
      {blur && (
        <div className="pointer-events-none select-none blur-sm opacity-40" aria-hidden>
          {children}
        </div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm p-6 text-center">
        <span className="text-3xl">⚡</span>
        <span className="rounded-full bg-[#a855f7]/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#c084fc]">
          Scaleaki+
        </span>
        <p className="text-sm text-white/80 max-w-xs">{upsell}</p>
        <Link
          href="/upgrade"
          className="rounded-lg bg-[#a855f7] px-5 py-2 text-sm font-extrabold uppercase text-white transition hover:bg-[#c084fc]"
        >
          Conhecer o Scaleaki+
        </Link>
      </div>
    </div>
  );
}
