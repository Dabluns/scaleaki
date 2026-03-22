"use client";

import { useState, useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Oferta } from '@/types/oferta';
import { useConfetti } from '@/lib/confetti';
import { useGamification } from '@/context/GamificationContext';
import clsx from 'clsx';

interface FavoritoButtonProps {
  oferta: Oferta;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'secondary' | 'outline';
  className?: string;
}

export function FavoritoButton({
  oferta,
  size = 'sm',
  variant = 'ghost',
  className = ''
}: FavoritoButtonProps) {
  const { user } = useAuth();
  const [isFavorito, setIsFavorito] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { heart } = useConfetti();
  const { addXP, updateStats, checkAndUnlockBadges } = useGamification();

  // Verificar se a oferta está nos favoritos
  useEffect(() => {
    if (user?.id && oferta.id) {
      const storedFavoritos = localStorage.getItem(`favoritos_${user.id}`);
      if (storedFavoritos) {
        try {
          const favoritosIds = JSON.parse(storedFavoritos);
          setIsFavorito(favoritosIds.includes(oferta.id));
        } catch (error) {
          console.error('Erro ao verificar favoritos:', error);
          setIsFavorito(false);
        }
      }
    }
  }, [user?.id, oferta.id]);

  const toggleFavorito = async () => {
    if (!user?.id || !oferta.id) return;

    setIsLoading(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    try {
      const storedFavoritos = localStorage.getItem(`favoritos_${user.id}`);
      let favoritosIds: string[] = [];

      if (storedFavoritos) {
        try {
          favoritosIds = JSON.parse(storedFavoritos);
        } catch (error) {
          console.error('Erro ao ler favoritos:', error);
          favoritosIds = [];
        }
      }

      let updatedFavoritos: string[];
      const willBeFavorito = !isFavorito;

      if (isFavorito) {
        // Remover dos favoritos
        updatedFavoritos = favoritosIds.filter(id => id !== oferta.id);
      } else {
        // Adicionar aos favoritos
        updatedFavoritos = [...favoritosIds, oferta.id];

        // Confetti se estiver adicionando aos favoritos
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const x = (rect.left + rect.width / 2) / window.innerWidth;
          const y = (rect.top + rect.height / 2) / window.innerHeight;
          heart(x, y);
        }
      }

      localStorage.setItem(`favoritos_${user.id}`, JSON.stringify(updatedFavoritos));
      setIsFavorito(!isFavorito);

      // Gamificação: adicionar XP e atualizar stats
      if (willBeFavorito) {
        // Verificar se é o primeiro favorito (antes de adicionar, o array estava vazio ou não tinha esse item)
        const isFirstFavorito = favoritosIds.length === 0;

        if (isFirstFavorito) {
          addXP('PRIMEIRO_FAVORITO');
        } else {
          addXP('FAVORITAR_OFERTA');
        }

        // Atualizar estatísticas
        updateStats({
          totalFavoritos: updatedFavoritos.length,
        });

        // Verificar badges após um pequeno delay
        setTimeout(() => checkAndUnlockBadges(), 200);
      } else {
        // Atualizar estatísticas ao remover
        updateStats({
          totalFavoritos: updatedFavoritos.length,
        });
      }

      // Disparar evento customizado para notificar outras partes da aplicação
      window.dispatchEvent(new CustomEvent('favoritos-changed', {
        detail: { ofertaId: oferta.id, isFavorito: willBeFavorito }
      }));

    } catch (error) {
      console.error('Erro ao atualizar favoritos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.id) {
    return null; // Não mostrar o botão se não há usuário logado
  }

  const sizeClasses = {
    sm: 'w-9 h-9 flex items-center justify-center rounded-full',
    md: 'w-11 h-11 flex items-center justify-center rounded-full',
    lg: 'w-13 h-13 flex items-center justify-center rounded-full'
  };

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 26
  };

  return (
    <button
      ref={buttonRef}
      onClick={toggleFavorito}
      disabled={isLoading}
      className={clsx(
        sizeClasses[size],
        className,
        'relative group transition-all duration-200 flex items-center justify-center',
        'border border-border rounded-full',
        'focus:outline-none focus:ring-2 focus:ring-pink-500/40',
        {
          // Quando está favoritado
          'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 border-pink-500/30': isFavorito,
          // Quando não está favoritado
          'bg-surface-secondary text-text-secondary hover:text-pink-500 hover:border-pink-500/30 hover:bg-pink-500/10': !isFavorito,
          'animate-elastic-bounce': isAnimating,
          'opacity-50 cursor-not-allowed': isLoading,
        }
      )}
      title={isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-label={isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart
        size={iconSizes[size]}
        className={clsx(
          'transition-all duration-300 flex-shrink-0 z-10',
          {
            'fill-pink-500 text-pink-500 scale-110': isFavorito,
            'fill-none text-current scale-100': !isFavorito,
          }
        )}
        aria-hidden="true"
      />

      {/* Partículas de coração ao redor durante animação */}
      {isAnimating && !isFavorito && (
        <>
          <span className="absolute -top-2 -left-2 text-pink-500 animate-float opacity-70 text-xs z-20">💖</span>
          <span className="absolute -top-2 -right-2 text-pink-500 animate-float opacity-70 text-xs z-20" style={{ animationDelay: '0.1s' }}>💖</span>
          <span className="absolute -bottom-2 -left-2 text-pink-500 animate-float opacity-70 text-xs z-20" style={{ animationDelay: '0.2s' }}>💖</span>
          <span className="absolute -bottom-2 -right-2 text-pink-500 animate-float opacity-70 text-xs z-20" style={{ animationDelay: '0.3s' }}>💖</span>
        </>
      )}
    </button>
  );
} 