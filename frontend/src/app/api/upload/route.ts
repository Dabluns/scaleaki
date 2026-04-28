import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function isAuthenticated(): Promise<{ isAuth: boolean; isAdmin: boolean }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Falha rápida se não houver token
    if (!token) return { isAuth: false, isAdmin: false };

    // Checagem com timeout curto para evitar travas
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
    if (!res || !res.ok) return { isAuth: false, isAdmin: false };
    const data = await res.json().catch(() => null);
    const isAdmin = Boolean(data && data.data && data.data.role === 'admin');
    const isAuth = Boolean(data && data.data);
    return { isAuth, isAdmin };
  } catch {
    return { isAuth: false, isAdmin: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const kind = String(formData.get('kind') || ''); // 'vsl' | 'imagem' | 'extra' | 'transcricao' | 'vsl-descricao' | 'avatar'
    
    // Verificar autenticação
    const { isAuth, isAdmin } = await isAuthenticated();
    
    // Avatar pode ser feito por qualquer usuário autenticado
    if (kind === 'avatar') {
      if (!isAuth) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    } else {
      // Outros tipos de upload requerem admin
      if (!isAdmin) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }

    // Para transcricao/vsl-descricao, retornar o texto diretamente (não precisa de storage)
    if (kind === 'transcricao' || kind === 'vsl-descricao') {
      const mime = file.type || '';
      const isTextMime = mime === 'text/plain' || mime === 'text/txt' || mime === '';
      const isDocxMime = mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mime === 'application/octet-stream';
      const nameLower = (file.name || '').toLowerCase();
      const isTxtExt = nameLower.endsWith('.txt');
      const isDocxExt = nameLower.endsWith('.docx');
      if (!(isTextMime || isTxtExt || isDocxMime || isDocxExt)) {
        return NextResponse.json({ error: 'Apenas arquivos .txt ou .docx são permitidos' }, { status: 400 });
      }
      const MAX_TEXT_SIZE = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX_TEXT_SIZE) {
        return NextResponse.json({ error: 'Arquivo excede 2MB' }, { status: 400 });
      }
      // Para .txt, retornar o texto direto — não precisa de upload
      if (isTxtExt || isTextMime) {
        const text = await file.text();
        return NextResponse.json({ text, kind });
      }
      // Para .docx, proxy para o backend (que pode processar com mammoth)
    }

    // Proxy o arquivo para o backend /upload/drive
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('kind', kind);

    const response = await fetch(`${API_BASE_URL}/upload/drive`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: backendFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  }
}
