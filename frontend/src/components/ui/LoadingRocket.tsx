"use client";

import React from 'react';
import clsx from 'clsx';

interface LoadingRocketProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export const LoadingRocket: React.FC<LoadingRocketProps> = ({ message = 'Lançando dados...', className, ...props }) => {
  return (
    <div className={clsx('relative flex flex-col items-center justify-center min-h-[240px] py-8', className)} {...props}>
      <div className="relative">
        <div className="text-6xl animate-float">🚀</div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full blur-2xl opacity-60 bg-gradient-to-t from-orange-500/60 to-yellow-500/10 animate-glow-pulse" />
      </div>
      <div className="mt-4 h-2 w-56 bg-surface-secondary rounded-full overflow-hidden border border-border">
        <div className="h-full w-2/3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 animate-gradient" />
      </div>
      <div className="text-sm text-text-secondary mt-2">{message}</div>
    </div>
  );
};


