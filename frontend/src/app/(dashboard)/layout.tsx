"use client";

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FullPageLoader } from '@/components/ui/FullPageLoader';

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/?mode=login');
    }
  }, [loading, user, router]);

  if (loading) {
    return <FullPageLoader message="Verificando Identidade" submessage="Acessando rede segura" />;
  }

  if (!user) {
    return <FullPageLoader message="Acesso Restrito" submessage="Redirecionando para autenticação..." />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}