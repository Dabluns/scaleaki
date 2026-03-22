"use client";

import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar tamanho do canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Partículas caindo
    interface Particle {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = [
      'rgba(34, 197, 94, 0.3)', // green
      'rgba(6, 182, 212, 0.3)', // cyan
      'rgba(139, 92, 246, 0.3)', // purple
      'rgba(236, 72, 153, 0.3)', // pink
    ];

    // Criar partículas iniciais
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Atualizar e desenhar partículas
      particles.forEach((particle, index) => {
        particle.y += particle.speed;
        if (particle.y > canvas.height) {
          particle.y = 0;
          particle.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace('0.3', String(particle.opacity));
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Orbs flutuantes */}
      <div className="absolute top-0 left-[20%] w-[800px] h-[800px] bg-green-500/15 rounded-full blur-[120px] animate-orb-float" style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-0 right-[20%] w-[700px] h-[700px] bg-green-500/15 rounded-full blur-[120px] animate-orb-float" style={{ animationDuration: '25s', animationDelay: '-5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[100px] animate-orb-float" style={{ animationDuration: '30s', animationDelay: '-10s' }} />
      <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[80px] animate-orb-float" style={{ animationDuration: '18s', animationDelay: '-7s' }} />

      {/* Grid pulsante */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" className="animate-grid-pulse">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Canvas para partículas caindo */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
}

