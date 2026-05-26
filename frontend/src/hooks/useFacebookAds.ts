'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import nookies from 'nookies';

export interface AnuncioFacebook {
  id: string;
  fbAdId: string;
  pageName: string | null;
  pageProfilePic: string | null;
  pageLikes: number | null;
  adCopy: string | null;
  adHeadline: string | null;
  adSnapshotUrl: string | null;
  destinationUrl: string | null;
  publisherPlatforms: string | null;
  deliveryStartTime: string | null;
  deliveryStopTime: string | null;
  checkout: string | null;
  tecnologia: string | null;
  escala: number | null;
  duplicatas: number | null;
  landingScreenshot: string | null;
  isActive: boolean;
  createdAt: string;
  // Detalhes (apenas no endpoint /:id)
  libraryUrl?: string | null;
  urlscanUuid?: string | null;
  funnelSubdomains?: string | null;
  activePixels?: string | null;
  externalServices?: string | null;
  urlscanLastRun?: string | null;
  spendRange?: string | null;
  impressionsRange?: string | null;
  currency?: string | null;
}

export interface FbAdsMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FbAdsFilters {
  search?: string;
  checkout?: string;
  escalaMin?: number;
  duplicatasMin?: number;
  status?: 'active' | 'inactive' | 'all';
  orderBy?: 'createdAt' | 'escala' | 'duplicatas' | 'deliveryStartTime' | 'pageLikes';
  order?: 'asc' | 'desc';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useFacebookAds() {
  const [anuncios, setAnuncios] = useState<AnuncioFacebook[]>([]);
  const [meta, setMeta] = useState<FbAdsMeta>({ total: 0, page: 1, limit: 24, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FbAdsFilters>({ orderBy: 'createdAt', order: 'desc', status: 'active' });
  const [page, setPage] = useState(1);
  const abortRef = useRef<AbortController | null>(null);

  const buildParams = useCallback((f: FbAdsFilters, p: number) => {
    const params = new URLSearchParams();
    params.set('page', String(p));
    params.set('limit', '24');
    if (f.search) params.set('search', f.search);
    if (f.checkout) params.set('checkout', f.checkout);
    if (f.escalaMin !== undefined) params.set('escalaMin', String(f.escalaMin));
    if (f.duplicatasMin !== undefined) params.set('duplicatasMin', String(f.duplicatasMin));
    if (f.status && f.status !== 'all') params.set('status', f.status);
    if (f.orderBy) params.set('orderBy', f.orderBy);
    if (f.order) params.set('order', f.order);
    return params.toString();
  }, []);

  const fetchPage = useCallback(async (f: FbAdsFilters, p: number, append = false) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    if (!append) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);

    try {
      const cookies = nookies.get(null);
      const token = cookies['auth_token'] || null;
      const headers: HeadersInit = {};
      if (token && token !== 'undefined' && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/fb-ads?${buildParams(f, p)}`, {
        headers,
        credentials: 'include',
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const json = await res.json();

      setAnuncios(prev => append ? [...prev, ...json.data] : json.data);
      setMeta(json.meta);
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [buildParams]);

  useEffect(() => {
    setPage(1);
    fetchPage(filters, 1, false);
  }, [filters, fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || page >= meta.pages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(filters, nextPage, true);
  }, [isLoadingMore, page, meta.pages, filters, fetchPage]);

  const refetch = useCallback(() => {
    setPage(1);
    fetchPage(filters, 1, false);
  }, [filters, fetchPage]);

  const triggerFunnelScan = useCallback(async (id: string): Promise<void> => {
    const cookies = nookies.get(null);
    const token = cookies['auth_token'] || null;
    const headers: HeadersInit = {};
    if (token && token !== 'undefined' && token !== 'null') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/fb-ads/${id}/scan-funil`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Erro ao iniciar scan');
    }
  }, []);

  const fetchById = useCallback(async (id: string): Promise<AnuncioFacebook | null> => {
    const cookies = nookies.get(null);
    const token = cookies['auth_token'] || null;
    const headers: HeadersInit = {};
    if (token && token !== 'undefined' && token !== 'null') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/fb-ads/${id}?t=${Date.now()}`, {
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  }, []);

  const hasMore = page < meta.pages;

  return {
    anuncios, meta, isLoading, isLoadingMore, error,
    filters, setFilters,
    loadMore, refetch, hasMore,
    triggerFunnelScan, fetchById,
  };
}

// Helpers
export function calcDaysOnAir(startDate: string | null): number {
  if (!startDate) return 0;
  return Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000);
}

export function formatLikes(n: number | null): string {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function parseJsonField<T>(field: string | null | undefined): T[] {
  if (!field) return [];
  try { return JSON.parse(field) as T[]; } catch { return []; }
}
