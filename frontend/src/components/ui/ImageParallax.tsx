'use client';

import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface ImageParallaxProps {
  src: string;
  alt: string;
  className?: string;
  intensity?: number; // Intensidade do efeito parallax (0-1)
  onError?: () => void;
}

export const ImageParallax: React.FC<ImageParallaxProps> = ({
  src,
  alt,
  className,
  intensity = 0.3,
  onError,
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const x = (e.clientX - centerX) / rect.width;
      const y = (e.clientY - centerY) / rect.height;
      
      setOffset({
        x: x * intensity * 20, // Máximo de 20px de movimento
        y: y * intensity * 20,
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => setOffset({ x: 0, y: 0 }));
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [intensity]);

  return (
    <div
      ref={containerRef}
      className={clsx('relative overflow-hidden', className)}
      style={{ perspective: '1000px' }}
    >
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(1.05)`,
          }}
          onError={() => {
            setHasError(true);
            onError?.();
          }}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface-secondary">
          <div className="text-4xl">💰</div>
        </div>
      )}
    </div>
  );
};

