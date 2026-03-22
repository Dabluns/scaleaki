import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Chave para armazenar o banner (poderia ser expandido para usar banco de dados)
const BANNER_STORAGE_KEY = 'home_banner_image_url';

async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    if (!token) return false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeout);
    if (!res || !res.ok) return false;
    const data = await res.json().catch(() => null);
    return Boolean(data && data.data && data.data.role === 'admin');
  } catch {
    return false;
  }
}

// GET - Buscar URL do banner (público)
export async function GET() {
  try {
    // Por enquanto, vamos usar uma solução simples com localStorage no frontend
    // Em produção, isso deveria ser armazenado no banco de dados
    // Retornamos null para que o frontend gerencie via localStorage
    // ou podemos criar uma tabela no banco para isso
    
    // Por enquanto, retornamos uma resposta vazia
    // O frontend vai gerenciar via localStorage
    return NextResponse.json({ url: null });
  } catch (error) {
    console.error('Erro ao buscar banner:', error);
    return NextResponse.json({ error: 'Erro ao buscar banner' }, { status: 500 });
  }
}

// POST - Salvar URL do banner (apenas admin)
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    // Por enquanto, vamos retornar sucesso
    // O frontend vai gerenciar via localStorage
    // Em produção, isso deveria ser salvo no banco de dados
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Erro ao salvar banner:', error);
    return NextResponse.json({ error: 'Erro ao salvar banner' }, { status: 500 });
  }
}

// DELETE - Remover banner (apenas admin)
export async function DELETE() {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Por enquanto, vamos retornar sucesso
    // O frontend vai gerenciar via localStorage
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover banner:', error);
    return NextResponse.json({ error: 'Erro ao remover banner' }, { status: 500 });
  }
}

