"use client";

import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Radar, SearchX, Inbox, LayoutGrid, RefreshCw } from 'lucide-react';

type Illustration = 'searching' | 'empty' | 'no-results';

interface EmptyStateIllustrationProps extends React.HTMLAttributes<HTMLDivElement> {
  illustration?: Illustration;
  title?: string;
  message: string;
  cta?: string;
  onCtaClick?: () => void;
}

const illuConfig: Record<Illustration, { icon: typeof Radar; color: string; glowColor: string }> = {
  searching: { icon: Radar, color: 'text-green-500', glowColor: 'rgba(34, 197, 94, 0.4)' },
  empty: { icon: Inbox, color: 'text-cyan-500', glowColor: 'rgba(6, 182, 212, 0.4)' },
  'no-results': { icon: SearchX, color: 'text-amber-500', glowColor: 'rgba(245, 158, 11, 0.4)' },
};

export const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({
  illustration = 'searching',
  title,
  message,
  cta,
  onCtaClick,
  className,
  ...props
}) => {
  const config = illuConfig[illustration];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        'relative flex flex-col items-center justify-center text-center py-20 px-12',
        className
      )}
    >
      {/* Background Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${config.glowColor}, transparent 70%)`,
          opacity: 0.15,
        }}
      />

      {/* Radar Ring Animation */}
      <div className="relative mb-10">
        {/* Outer Ring Pulse */}
        <motion.div
          className="absolute inset-0 rounded-full border border-white/5"
          style={{ width: 140, height: 140, top: -30, left: -30 }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-white/5"
          style={{ width: 140, height: 140, top: -30, left: -30 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />

        {/* Icon Container */}
        <div className="relative w-20 h-20 rounded-[1.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-center backdrop-blur-sm">
          <div
            className="absolute inset-0 rounded-[1.5rem]"
            style={{ boxShadow: `inset 0 0 30px ${config.glowColor}` }}
          />
          <motion.div
            animate={{ rotate: illustration === 'searching' ? 360 : 0 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <Icon className={clsx('w-9 h-9 relative z-10', config.color)} strokeWidth={1.5} />
          </motion.div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 animate-pulse" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
          Status // Aguardando Dados
        </span>
      </div>

      {/* Title */}
      {title && (
        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3 leading-tight">
          {title}
        </h3>
      )}

      {/* Message */}
      <p className="text-sm text-white/30 font-medium max-w-md leading-relaxed mb-8">
        {message}
      </p>

      {/* CTA Button */}
      {cta && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCtaClick}
          className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-green-500/40 transition-all duration-500 overflow-hidden"
        >
          {/* Hover Glow */}
          <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <RefreshCw className="w-4 h-4 text-green-500/60 group-hover:text-green-400 group-hover:rotate-180 transition-all duration-700 relative z-10" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white/80 transition-colors relative z-10">
            {cta}
          </span>
        </motion.button>
      )}
    </motion.div>
  );
};
