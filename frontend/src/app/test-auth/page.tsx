'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export default function TestAuthPage() {
  const { user, loading, isAdmin } = useAuth();
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    setCookies(document.cookie);
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Autenticação</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Status de Loading:</h2>
          <p className="text-gray-600">{loading ? 'Carregando...' : 'Carregado'}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Usuário:</h2>
          {user ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Nome:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>É Admin:</strong> {isAdmin ? 'Sim' : 'Não'}</p>
              <p><strong>Ativo:</strong> {user.isActive ? 'Sim' : 'Não'}</p>
            </div>
          ) : (
            <p className="text-red-500">Não logado</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Cookies:</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {cookies || 'Nenhum cookie encontrado'}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Credenciais para Login:</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> admin@scaleaki.com</p>
            <p><strong>Senha:</strong> AdminScaleaki!2024</p>
          </div>
        </div>
      </div>
    </div>
  );
} 