"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import nookies from 'nookies';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator' | 'user';
  plan: 'free' | 'mensal' | 'trimestral' | 'anual';
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
        setAdmin(userData?.role === 'admin' || userData?.role === 'moderator');
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    // ─── Retry automático para o cold start do Render Free ───────────────────
    // O backend "dorme" após inatividade. Na primeira tentativa pode falhar com
    // "Failed to fetch". Tentamos até 3 vezes silenciosamente com backoff.
    const MAX_RETRIES = 3;
    const RETRY_DELAYS_MS = [1500, 3000, 5000]; // 1.5s, 3s, 5s

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        // Timeout maior nas tentativas seguintes (servidor pode estar acordando)
        const timeoutMs = attempt === 1 ? 10000 : 15000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // ── Resposta recebida (servidor está up) ──
        if (response.ok) {
          const data = await response.json();
          const token = data?.data?.token;

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
        }

        // ── Erro de credenciais (401, 403) — não retenta ──
        if (response.status === 401 || response.status === 403 || response.status === 400) {
          const error = await response.json().catch(() => ({ error: 'Credenciais inválidas' }));
          return { success: false, error: error.error || 'Email ou senha incorretos' };
        }

        // ── Erro do servidor (5xx) — retenta ──
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
          continue;
        }

        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        return { success: false, error: error.error || 'Erro ao fazer login' };

      } catch (error) {
        const isNetworkError = (
          error instanceof TypeError && (
            error.message.includes('Failed to fetch') ||
            error.message.includes('fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('network')
          )
        );
        const isTimeout = error instanceof Error && error.name === 'AbortError';

        // ── Erro de rede ou timeout: retenta silenciosamente ──
        if ((isNetworkError || isTimeout) && attempt < MAX_RETRIES) {
          // Não mostrar erro — simplesmente aguardar e tentar de novo
          await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
          continue;
        }

        // ── Esgotou todas as tentativas ──
        if (isNetworkError || isTimeout) {
          return {
            success: false,
            error: 'Servidor indisponível no momento. Tente novamente em alguns segundos.',
          };
        }

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao fazer login',
        };
      }
    }

    // Fallback de segurança (nunca deve chegar aqui)
    return { success: false, error: 'Erro inesperado. Tente novamente.' };
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