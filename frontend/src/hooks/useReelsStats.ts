"use client";

import { useState, useEffect, useRef } from 'react';

interface ReelsStats {
  total: number;
  hasNew: boolean;
  firstReelPreview?: {
    id: string;
    imagem?: string;
    titulo: string;
  };
}

export function useReelsStats() {
  const [stats, setStats] = useState<ReelsStats>({ total: 0, hasNew: false });
  const [loading, setLoading] = useState(true);
  const retryCount = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        // Usar proxy do Next.js para evitar CORS e problemas de rede
        const response = await fetch('/api/ofertas/reels?page=1&limit=1', {
          credentials: 'include',
          signal: AbortSignal.timeout(8000), // timeout de 8s
        });

        // Reset retry counter on any response
        retryCount.current = 0;

        if (!response.ok) {
          // 429 (rate limited) ou outros erros — silenciar, tentar novamente na próxima
          return;
        }

        const result = await response.json();
        if (cancelled) return;

        if (result.success && result.data) {
          const { data, pagination } = result.data;
          const firstReel = data[0];

          const hasNew = firstReel ? (() => {
            const createdAt = new Date(firstReel.createdAt);
            const now = new Date();
            const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            return diffHours < 24;
          })() : false;

          setStats({
            total: pagination?.total || 0,
            hasNew,
            firstReelPreview: firstReel ? {
              id: firstReel.id,
              imagem: firstReel.imagem,
              titulo: firstReel.titulo,
            } : undefined,
          });
        }
      } catch {
        // Network errors (Failed to fetch, timeout, etc.) — silenciar
        retryCount.current++;
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStats();
    // Poll a cada 60s (antes era 30s — reduzi para evitar rate limiting)
    const interval = setInterval(fetchStats, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { stats, loading };
}
