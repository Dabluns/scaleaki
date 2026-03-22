"use client";

import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FullPageLoader } from '@/components/ui/FullPageLoader';
import { Shield, Lock } from 'lucide-react';

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <FullPageLoader message="Validando Acesso" submessage="Verificando nível de autorização" />;
  }

  if (!isAdmin) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Você não tem permissão para acessar esta área. Apenas administradores podem gerenciar o sistema.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Lock className="w-4 h-4" />
            <span>Área Restrita</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 