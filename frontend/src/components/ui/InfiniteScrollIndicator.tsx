'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, ShieldCheck, Box } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · Premium InfiniteScrollIndicator v2.0
// Pegada: Mastery High-Fidelity, Tactical Precision, No Gradients.
// ─────────────────────────────────────────────────────────────────

interface InfiniteScrollIndicatorProps {
  hasProgressBar?: boolean;
  hasConfetti?: boolean;
  current?: number;
  total?: number;
  isLoading?: boolean;
  onReachedEnd?: () => void;
}

export const InfiniteScrollIndicator: React.FC<InfiniteScrollIndicatorProps> = ({
  hasProgressBar = true,
  current = 0,
  total = 0,
  isLoading = false,
}) => {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        {hasProgressBar && (
          <div className="w-full max-w-[300px]">
            <div className="relative h-[2px] bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                className="absolute inset-y-0 left-0 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Box size={14} className="text-green-500/40" />
          </motion.div>
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[.4em]">Sincronizando Dados...</span>
        </div>
      </div>
    );
  }

  if (current > 0 && current >= total) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 py-20 border-t border-white/5 mt-10"
      >
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-green-500/20 rounded-full animate-pulse" />
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center relative z-10 transition-transform hover:scale-110">
            <ShieldCheck className="text-green-500 w-6 h-6" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
            EXTRAÇÃO <span className="text-green-500">COMPLETA</span>
          </h3>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
            {total} Sinais validados no banco de dados
          </p>
        </div>

        {hasProgressBar && (
          <div className="w-full max-w-[400px] pt-4">
            <div className="relative h-[1px] bg-white/5">
              <div className="absolute inset-0 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
            </div>
            <div className="mt-4 flex justify-between items-center opacity-20">
              <span className="text-[8px] font-black uppercase tracking-widest text-white">Status: 100% Synced</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-white">Protocol Skaleaki v4.0</span>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="flex justify-center py-10 opacity-20">
      <ChevronDown className="text-white animate-bounce" size={24} />
    </div>
  );
};
