import axios, { AxiosError } from 'axios';
import nookies from 'nookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.scaleaki.site';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Auth interceptor
api.interceptors.request.use((config) => {
  const cookies = nookies.get(null);
  if (cookies.scaleaki_token) {
    config.headers.Authorization = `Bearer ${cookies.scaleaki_token}`;
  }
  return config;
});

// Response interceptor — auto signout on 401
api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      nookies.destroy(null, 'scaleaki_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────
export interface LoginInput { email: string; password: string; }
export interface RegisterInput { name: string; email: string; password: string; }
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator' | 'user';
  plan: 'free' | 'mensal' | 'trimestral' | 'anual';
  tier: 'free' | 'basico' | 'plus';
  isActive: boolean;
  emailConfirmed: boolean;
}

export async function login(input: LoginInput): Promise<{ token: string; user: AuthUser }> {
  const { data } = await api.post('/auth/login', input);
  return { token: data.data.token, user: data.data.user };
}

export async function register(input: RegisterInput): Promise<{ token: string; user: AuthUser }> {
  const { data } = await api.post('/auth/register', input);
  return { token: data.data.token, user: data.data.user };
}

export async function me(): Promise<AuthUser> {
  const { data } = await api.get('/auth/me');
  return data.data;
}

export function setToken(token: string) {
  nookies.set(null, 'scaleaki_token', token, {
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

export function clearToken() {
  nookies.destroy(null, 'scaleaki_token');
}

export function getToken(): string | null {
  return nookies.get(null).scaleaki_token || null;
}

// ── Ofertas / Nichos ────────────────────────────────────────────────
export interface Nicho {
  id: string;
  slug: string;
  name: string;
  icon?: string;
  count?: number;
}

export async function getNichos(): Promise<Nicho[]> {
  const { data } = await api.get('/nichos');
  return data.data || data;
}

export interface Oferta {
  id: string;
  titulo: string;
  nicho: string;
  url?: string;
  thumbnail?: string;
  tempo_veiculacao?: number;
  vsl_descricao?: string;
  createdAt: string;
}

export async function getOfertas(nicho?: string): Promise<Oferta[]> {
  const { data } = await api.get('/ofertas', { params: nicho ? { nicho } : {} });
  return data.data || data;
}