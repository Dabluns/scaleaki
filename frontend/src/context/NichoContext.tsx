"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';

export interface Nicho {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  icone: string;
  cor: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface NichoContextType {
  nichos: Nicho[];
  loading: boolean;
  erro: string;
  fetchNichos: () => Promise<void>;
  addNicho: (nicho: Omit<Nicho, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  editNicho: (nicho: Nicho) => Promise<boolean>;
  removeNicho: (id: string) => Promise<boolean>;
}

const NichoContext = createContext<NichoContextType | undefined>(undefined);

export function NichoProvider({ children }: { children: ReactNode }) {
  const [nichos, setNichos] = useState<Nicho[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const initializedRef = useRef(false);

  const fetchNichos = useCallback(async () => {
    if (loading) return; // Evita múltiplas chamadas simultâneas
    setLoading(true); 
    setErro('');
    try {
      const res = await fetch('/api/nichos', {
        credentials: 'include', // Garante que o cookie será enviado
      });
      const data = await res.json();
      if (res.ok) {
        // A API retorna { success: true, data: nichos }
        setNichos(Array.isArray(data) ? data : (data.data || []));
      } else {
        setErro(data.error || 'Erro ao carregar nichos');
      }
    } catch (error) {
      console.error('Erro ao carregar nichos:', error);
      setErro('Erro ao carregar nichos');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const addNicho = useCallback(async (nicho: Omit<Nicho, 'id' | 'createdAt' | 'updatedAt'>) => {
    setErro('');
    try {
      const res = await fetch('/api/nichos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Garante que o cookie será enviado
        body: JSON.stringify(nicho),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchNichos();
        return true;
      } else {
        setErro(data.error || 'Erro ao adicionar nicho');
        return false;
      }
    } catch (error) {
      console.error('Erro ao adicionar nicho:', error);
      setErro('Erro ao adicionar nicho');
      return false;
    }
  }, [fetchNichos]);

  const editNicho = useCallback(async (nicho: Nicho) => {
    setErro('');
    try {
      const res = await fetch('/api/nichos', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Garante que o cookie será enviado
        body: JSON.stringify(nicho),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchNichos();
        return true;
      } else {
        setErro(data.error || 'Erro ao editar nicho');
        return false;
      }
    } catch (error) {
      console.error('Erro ao editar nicho:', error);
      setErro('Erro ao editar nicho');
      return false;
    }
  }, [fetchNichos]);

  const removeNicho = useCallback(async (id: string) => {
    setErro('');
    try {
      const res = await fetch('/api/nichos', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Garante que o cookie será enviado
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchNichos();
        return true;
      } else {
        setErro(data.error || 'Erro ao remover nicho');
        return false;
      }
    } catch (error) {
      console.error('Erro ao remover nicho:', error);
      setErro('Erro ao remover nicho');
      return false;
    }
  }, [fetchNichos]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      // Usar setTimeout para evitar problemas de renderização
      setTimeout(() => {
        fetchNichos();
      }, 0);
    }
  }, [fetchNichos]);

  // Usar useMemo para evitar recriação do valor do contexto
  const contextValue = useMemo(() => ({
    nichos,
    loading,
    erro,
    fetchNichos,
    addNicho,
    editNicho,
    removeNicho
  }), [nichos, loading, erro, fetchNichos, addNicho, editNicho, removeNicho]);

  return (
    <NichoContext.Provider value={contextValue}>
      {children}
    </NichoContext.Provider>
  );
}

export function useNichos() {
  const ctx = useContext(NichoContext);
  if (!ctx) throw new Error('useNichos deve ser usado dentro de NichoProvider');
  return ctx;
}

export { NichoContext }; 