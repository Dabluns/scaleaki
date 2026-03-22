'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { useSettings } from '@/context/SettingsContext';

type CardVariant = 'default' | 'elevated' | 'floating' | 'glass' | 'neon';
type CardSize = 'sm' | 'md' | 'lg';

interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  hasParallax?: boolean;
  has3DRotation?: boolean;
  animatedBorder?: boolean;
  children: React.ReactNode;
}

export const Card3D: React.FC<Card3DProps> = ({
  variant = 'default',
  size = 'md',
  hover = true,
  glow = false,
  gradient = false,
  hasParallax = false,
  has3DRotation = false,
  animatedBorder = false,
  children,
  className,
  ...props
}) => {
  const { settings } = useSettings();
  const cards3DEnabled = (settings as any)?.cards3DEnabled ?? true;

  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Se cards 3D estão desabilitados, desativa todos os efeitos 3D
  const effectiveHas3DRotation = cards3DEnabled && has3DRotation;
  const effectiveHover = cards3DEnabled && hover;
  const effectiveGlow = cards3DEnabled && glow;
  const effectiveAnimatedBorder = cards3DEnabled && animatedBorder;
  const effectiveHasParallax = cards3DEnabled && hasParallax;

  const sizeMap = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const variantStyles = {
    default: 'bg-surface border border-border shadow-sm',
    elevated: 'bg-surface border border-border shadow-lg',
    floating: 'bg-surface/80 backdrop-blur-sm border border-border/50 shadow-xl',
    glass: 'bg-surface/20 backdrop-blur-md border border-border/30 shadow-2xl',
    neon: 'bg-surface border border-border shadow-[0_0_20px_rgba(16,185,129,0.3)]',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!effectiveHas3DRotation) return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -15; // Máximo 15 graus
    const rotateY = ((x - centerX) / centerX) * 15;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    if (cards3DEnabled) {
      setIsHovered(true);
    }
  };

  const getTransform = () => {
    if (!cards3DEnabled) return undefined;

    if (effectiveHas3DRotation && isHovered) {
      const base = `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
      return effectiveHover ? `${base} translateY(-8px) scale(1.02)` : base;
    }
    if (effectiveHover && isHovered) {
      return 'translateY(-8px) scale(1.02)';
    }
    return undefined;
  };

  return (
    <div
      className={clsx(
        'relative rounded-lg transition-all duration-300',
        sizeMap[size],
        variantStyles[variant],
        {
          'hover:shadow-2xl': effectiveHover,
          'shadow-[0_0_25px_rgba(16,185,129,0.4)]': effectiveGlow,
          'bg-gradient-to-br from-surface to-surface/80': gradient,
        },
        className,
      )}
      style={{
        transform: getTransform(),
      }}
      onMouseMove={effectiveHas3DRotation ? handleMouseMove : undefined}
      onMouseLeave={cards3DEnabled ? handleMouseLeave : undefined}
      onMouseEnter={cards3DEnabled ? handleMouseEnter : undefined}
      {...props}
    >
      {/* Animated gradient border */}
      {effectiveAnimatedBorder && (
        <div
          className={clsx(
            'absolute inset-0 rounded-lg -z-10 opacity-50',
            'bg-gradient-to-r from-green-500 via-cyan-500 to-purple-500',
            'animate-gradient',
            {
              'opacity-75': isHovered,
            }
          )}
          style={{
            padding: '2px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      {/* Parallax container */}
      {effectiveHasParallax ? (
        <div className="relative" style={{ transform: 'translateZ(20px)' }}>
          {children}
        </div>
      ) : (
        children
      )}

      {/* Shine effect on hover */}
      {cards3DEnabled && isHovered && (
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute inset-0 shimmer" />
        </div>
      )}
    </div>
  );
};

