"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Oferta } from '@/types/oferta';
import { Nicho } from '@/types/nicho';

interface SearchContextType {
  // Busca de ofertas (Header)
  ofertasSearchTerm: string;
  setOfertasSearchTerm: (term: string) => void;
  filteredOfertas: Oferta[];
  ofertasSearchLoading: boolean;

  // Busca de nichos (Sidebar)
  nichosSearchTerm: string;
  setNichosSearchTerm: (term: string) => void;
  filteredNichos: Nicho[];
  nichosSearchLoading: boolean;

  // Funções de busca
  searchOfertas: (term: string) => Promise<Oferta[]>;
  searchNichos: (term: string) => Promise<Nicho[]>;

  // Estado de busca ativa
  isSearchingOfertas: boolean;
  isSearchingNichos: boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [ofertasSearchTerm, setOfertasSearchTerm] = useState('');
  const [nichosSearchTerm, setNichosSearchTerm] = useState('');
  const [filteredOfertas, setFilteredOfertas] = useState<Oferta[]>([]);
  const [filteredNichos, setFilteredNichos] = useState<Nicho[]>([]);
  const [ofertasSearchLoading, setOfertasSearchLoading] = useState(false);
  const [nichosSearchLoading, setNichosSearchLoading] = useState(false);
  const [isSearchingOfertas, setIsSearchingOfertas] = useState(false);
  const [isSearchingNichos, setIsSearchingNichos] = useState(false);

  // Buscar ofertas
  const searchOfertas = useCallback(async (term: string): Promise<Oferta[]> => {
    if (!term.trim()) {
      setFilteredOfertas([]);
      return [];
    }

    setOfertasSearchLoading(true);
    try {
      const response = await fetch(`/api/ofertas?search=${encodeURIComponent(term)}&limit=10`);
      const data = await response.json();

      if (response.ok) {
        let ofertas: Oferta[] = [];
        // Normalização de payloads aninhados
        if (Array.isArray(data)) {
          ofertas = data;
        } else if (Array.isArray(data?.data)) {
          ofertas = data.data;
        } else if (Array.isArray(data?.data?.data)) {
          ofertas = data.data.data;
        }

        setFilteredOfertas(ofertas);
        return ofertas;
      } else {
        console.error('Erro na busca de ofertas:', data.error);
        setFilteredOfertas([]);
        return [];
      }
    } catch (error) {
      console.error('Erro na busca de ofertas:', error);
      setFilteredOfertas([]);
      return [];
    } finally {
      setOfertasSearchLoading(false);
    }
  }, []);

  // Buscar nichos
  const searchNichos = useCallback(async (term: string): Promise<Nicho[]> => {
    function rankAndFilterNichos(q: string, list: Nicho[]): Nicho[] {
      const query = normalizeText(q.trim());
      if (!query) return [];
      const keywords = query.split(/\s+/).filter(Boolean);

      const scored = list.map((n) => {
        const hayNome = normalizeText(`${n.nome || ''}`);
        const hay = normalizeText(`${n.nome || ''} ${n.descricao || ''} ${n.slug || ''}`);
        const allKeywordsPresent = keywords.every((k) => hay.includes(k));
        if (!allKeywordsPresent) return { nicho: n, score: -1 };

        let score = 0;
        if (hayNome.includes(query)) score += 8; // peso maior para nome
        if (hay.includes(query)) score += 3;
        for (const k of keywords) {
          if (hayNome.includes(k)) score += 3;
          if (hay.includes(k)) score += 1;
        }
        // leve bônus se slug casa diretamente
        if ((n.slug || '').toLowerCase().includes(query)) score += 2;
        return { nicho: n, score };
      }).filter((x) => x.score >= 0);

      scored.sort((a, b) => b.score - a.score);
      return scored.map((s) => s.nicho);
    }

    if (!term.trim()) {
      setFilteredNichos([]);
      return [];
    }

    setNichosSearchLoading(true);
    try {
      const response = await fetch(`/api/nichos?search=${encodeURIComponent(term)}`);
      const data = await response.json();

      if (response.ok) {
        const nichos = Array.isArray(data) ? data : (data.data || []);
        const ranked = rankAndFilterNichos(term, nichos);
        setFilteredNichos(ranked);
        return ranked;
      } else {
        console.error('Erro na busca de nichos:', data.error);
        setFilteredNichos([]);
        return [];
      }
    } catch (error) {
      console.error('Erro na busca de nichos:', error);
      setFilteredNichos([]);
      return [];
    } finally {
      setNichosSearchLoading(false);
    }
  }, []);

  // Debounced search para ofertas
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (ofertasSearchTerm.trim()) {
        setIsSearchingOfertas(true);
        searchOfertas(ofertasSearchTerm).finally(() => {
          setIsSearchingOfertas(false);
        });
      } else {
        setFilteredOfertas([]);
        setIsSearchingOfertas(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [ofertasSearchTerm, searchOfertas]);

  // Debounced search para nichos
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (nichosSearchTerm.trim()) {
        setIsSearchingNichos(true);
        searchNichos(nichosSearchTerm).finally(() => {
          setIsSearchingNichos(false);
        });
      } else {
        setFilteredNichos([]);
        setIsSearchingNichos(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [nichosSearchTerm, searchNichos]);

  const value: SearchContextType = {
    ofertasSearchTerm,
    setOfertasSearchTerm,
    filteredOfertas,
    ofertasSearchLoading,
    nichosSearchTerm,
    setNichosSearchTerm,
    filteredNichos,
    nichosSearchLoading,
    searchOfertas,
    searchNichos,
    isSearchingOfertas,
    isSearchingNichos,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
} 