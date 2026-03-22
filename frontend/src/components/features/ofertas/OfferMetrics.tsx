'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useCounter } from '@/hooks/useCounter';
import { Oferta } from '@/types/oferta';
import { Target, HelpCircle } from 'lucide-react';
import clsx from 'clsx';

interface OfferMetricsProps {
  oferta: Oferta;
}

export const OfferMetrics: React.FC<OfferMetricsProps> = ({
  oferta,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Animar apenas uma vez quando entrar na viewport
  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  // Métricas removidas - componente não exibe mais dados
  const metrics: any[] = [];

  return (
    <div ref={containerRef} className="flex flex-wrap gap-6">
      {metrics.length === 0 && (
        <div className="text-text-secondary/50 text-sm">Nenhuma métrica disponível</div>
      )}
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={clsx('relative p-6 rounded-xl transition-all duration-300 group backdrop-blur-sm', metric.bgColor, 'border border-border/30')}
        >
          <div className="flex items-center gap-4">
            <div className={clsx('p-3 rounded-lg bg-surface/50 backdrop-blur-sm', metric.bgColor)}>
              <metric.icon className={clsx('w-6 h-6', metric.color)} />
            </div>
            <div>
              <div className="text-xs text-text-secondary/70 mb-1 uppercase tracking-wide">{metric.label}</div>
              <div className={clsx('text-3xl font-black transition-all duration-300', metric.color)}>
                {metric.formatted}
              </div>
            </div>
            
            {/* Tooltip */}
            <div className="relative ml-auto" role="tooltip" aria-label={metric.description}>
              <HelpCircle 
                className="w-4 h-4 text-text-tertiary/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-help" 
                aria-hidden="true"
              />
              <div 
                className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-surface border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-xs text-text-primary"
                role="tooltip"
              >
                <div className="font-semibold mb-1">{metric.label}</div>
                <div className="text-text-secondary">{metric.description}</div>
                {metric.tooltip && (
                  <div className="mt-2 pt-2 border-t border-border text-text-tertiary">
                    {metric.tooltip}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

