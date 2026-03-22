import React from 'react';
import clsx from 'clsx';

type BadgeColor = 'green' | 'blue' | 'red' | 'yellow' | 'gray' | 'success' | 'error' | 'warning' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

// Badge básico - para casos simples onde não precisa de animações
export const Badge: React.FC<BadgeProps> = ({ color = 'gray', children, className, ...props }) => {
  const colorMap = {
    // Tokens semânticos (preferidos)
    success: 'bg-success/20 text-success border border-success/30',
    error: 'bg-error/20 text-error border border-error/30',
    warning: 'bg-warning/20 text-warning border border-warning/30',
    info: 'bg-info/20 text-info border border-info/30',
    
    // Cores legadas (mapeadas para tokens semânticos)
    green: 'bg-success/20 text-success border border-success/30',
    blue: 'bg-info/20 text-info border border-info/30',
    red: 'bg-error/20 text-error border border-error/30',
    yellow: 'bg-warning/20 text-warning border border-warning/30',
    gray: 'bg-surface-secondary text-text-secondary border border-border',
  };
  return (
    <span
      className={clsx(
        'inline-block rounded px-2 py-0.5 text-xs font-semibold transition-colors',
        colorMap[color],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}; 