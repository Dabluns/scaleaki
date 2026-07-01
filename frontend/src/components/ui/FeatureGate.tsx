"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import { FeatureKey } from '../../lib/access';
import { useAccess } from '../../context/AccessContext';

type Props = {
  feature: FeatureKey;
  children: ReactNode;
  /** Mostra o conteúdo borrado por baixo do upsell (default true). */
  blur?: boolean;
};

/**
 * Envolve qualquer conteúdo de feature. Se o plano do usuário não libera,
 * mostra overlay de upsell com CTA para o checkout. Fonte de verdade = backend.
 */
export default function FeatureGate({ feature, children, blur = true }: Props) {
  const { can, loading } = useAccess();

  if (loading) {
    return <div className="animate-pulse rounded-xl bg-white/5 h-40 w-full" />;
  }

  const access = can(feature);
  if (access.allowed) return <>{children}</>;

  const isPlus = access.requiredTier === 'plus';
  const href = isPlus ? '/upgrade' : '/checkout';
  const cta = isPlus ? 'Conhecer o Scaleaki+' : 'Liberar acesso';

  return (
    <div className="relative rounded-xl overflow-hidden">
      {blur && (
        <div className="pointer-events-none select-none blur-sm opacity-40" aria-hidden>
          {children}
        </div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm p-6 text-center">
        <span className="text-3xl">{isPlus ? '⚡' : '🔒'}</span>
        <p className="text-sm text-white/80 max-w-xs">{access.upsell}</p>
        <Link
          href={href}
          className={`rounded-lg px-5 py-2 text-sm font-extrabold uppercase transition ${
            isPlus
              ? 'bg-[#a855f7] text-white hover:bg-[#c084fc]'
              : 'bg-[#22c55e] text-black hover:bg-[#4ade80]'
          }`}
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}
