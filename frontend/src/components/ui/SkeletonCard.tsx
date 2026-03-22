'use client';

import React from 'react';
import clsx from 'clsx';

interface SkeletonCardProps {
  shimmer?: boolean;
  gradient?: boolean;
  pulseColor?: 'green' | 'purple' | 'cyan' | 'orange';
  className?: string;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  shimmer = true,
  gradient = false,
  pulseColor = 'green',
  className,
  lines = 3,
}) => {
  const pulseColors = {
    green: 'bg-green-500/20',
    purple: 'bg-purple-500/20',
    cyan: 'bg-cyan-500/20',
    orange: 'bg-orange-500/20',
  };

  return (
    <div
      className={clsx(
        'rounded-lg border border-border p-4',
        'bg-surface',
        {
          'animate-pulse': !shimmer,
          [pulseColors[pulseColor]]: !gradient,
          'bg-gradient-to-br from-green-500/10 via-cyan-500/10 to-purple-500/10': gradient,
        },
        className
      )}
    >
      {/* Header with shimmer */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={clsx(
            'w-12 h-12 rounded-full',
            shimmer ? 'shimmer' : pulseColors[pulseColor],
            'animate-pulse'
          )}
        />
        <div className="flex-1 space-y-2">
          <div
            className={clsx(
              'h-4 rounded',
              shimmer ? 'shimmer w-3/4' : pulseColors[pulseColor],
              'animate-pulse'
            )}
          />
          <div
            className={clsx(
              'h-3 rounded',
              shimmer ? 'shimmer w-1/2' : pulseColors[pulseColor],
              'animate-pulse'
            )}
          />
        </div>
      </div>

      {/* Image placeholder */}
      <div
        className={clsx(
          'w-full h-32 rounded-lg mb-4',
          shimmer ? 'shimmer' : pulseColors[pulseColor],
          'animate-pulse'
        )}
      />

      {/* Content lines */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              'h-3 rounded',
              shimmer ? 'shimmer' : pulseColors[pulseColor],
              'animate-pulse',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>

      {/* Footer buttons */}
      <div className="flex gap-2 mt-4">
        <div
          className={clsx(
            'h-8 rounded-lg flex-1',
            shimmer ? 'shimmer' : pulseColors[pulseColor],
            'animate-pulse'
          )}
        />
        <div
          className={clsx(
            'h-8 w-8 rounded-lg',
            shimmer ? 'shimmer' : pulseColors[pulseColor],
            'animate-pulse'
          )}
        />
      </div>
    </div>
  );
};

export const SkeletonText: React.FC<{
  className?: string;
  shimmer?: boolean;
  width?: string;
}> = ({ className, shimmer = true, width = 'w-full' }) => {
  return (
    <div
      className={clsx(
        'h-4 rounded',
        shimmer ? 'shimmer' : 'bg-surface-secondary animate-pulse',
        width,
        className
      )}
    />
  );
};

export const SkeletonCircle: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  shimmer?: boolean;
}> = ({ size = 'md', shimmer = true }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={clsx(
        'rounded-full',
        shimmer ? 'shimmer' : 'bg-surface-secondary animate-pulse',
        sizes[size]
      )}
    />
  );
};

export const SkeletonGrid: React.FC<{
  count?: number;
  shimmer?: boolean;
  gradient?: boolean;
}> = ({ count = 6, shimmer = true, gradient = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard
          key={i}
          shimmer={shimmer}
          gradient={gradient}
          pulseColor={i % 2 === 0 ? 'green' : 'purple'}
        />
      ))}
    </div>
  );
};

