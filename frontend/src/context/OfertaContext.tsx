"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { Oferta } from '@/types/oferta';

interface DashboardData {
  ofertasDestaque: Oferta[];
  estatisticas: any;
  executionTime: number;
}

interface OfertaContextType {
  ofertas: Oferta[];
  loading: boolean;
  erro: string;
  dashboardData: DashboardData | null;
  dashboardLoading: boolean;
  fetchOfertas: (params?: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'roi' | 'ctr' | 'receita';
    sortOrder?: 'asc' | 'desc';
    search?: string;
    plataforma?: string;
    tipoOferta?: string;
    nichoId?: string;
    linguagem?: string;
    signal?: AbortSignal;
  }) => Promise<void>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  fetchDashboardData: () => Promise<void>;
  criarOferta: (oferta: Omit<Oferta, 'id'>) => Promise<boolean>;
  editarOferta: (oferta: Oferta) => Promise<boolean>;
  removerOferta: (id: string) => Promise<boolean>;
}

const OfertaContext = createContext<OfertaContextType | undefined>(undefined);

export function OfertaProvider({ children }: { children: ReactNode }) {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const initializedRef = useRef(false);
  const inFlightRef = useRef(false);

  const fetchOfertas = useCallback(async (params?: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'roi' | 'ctr' | 'receita';
    sortOrder?: 'asc' | 'desc';
    search?: string;
    plataforma?: string;
    tipoOferta?: string;
    nichoId?: string;
    linguagem?: string;
    signal?: AbortSignal;
  }) => {
    if (inFlightRef.current) return; // Evita múltiplas chamadas simultâneas
    inFlightRef.current = true;
    setLoading(true);
    setErro('');
    try {
      const qs = new URLSearchParams();
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.sortBy) qs.set('sortBy', params.sortBy);
      if (params?.sortOrder) qs.set('sortOrder', params.sortOrder);
      if (params?.search) qs.set('search', params.search);
      if (params?.plataforma) qs.set('plataforma', params.plataforma);
      if (params?.tipoOferta) qs.set('tipoOferta', params.tipoOferta);
      if (params?.nichoId) qs.set('nichoId', params.nichoId);
      if (params?.linguagem) qs.set('linguagem', params.linguagem);

      const res = await fetch(`/api/ofertas${qs.toString() ? `?${qs.toString()}` : ''}`, { signal: params?.signal });
      const data = await res.json();
      if (res.ok) {
        // Normalização robusta de formatos possíveis
        // 1) [ ... ]
        if (Array.isArray(data)) {
          setOfertas(data);
          setPagination(null);
        // 2) { data: [ ... ], pagination }
        } else if (Array.isArray(data?.data) && data?.pagination) {
          setOfertas(data.data);
          setPagination(data.pagination);
        // 3) { success, data: { data: [ ... ], pagination } }
        } else if (Array.isArray(data?.data?.data) && data?.data?.pagination) {
          setOfertas(data.data.data);
          setPagination(data.data.pagination);
        // 4) { success, data: [ ... ] }
        } else if (Array.isArray(data?.data)) {
          setOfertas(data.data);
          setPagination(null);
        } else {
          setOfertas([]);
          setPagination(null);
        }
      } else {
        setErro(data.error || 'Erro ao carregar ofertas');
      }
    } catch (error) {
      setErro('Erro ao carregar ofertas');
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  const criarOferta = useCallback(async (oferta: Omit<Oferta, 'id'>) => {
    setErro('');
    console.log('Tentando criar oferta:', oferta);
    try {
      const res = await fetch('/api/ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oferta),
        credentials: 'include' // Incluir cookies na requisição
      });
      console.log('Resposta da API:', res.status, res.statusText);
      const data = await res.json();
      console.log('Dados da resposta:', data);
      if (res.ok) {
        console.log('Oferta criada com sucesso');
        await fetchOfertas();
        return true;
      } else {
        console.error('Erro ao criar oferta:', data.error);
        setErro(data.error || 'Erro ao criar oferta');
        return false;
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setErro('Erro ao criar oferta');
      return false;
    }
  }, [fetchOfertas]);

  const editarOferta = useCallback(async (oferta: Oferta) => {
    setErro('');
    try {
      const res = await fetch('/api/ofertas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oferta),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchOfertas();
        return true;
      } else {
        setErro(data.error || 'Erro ao editar oferta');
        return false;
      }
    } catch (error) {
      setErro('Erro ao editar oferta');
      return false;
    }
  }, [fetchOfertas]);

  const removerOferta = useCallback(async (id: string) => {
    setErro('');
    console.log('Tentando remover oferta com ID:', id);
    try {
      const res = await fetch('/api/ofertas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include' // Incluir cookies na requisição
      });
      console.log('Resposta da API (DELETE):', res.status, res.statusText);
      const data = await res.json();
      console.log('Dados da resposta (DELETE):', data);
      if (res.ok) {
        console.log('Oferta removida com sucesso');
        await fetchOfertas();
        return true;
      } else {
        console.error('Erro ao remover oferta:', data.error);
        setErro(data.error || 'Erro ao remover oferta');
        return false;
      }
    } catch (error) {
      console.error('Erro na requisição DELETE:', error);
      setErro('Erro ao remover oferta');
      return false;
    }
  }, [fetchOfertas]);

  const fetchDashboardData = useCallback(async () => {
    if (dashboardLoading) return;
    setDashboardLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/ofertas/dashboard/data');
      const data = await res.json();
      if (res.ok) {
        setDashboardData(data.data);
      } else {
        setErro(data.error || 'Erro ao carregar dados do dashboard');
      }
    } catch (error) {
      setErro('Erro ao carregar dados do dashboard');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      // Usar setTimeout para evitar problemas de renderização
      setTimeout(() => {
        fetchOfertas();
      }, 0);
    }
  }, []);

  // Usar useMemo para evitar recriação do valor do contexto
  const contextValue = useMemo(() => ({
    ofertas,
    loading,
    erro,
    dashboardData,
    dashboardLoading,
    fetchOfertas,
    criarOferta,
    editarOferta,
    removerOferta,
    fetchDashboardData
  }), [ofertas, loading, erro, dashboardData, dashboardLoading]);

  return (
    <OfertaContext.Provider value={contextValue}>
      {children}
    </OfertaContext.Provider>
  );
}

export function useOfertaContext() {
  const ctx = useContext(OfertaContext);
  if (!ctx) throw new Error('useOfertaContext deve ser usado dentro de OfertaProvider');
  return ctx;
}

export { OfertaContext }; 