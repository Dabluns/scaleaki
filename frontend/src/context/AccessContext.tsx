"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { AccessResponse, FeatureKey, FeatureAccess, fetchAccess } from '../lib/access';

type AccessState = {
  access: AccessResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
  can: (feature: FeatureKey) => FeatureAccess;
};

const FALLBACK: FeatureAccess = { allowed: false, limit: 0, upsell: 'Recurso indisponível.' };

const AccessContext = createContext<AccessState | undefined>(undefined);

export function AccessProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<AccessResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await fetchAccess();
    setAccess(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const can = useCallback(
    (feature: FeatureKey): FeatureAccess => access?.features?.[feature] ?? FALLBACK,
    [access]
  );

  return (
    <AccessContext.Provider value={{ access, loading, refresh, can }}>
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess(): AccessState {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error('useAccess deve ser usado dentro de <AccessProvider>');
  return ctx;
}
