"use client";

import React from 'react';
import clsx from 'clsx';

interface LoadingGraphProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export const LoadingGraph: React.FC<LoadingGraphProps> = ({ message = 'Preparando gráficos e métricas...', className, ...props }) => {
  return (
    <div className={clsx('flex flex-col items-center justify-center min-h-[220px] py-8', className)} {...props}>
      <div className="relative w-64 h-32 border border-border rounded-md bg-surface overflow-hidden">
        {/* grid */}
        <div className="absolute inset-0 opacity-40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="absolute top-0 bottom-0 border-l border-border" style={{ left: `${(i + 1) * (100 / 7)}%` }} />
          ))}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-border" style={{ top: `${(i + 1) * (100 / 4)}%` }} />
          ))}
        </div>
        {/* animated line */}
        <svg className="absolute inset-0" viewBox="0 0 256 128">
          <polyline
            fill="none"
            stroke="url(#grad)"
            strokeWidth="3"
            points="0,110 40,100 80,60 120,85 160,50 200,70 240,30"
          >
          </polyline>
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 shimmer" />
      </div>
      <div className="mt-3 h-2 w-40 bg-surface-secondary rounded-full overflow-hidden border border-border">
        <div className="h-full w-1/2 bg-gradient-to-r from-green-500 via-cyan-500 to-purple-500 animate-gradient" />
      </div>
      <div className="text-sm text-text-secondary mt-2">{message}</div>
    </div>
  );
};


