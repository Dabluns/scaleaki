'use client';

import { useState, useEffect, useRef } from 'react';

interface UseCounterOptions {
  duration?: number;
  startOnMount?: boolean;
  easing?: (t: number) => number;
}

/**
 * Hook para animar contagem de números de 0 até o valor final
 * @param end - Valor final para contar
 * @param options - Opções de configuração
 * @returns Valor animado atual
 */
export const useCounter = (end: number, options: UseCounterOptions = {}) => {
  const {
    duration = 2000,
    startOnMount = true,
    easing = (t: number) => t * (2 - t), // ease-out
  } = options;

  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  const animate = (start: number, target: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
      startValueRef.current = start;
    }

    const animateFrame = (currentTime: number) => {
      if (startTimeRef.current === null) return;

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easing(progress);

      const current = Math.floor(startValueRef.current + (target - startValueRef.current) * eased);
      setCount(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateFrame);
      } else {
        setCount(target);
        setIsAnimating(false);
        startTimeRef.current = null;
      }
    };

    setIsAnimating(true);
    animationFrameRef.current = requestAnimationFrame(animateFrame);
  };

  useEffect(() => {
    if (startOnMount && end > 0) {
      animate(0, end);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [end, startOnMount, duration]);

  const reset = (newEnd?: number) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    startTimeRef.current = null;
    setCount(0);
    setIsAnimating(false);
    
    if (newEnd !== undefined && newEnd > 0) {
      setTimeout(() => animate(0, newEnd), 50);
    }
  };

  return { count, isAnimating, reset };
};

