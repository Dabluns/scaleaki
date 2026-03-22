"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme, applyDensity, applyFontSize } from '@/lib/theme';

type Settings = {
  theme?: string;
  accentColor?: string;
  density?: string;
  fontSize?: string;
  language?: string;
  animationsEnabled?: boolean;
  defaultLayout?: 'grid' | 'list' | 'compact';
  itemsPerPage?: number;
  defaultSort?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showMetricsOnCard?: boolean;
  defaultStatus?: string[];
  preferredTipoOferta?: string[];
  preferredLanguages?: string[];
  preferredPlataformas?: string[];
  [key: string]: any; // Allow additional dynamic properties
};

type SettingsContextValue = {
  settings: Settings | null;
  setSettings: (s: Settings) => void;
  refresh: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const STORAGE_KEY = 'app:settings';

  function applyAnimations(enabled: boolean) {
    if (typeof document !== 'undefined') {
      if (enabled) {
        document.documentElement.classList.remove('no-animations');
      } else {
        document.documentElement.classList.add('no-animations');
      }
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/settings`, {
        credentials: 'include',
      });
      const json = await res.json();
      const s = json?.data || {};
      setSettingsState(s);
      applyTheme((s.theme as any) || 'auto', s.accentColor);
      applyDensity(s.density as any);
      applyFontSize(s.fontSize as any);
      applyAnimations((s as any).animationsEnabled !== false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch { }
    } catch {
      // Fallback para localStorage quando a API não estiver disponível
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const s = JSON.parse(cached);
          setSettingsState(s);
          applyTheme((s.theme as any) || 'auto', s.accentColor);
          applyDensity(s.density as any);
          applyFontSize(s.fontSize as any);
          applyAnimations((s as any).animationsEnabled !== false);
          return;
        }
      } catch { }
      setSettingsState({});
    }
  }

  useEffect(() => {
    // Carregar primeiro do localStorage para aplicação instantânea
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const s = JSON.parse(cached);
        setSettingsState(s);
        applyTheme((s.theme as any) || 'auto', s.accentColor);
        applyDensity(s.density as any);
        applyFontSize(s.fontSize as any);
        applyAnimations((s as any).animationsEnabled !== false);
      }
    } catch { }

    fetchSettings();
  }, []);

  const setSettings = (s: Settings) => {
    const next = { ...(settings || {}), ...s } as Settings;
    setSettingsState(next);
    applyTheme((next.theme as any) || 'auto', next.accentColor);
    applyDensity(next.density as any);
    applyFontSize(next.fontSize as any);
    applyAnimations((next as any).animationsEnabled !== false);
    // Aplicar idioma no <html lang> quando informado
    try {
      if (typeof document !== 'undefined' && (next as any).language) {
        const lang = (next as any).language.replace('_', '-');
        document.documentElement.setAttribute('lang', lang);
      }
    } catch { }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch { }
  };

  // Reagir a mudanças do sistema quando em modo 'auto'
  useEffect(() => {
    if (!settings || (settings as any).theme !== 'auto') return;
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('auto', (settings as any).accentColor);
    try {
      mql.addEventListener('change', handler);
    } catch {
      // Safari antigo
      // @ts-ignore
      mql.addListener(handler);
    }
    return () => {
      try {
        mql.removeEventListener('change', handler);
      } catch {
        // @ts-ignore
        mql.removeListener(handler);
      }
    };
  }, [settings]);

  // Garantir que o atributo lang esteja sincronizado ao iniciar e quando as settings carregarem
  useEffect(() => {
    if (!settings) return;
    try {
      if (typeof document !== 'undefined' && (settings as any).language) {
        const lang = ((settings as any).language as string).replace('_', '-');
        document.documentElement.setAttribute('lang', lang);
      }
    } catch { }
  }, [settings?.language]);

  const value: SettingsContextValue = {
    settings,
    setSettings,
    refresh: fetchSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings deve ser usado dentro de SettingsProvider');
  return ctx;
}


