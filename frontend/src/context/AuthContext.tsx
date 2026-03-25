"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import nookies from 'nookies';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setAdmin] = useState(false);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 segundos
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const cookies = nookies.get(null);
      const localToken = cookies['auth_token'] || '';
      
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
        headers: localToken ? { 'Authorization': `Bearer ${localToken}` } : {},
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const userData = data.data || data;
        setUser(userData);
        setAdmin(userData?.role === 'admin');
      } else {
        // Não autenticado - comportamento normal
        setUser(null);
        setAdmin(false);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Silenciar erros de rede esperados (backend offline, CORS, etc.)
      // Não logar como erro crítico se for apenas um problema de conexão
      if (error instanceof TypeError && (
        error.message.includes('fetch') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      )) {
        // Backend provavelmente offline ou erro de rede
        // Silenciar - não é um erro crítico da aplicação
      } else if (error instanceof Error && error.name === 'AbortError') {
        // Timeout - backend não respondeu a tempo
      } else {
        // Outros erros podem ser logados apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.warn('Erro ao verificar autenticação:', error instanceof Error ? error.message : String(error));
        }
      }
      setUser(null);
      setAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      // Verificar se o backend está acessível antes de tentar login
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout de 10 segundos
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Garante que o cookie será recebido
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const token = data?.data?.token;
        
        // Salvar o token como cookie no domínio do frontend (Vercel)
        // para que o middleware consiga enxergá-lo
        if (token) {
          nookies.set(null, 'auth_token', token, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 dias
            secure: true,
            sameSite: 'lax',
          });
        }
        
        await checkAuth();
        return { success: true };
      } else {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        return { success: false, error: error.error || 'Erro ao fazer login' };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      
      // Mensagens de erro mais específicas
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 4000.' 
        };
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        return { 
          success: false, 
          error: 'Tempo de espera esgotado. O servidor não respondeu a tempo.' 
        };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao fazer login' 
      };
    }
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar estado local
      setUser(null);
      setAdmin(false);
      
      // Limpar cookie do domínio do frontend
      nookies.destroy(null, 'auth_token', { path: '/' });
      
      // Limpar storage (caso tenha algum token antigo)
      try {
        if (typeof window !== 'undefined') {
          const { storage } = await import('@/lib/storage');
          storage.removeAuthToken();
        }
      } catch (e) {
        // Ignorar erros ao limpar storage
      }
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Usar useMemo para evitar recriação do valor do contexto
  const contextValue = useMemo(() => ({
    user,
    loading,
    isAdmin,
    login,
    logout,
    checkAuth
  }), [user, loading, isAdmin, login, logout, checkAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

export { AuthContext }; 