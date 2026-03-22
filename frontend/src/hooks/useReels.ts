"use client";

import { useState, useEffect, useCallback } from 'react';
import { Oferta } from '@/types/oferta';

interface ReelsResponse {
  data: Oferta[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function useReels() {
  const [reels, setReels] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pagination, setPagination] = useState<ReelsResponse['pagination'] | null>(null);
  const [page, setPage] = useState(1);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchReels = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/ofertas/reels?page=${pageNum}&limit=20`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar reels');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const { data, pagination: pag } = result.data;
        
        if (append) {
          setReels(prev => [...prev, ...data]);
        } else {
          setReels(data);
          setCurrentIndex(0);
        }
        
        setPagination(pag);
        setPage(pageNum);
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Error fetching reels:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchReels(1, false);
  }, [fetchReels]);

  const loadMore = useCallback(() => {
    if (pagination?.hasNext && !loading) {
      fetchReels(page + 1, true);
    }
  }, [pagination, loading, page, fetchReels]);

  const nextReel = useCallback(() => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
      
      // Carregar mais reels quando estiver próximo do fim
      if (currentIndex >= reels.length - 3 && pagination?.hasNext) {
        loadMore();
      }
    }
  }, [currentIndex, reels.length, pagination, loadMore]);

  const prevReel = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const goToReel = useCallback((index: number) => {
    if (index >= 0 && index < reels.length) {
      setCurrentIndex(index);
    }
  }, [reels.length]);

  const currentReel = reels[currentIndex] || null;

  return {
    reels,
    currentReel,
    currentIndex,
    loading,
    error,
    pagination,
    nextReel,
    prevReel,
    goToReel,
    loadMore,
    refresh: () => fetchReels(1, false),
  };
}

