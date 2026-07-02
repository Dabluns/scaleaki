'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { login, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await login({ email, password });
      setToken(token);
      router.push('/dashboard');
      router.refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
          <h1 className="font-display font-black text-3xl mt-6 mb-2">Entrar na ScaleAki</h1>
          <p className="text-muted text-sm">Acesse suas ofertas escaladas</p>
        </div>

        <form onSubmit={onSubmit} className="glass rounded-lg p-7 space-y-5 animate-fade-up">
          {error && (
            <div className="px-4 py-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">Senha</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-sm text-muted">
            Não tem conta?{' '}
            <Link href="/register" className="text-primary-400 hover:text-primary-300">
              Criar agora
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-muted mt-6">
          API: <code className="text-primary-300">{process.env.NEXT_PUBLIC_API_URL}</code>
        </p>
      </div>
    </main>
  );
}