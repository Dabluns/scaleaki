"use client";

import React from 'react';
import clsx from 'clsx';

interface LoadingMoneyProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export const LoadingMoney: React.FC<LoadingMoneyProps> = ({ message = 'Carregando ofertas valiosas...', className, ...props }) => {
  return (
    <div className={clsx('relative flex flex-col items-center justify-center min-h-[240px] py-8', className)} {...props}>
      {/* Coins rain */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-2xl select-none"
            style={{
              left: `${(i * 7) % 100}%`,
              animation: `float ${2.5 + (i % 5) * 0.3}s ease-in-out ${i * 0.1}s infinite`,
              top: `${(i % 10) * -10}%`,
            }}
          >
            💰
          </span>
        ))}
      </div>

      {/* Core content */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="text-5xl animate-elastic-bounce">💸</div>
        <div className="h-3 w-56 bg-surface-secondary rounded-full overflow-hidden border border-border">
          <div className="h-full w-1/3 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 animate-gradient" />
        </div>
        <div className="text-sm text-text-secondary">{message}</div>
      </div>
    </div>
  );
};


