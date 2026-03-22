import { createClient } from '@supabase/supabase-js';

// Validar variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente Supabase singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Não usar Supabase Auth (você tem JWT próprio)
    autoRefreshToken: false,
  },
});

/**
 * Upload de arquivo para Supabase Storage
 * @param bucket - Nome do bucket (ex: 'ofertas-images', 'ofertas-videos')
 * @param path - Caminho do arquivo (ex: '2024/oferta-123.jpg')
 * @param file - Arquivo (File ou Blob)
 * @returns URL pública do arquivo
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<string> {
  try {
    // Upload do arquivo
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Sobrescrever se já existir
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    // Obter URL pública
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

/**
 * Deletar arquivo do Supabase Storage
 * @param bucket - Nome do bucket
 * @param path - Caminho do arquivo
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Erro ao deletar arquivo: ${error.message}`);
    }
  } catch (error) {
    console.error('Delete failed:', error);
    throw error;
  }
}

/**
 * Listar arquivos de um bucket
 * @param bucket - Nome do bucket
 * @param path - Caminho da pasta (opcional)
 */
export async function listFiles(bucket: string, path: string = '') {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(path, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      console.error('Supabase list error:', error);
      throw new Error(`Erro ao listar arquivos: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('List failed:', error);
    throw error;
  }
}

/**
 * Gerar nome único para arquivo
 * @param originalName - Nome original do arquivo
 * @returns Nome único com timestamp
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(`.${extension}`, '').substring(0, 50);
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '-');
  
  return `${sanitized}-${timestamp}-${random}.${extension}`;
}

/**
 * Extrair path do arquivo de uma URL do Supabase
 * @param url - URL pública do Supabase
 * @returns Path do arquivo
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Formato: https://PROJECT.supabase.co/storage/v1/object/public/BUCKET/PATH
    const parts = urlObj.pathname.split('/public/');
    if (parts.length === 2) {
      const [bucket, ...pathParts] = parts[1].split('/');
      return pathParts.join('/');
    }
    return null;
  } catch {
    return null;
  }
}

