import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'new' | 'trending' | 'premium' | 'achievement';
type BadgeColor = 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'cyan' | 'orange' | 'pink' | 'gradient';

interface BadgeAnimatedProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  color?: BadgeColor;
  icon?: React.ReactNode;
  pulse?: boolean;
  glow?: boolean;
  shimmer?: boolean;
}

export const BadgeAnimated: React.FC<BadgeAnimatedProps> = ({
  variant = 'default',
  color = 'green',
  children,
  className,
  icon,
  pulse = false,
  glow = false,
  shimmer = false,
  ...props
}) => {
  const colorMap = {
    green: 'bg-success/20 text-success border-success/30',
    blue: 'bg-info/20 text-info border-info/30',
    red: 'bg-error/20 text-error border-error/30',
    yellow: 'bg-warning/20 text-warning border-warning/30',
    purple: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
    orange: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    pink: 'bg-pink-500/20 text-pink-500 border-pink-500/30',
    gradient: 'bg-gradient-to-r from-green-500/20 to-cyan-500/20 text-green-500 border-green-500/30',
  };

  const variantStyles = {
    default: '',
    new: 'animate-glow-pulse',
    trending: 'animate-float',
    premium: shimmer ? 'shimmer bg-gradient-to-r from-purple-500/20 to-pink-500/20' : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
    achievement: 'animate-elastic-bounce',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all',
        colorMap[color],
        variantStyles[variant],
        {
          'animate-pulse': pulse,
          'shadow-[0_0_15px_rgba(16,185,129,0.5)]': glow && color === 'green',
          'shadow-[0_0_15px_rgba(139,92,246,0.5)]': glow && color === 'purple',
          'shadow-[0_0_15px_rgba(6,182,212,0.5)]': glow && color === 'cyan',
          'shadow-[0_0_15px_rgba(249,115,22,0.5)]': glow && color === 'orange',
          'shadow-[0_0_15px_rgba(236,72,153,0.5)]': glow && color === 'pink',
        },
        className,
      )}
      {...props}
    >
      {icon && <span className="animate-float">{icon}</span>}
      {children}
    </span>
  );
};

