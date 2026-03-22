import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Cliente Supabase para uploads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

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

    const mime = file.type || '';
    const size = (file as any).size as number | undefined;
    const MAX_VIDEO_SIZE = 700 * 1024 * 1024; // 700MB
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_TEXT_SIZE = 2 * 1024 * 1024; // 2MB
    
    if (kind === 'avatar') {
      // Validar avatar: apenas imagens, máximo 5MB
      if (!mime.startsWith('image/')) {
        return NextResponse.json({ error: 'Apenas imagens são permitidas para avatar' }, { status: 400 });
      }
      if (typeof size === 'number' && size > MAX_AVATAR_SIZE) {
        return NextResponse.json({ error: 'Avatar excede 5MB' }, { status: 400 });
      }
    } else if (kind === 'vsl') {
      // Aceitar MP4 mesmo quando alguns navegadores enviam application/octet-stream,
      // desde que a extensão seja .mp4
      const isMp4Mime = mime === 'video/mp4' || mime === 'application/octet-stream';
      const nameLower = (file.name || '').toLowerCase();
      const isMp4Ext = nameLower.endsWith('.mp4');
      if (!(isMp4Mime && isMp4Ext)) {
        return NextResponse.json({ error: 'Apenas arquivos MP4 são permitidos para VSL' }, { status: 400 });
      }
      if (typeof size === 'number' && size > MAX_VIDEO_SIZE) {
        return NextResponse.json({ error: 'Arquivo MP4 excede 700MB' }, { status: 400 });
      }
    } else if (kind === 'transcricao' || kind === 'vsl-descricao') {
      // Validar arquivos .txt ou .docx
      const isTextMime = mime === 'text/plain' || mime === 'text/txt' || mime === '';
      const isDocxMime = mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mime === 'application/octet-stream';
      const nameLower = (file.name || '').toLowerCase();
      const isTxtExt = nameLower.endsWith('.txt');
      const isDocxExt = nameLower.endsWith('.docx');
      if (!(isTextMime || isTxtExt || isDocxMime || isDocxExt)) {
        return NextResponse.json({ error: 'Apenas arquivos .txt ou .docx são permitidos' }, { status: 400 });
      }
      if (typeof size === 'number' && size > MAX_TEXT_SIZE) {
        return NextResponse.json({ error: 'Arquivo excede 2MB' }, { status: 400 });
      }
    } else {
      if (!mime.startsWith('image/')) {
        return NextResponse.json({ error: 'Apenas imagens são permitidas' }, { status: 400 });
      }
      if (typeof size === 'number' && size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Imagem excede 10MB' }, { status: 400 });
      }
    }

    // Determinar bucket baseado no tipo de arquivo
    const bucket = (() => {
      if (kind === 'vsl') return 'videos';
      if (kind === 'transcricao' || kind === 'vsl-descricao') {
        // Usar bucket específico para arquivos .txt se configurado, senão usar 'texts'
        return process.env.SUPABASE_BUCKET_TEXTS || 'texts';
      }
      if (kind === 'avatar') {
        // Usar bucket 'avatars' se configurado, senão usar 'images'
        return process.env.SUPABASE_BUCKET_AVATARS || 'images';
      }
      return 'images';
    })();

    // Gerar nome único para o arquivo
    const ext = (() => {
      if (mime === 'video/mp4') return '.mp4';
      if (mime === 'text/plain') return '.txt';
      const fromName = (file.name || '').toLowerCase();
      const match = fromName.match(/\.(mp4|jpg|jpeg|png|webp|gif|txt)$/i);
      if (match) return `.${match[1].toLowerCase()}`;
      if (mime.startsWith('image/')) return '.jpg';
      return '';
    })();

    const baseName = (file.name || 'upload')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
    
    // Organizar por data: 2025/01/arquivo.jpg
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    const uniqueName = `${baseName}-${timestamp}-${random}${ext}`;
    const storagePath = `${year}/${month}/${uniqueName}`;

    // Converter arquivo para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType: mime,
        cacheControl: '3600',
        upsert: false, // Não sobrescrever (cada upload é único)
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: `Erro ao fazer upload no Supabase: ${error.message}` },
        { status: 500 }
      );
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return NextResponse.json({ 
      url: publicUrlData.publicUrl,
      kind,
      bucket,
      path: data.path 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  }
}


