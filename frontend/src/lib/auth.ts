import nookies from 'nookies';
import { GetServerSidePropsContext } from 'next';

const TOKEN_KEY = 'auth_token';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
};

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Erro ao fazer login');
  }
  nookies.set(null, TOKEN_KEY, data.data.token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: true,
    sameSite: 'lax',
    httpOnly: false
  });
  return data.data.user as User;
}

export function logout(ctx?: GetServerSidePropsContext) {
  nookies.destroy(ctx || null, TOKEN_KEY, { path: '/' });
}

export function getToken(ctx?: GetServerSidePropsContext): string | null {
  const cookies = nookies.get(ctx || null);
  return cookies[TOKEN_KEY] || null;
}

export async function getMe(ctx?: GetServerSidePropsContext): Promise<User | null> {
  const token = getToken(ctx);
  if (!token) return null;
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.success ? data.data as User : null;
} 