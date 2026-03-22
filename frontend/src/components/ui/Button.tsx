import React, { useState, useRef } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'gradient';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  hasRipple?: boolean;
  hasGlow?: boolean;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  hasRipple = true,
  hasGlow = false,
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hasRipple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = { x, y, id: Date.now() };
      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.(e);
  };

  return (
    <button
      ref={buttonRef}
      className={clsx(
        'relative overflow-hidden font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2',
        {
          // Primary
          'bg-accent text-white hover:bg-accent-hover focus:ring-accent/40':
            variant === 'primary',

          // Gradient
          'bg-gradient-to-r from-green-500 to-cyan-500 text-white hover:from-green-600 hover:to-cyan-600 shadow-lg':
            variant === 'gradient',

          // Secondary
          'bg-surface-secondary text-text-primary hover:bg-surface-hover border border-border':
            variant === 'secondary',

          // Ghost
          'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary':
            variant === 'ghost',

          // Outline
          'bg-transparent border border-border text-text-primary hover:bg-surface':
            variant === 'outline',

          // Glow effect
          'hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]': hasGlow && variant === 'primary',
          'hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]': hasGlow && variant === 'gradient',

          // Sizes
          'px-4 py-2 text-base': size === 'md',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {children}

      {/* Ripple Effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x - 5,
            top: ripple.y - 5,
            width: 10,
            height: 10,
          }}
        />
      ))}
    </button>
  );
}; 