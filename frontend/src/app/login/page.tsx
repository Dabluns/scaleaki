'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────
// A página de login unificada já existe na rota principal (/).
// Esta rota apenas redireciona para lá, garantindo consistência
// visual com o design cyberpunk e a animação FallingPattern.
// ─────────────────────────────────────────────────────────────────

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página principal com o formulário de login ativo
    router.replace('/?mode=login');
  }, [router]);

  return null;
}