"use client";

import { Oferta } from '@/types/oferta';
import clsx from 'clsx';

interface ReelBadgesProps {
  oferta: Oferta;
}

export function ReelBadges({ oferta }: ReelBadgesProps) {
  // Parse métricas
  const metricas = typeof oferta.metricas === 'string' 
    ? (() => {
        try {
          return JSON.parse(oferta.metricas);
        } catch {
          return null;
        }
      })()
    : oferta.metricas;

  const roi = metricas?.roi || (oferta.receita ? ((oferta.receita || 0) / 100) : null);
  const ctr = metricas?.ctr || null;
  const receita = oferta.receita || 0;

  // Verificar se é novo (últimas 24h)
  const isNew = (() => {
    if (!oferta.createdAt) return false;
    const createdAt = new Date(oferta.createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  })();

  const badges: Array<{ label: string; icon: string; className: string; condition: boolean }> = [
    {
      label: 'HOT',
      icon: '🔥',
      className: 'bg-green-500 text-white animate-badge-bounce',
      condition: roi !== null && roi > 200,
    },
    {
      label: 'TRENDING',
      icon: '⚡',
      className: 'bg-green-500 text-white animate-badge-bounce',
      condition: ctr !== null && ctr > 5,
    },
    {
      label: 'PREMIUM',
      icon: '💎',
      className: 'bg-green-500 text-white animate-badge-bounce',
      condition: receita > 10000,
    },
    {
      label: 'NOVO',
      icon: '✨',
      className: 'bg-green-500 text-white animate-badge-bounce',
      condition: isNew,
    },
  ];

  const activeBadges = badges.filter(b => b.condition);

  if (activeBadges.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
      {activeBadges.map((badge, index) => (
        <div
          key={badge.label}
          className={clsx(
            'px-2.5 py-1 rounded-full text-xs font-black uppercase shadow-lg backdrop-blur-sm border border-white/20',
            badge.className
          )}
          style={{
            animationDelay: `${index * 0.1}s`,
          }}
        >
          <span className="mr-1">{badge.icon}</span>
          {badge.label}
        </div>
      ))}
    </div>
  );
}

