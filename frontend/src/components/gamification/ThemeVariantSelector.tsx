'use client';

import React, { useState, useEffect } from 'react';
import { ThemeVariant, themes, applyTheme, getStoredThemeVariant } from '@/lib/themes';
import { Card3D } from '@/components/ui/Card3D';
import clsx from 'clsx';

interface ThemeVariantSelectorProps {
  className?: string;
  compact?: boolean;
}

export const ThemeVariantSelector: React.FC<ThemeVariantSelectorProps> = ({ 
  className,
  compact = false 
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ThemeVariant>('cyberpunk');

  useEffect(() => {
    const stored = getStoredThemeVariant();
    setSelectedVariant(stored);
  }, []);

  const handleSelectTheme = (variant: ThemeVariant) => {
    setSelectedVariant(variant);
    applyTheme(variant);
    
    // Confetti ao mudar de tema (apenas para temas especiais)
    if (variant !== 'default' && typeof window !== 'undefined') {
      // Usar dynamic import para evitar SSR issues
      import('@/lib/confetti').then(({ confettiPresets }) => {
        confettiPresets.basic();
      });
    }
  };

  const themePreview: Record<ThemeVariant, { emoji: string; name: string; description: string }> = {
    default: {
      emoji: '🌿',
      name: 'Padrão',
      description: 'Tema clássico e profissional',
    },
    neon: {
      emoji: '✨',
      name: 'Neon',
      description: 'Cores vibrantes e energéticas',
    },
    pastel: {
      emoji: '🎨',
      name: 'Pastel',
      description: 'Suave e acolhedor',
    },
    cyberpunk: {
      emoji: '🤖',
      name: 'Cyberpunk',
      description: 'Futurista e ousado',
    },
    'high-contrast': {
      emoji: '⚡',
      name: 'Alto Contraste',
      description: 'Máxima visibilidade',
    },
  };

  if (compact) {
    return (
      <div className={clsx('flex gap-2', className)}>
        {(Object.keys(themes) as ThemeVariant[]).map((variant) => (
          <button
            key={variant}
            onClick={() => handleSelectTheme(variant)}
            className={clsx(
              'w-12 h-12 rounded-lg transition-all duration-300',
              'flex items-center justify-center text-2xl',
              'border-2',
              {
                'border-accent shadow-lg scale-110': selectedVariant === variant,
                'border-border hover:border-accent/50': selectedVariant !== variant,
              }
            )}
            title={themePreview[variant].name}
          >
            {themePreview[variant].emoji}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      <h3 className="text-lg font-semibold text-text-primary">Tema Visual</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(Object.keys(themes) as ThemeVariant[]).map((variant) => (
          <Card3D
            key={variant}
            variant={selectedVariant === variant ? 'neon' : 'default'}
            className={clsx(
              'p-4 cursor-pointer transition-all',
              {
                'ring-2 ring-accent shadow-[0_0_20px_rgba(16,185,129,0.4)]': selectedVariant === variant,
              }
            )}
            onClick={() => handleSelectTheme(variant)}
            hover
            glow={selectedVariant === variant}
          >
            <div className="text-center space-y-2">
              <div className="text-4xl">{themePreview[variant].emoji}</div>
              <div className="text-sm font-medium text-text-primary">
                {themePreview[variant].name}
              </div>
              <div className="text-xs text-text-secondary">
                {themePreview[variant].description}
              </div>
            </div>
          </Card3D>
        ))}
      </div>
    </div>
  );
};

