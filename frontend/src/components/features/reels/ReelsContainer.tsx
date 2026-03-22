"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { ReelPlayer } from './ReelPlayer';
import { ParticleSystem } from './ParticleSystem';
import { useReels } from '@/hooks/useReels';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────
// @ux-design-expert (Uma) · ReelsContainer v2.0
// Features: Mastery High-Fidelity, Smooth Scroll Engine,
// Industrial Progress Matrix, Tactical Loading HUB.
// ─────────────────────────────────────────────────────────────────

export function ReelsContainer() {
  const { reels, currentIndex, nextReel, prevReel, loadMore, loading, goToReel } = useReels();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [particleTrigger, setParticleTrigger] = useState(false);
  const [particlePosition, setParticlePosition] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minSwipeDistance = 50;

  const registerView = useCallback(async (ofertaId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${API_URL}/ofertas/${ofertaId}/view`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error registering view:', error);
    }
  }, []);

  // Intersection Observer to detect current reel based on scroll position
  useEffect(() => {
    const options = {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.6, // 60% of the item must be visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(index) && index !== currentIndex) {
            goToReel(index);
          }
        }
      });
    }, options);

    const elements = containerRef.current?.querySelectorAll('[data-reel="true"]');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [reels.length, currentIndex, goToReel]);

  // Handle Wheel Scroll (Mouse Wheel)
  const onWheel = (e: React.WheelEvent) => {
    if (wheelTimeoutRef.current) return;

    if (Math.abs(e.deltaY) > 30) {
      if (e.deltaY > 0 && currentIndex < reels.length - 1) {
        nextReel();
        wheelTimeoutRef.current = setTimeout(() => { wheelTimeoutRef.current = null; }, 500);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        prevReel();
        wheelTimeoutRef.current = setTimeout(() => { wheelTimeoutRef.current = null; }, 500);
      }
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe && currentIndex < reels.length - 1) {
      setSwipeDirection('up');
      setParticlePosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setParticleTrigger(true);
      setTimeout(() => { setParticleTrigger(false); setSwipeDirection(null); }, 500);
      nextReel();
    } else if (isDownSwipe && currentIndex > 0) {
      setSwipeDirection('down');
      setParticlePosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setParticleTrigger(true);
      setTimeout(() => { setParticleTrigger(false); setSwipeDirection(null); }, 500);
      prevReel();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIndex < reels.length - 1) { e.preventDefault(); nextReel(); }
      else if (e.key === 'ArrowUp' && currentIndex > 0) { e.preventDefault(); prevReel(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reels.length, nextReel, prevReel]);

  useEffect(() => {
    if (containerRef.current) {
      const reelElement = containerRef.current.children[currentIndex] as HTMLElement;
      if (reelElement) {
        // Only scroll if not already there to avoid fight with intersection observer
        const rect = reelElement.getBoundingClientRect();
        if (Math.abs(rect.top) > 10) {
          reelElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex >= reels.length - 3) { loadMore(); }
  }, [currentIndex, reels.length, loadMore]);

  const currentReel = reels[currentIndex];
  if (!currentReel) return null;

  const progress = reels.length > 0 ? ((currentIndex + 1) / reels.length) * 100 : 0;

  return (
    <>
      {/* Tactical Position Indicator */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 z-[40] flex flex-col items-center gap-4">
        <span className="text-[8px] font-mono text-white/10 uppercase tracking-widest [writing-mode:vertical-lr]">Stream_Depth</span>
        <div className="w-[1px] h-48 bg-white/5 relative">
          <div
            className="absolute top-0 left-0 w-full bg-green-500 transition-all duration-700 ease-out"
            style={{ height: `${progress}%` }}
          />
          <div
            className="absolute -left-[5px] w-[11px] h-[1px] bg-white transition-all duration-700"
            style={{ top: `${progress}%` }}
          />
        </div>
        <span className="text-[9px] font-black text-green-500 italic">{(currentIndex + 1).toString().padStart(2, '0')}</span>
      </div>

      {/* High-Fidelity Loading state */}
      {loading && reels.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 animate-loading-bar" />
            </div>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Buffering_Matrix</span>
          </div>
        </div>
      )}

      <ParticleSystem trigger={particleTrigger} x={particlePosition.x} y={particlePosition.y} count={30} />

      {swipeDirection && (
        <div className={clsx("absolute inset-0 z-20 pointer-events-none transition-opacity duration-500", "bg-green-500/5")} />
      )}

      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            data-index={index}
            data-reel="true"
            className={clsx(
              "h-screen w-full snap-start snap-always flex-shrink-0 transition-opacity duration-700",
              index === currentIndex ? "relative z-10" : "z-0 opacity-40 grayscale-[0.5] scale-95"
            )}
            style={{ scrollSnapAlign: 'start' }}
          >
            <ReelPlayer oferta={reel} isActive={index === currentIndex} onView={() => registerView(reel.id)} />
          </div>
        ))}
      </div>

      <style jsx global>{`
         .hide-scrollbar::-webkit-scrollbar { display: none; }
         .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
         @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
         }
         .animate-loading-bar { animation: loading-bar 1.5s infinite linear; }
      `}</style>
    </>
  );
}
