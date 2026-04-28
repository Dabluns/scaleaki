/**
 * Drive Storage Helpers — Substitui Supabase Storage no frontend
 * 
 * Gera URLs e detecta tipos de URLs de arquivos armazenados no Google Drive.
 * Upload é feito via API route (/api/upload) que encaminha ao backend.
 */

// ─────────────────────────────────────────────────────────────────
// URLs PÚBLICAS
// ─────────────────────────────────────────────────────────────────

/**
 * Gera URL pública de visualização de imagem a partir do file ID do Drive
 */
export function getDriveImageUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/**
 * Gera URL de embed para vídeo (iframe do Drive)
 */
export function getDriveVideoUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Gera URL de download direto
 */
export function getDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// ─────────────────────────────────────────────────────────────────
// DETECÇÃO
// ─────────────────────────────────────────────────────────────────

/**
 * Detecta se uma URL é do Google Drive
 */
export function isDriveUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') ||
    url.includes('googleusercontent.com') ||
    url.includes('googleapis.com');
}

/**
 * Detecta se uma URL é do Supabase Storage (legado)
 * URLs do Supabase podem estar quebradas se o storage estourou o limite
 */
export function isSupabaseUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('supabase.co');
}

/**
 * Extrai o FILE_ID de qualquer URL do Google Drive
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;

  try {
    // https://drive.google.com/file/d/FILE_ID/preview
    let match = url.match(/\/file\/d\/([^\/\?]+)/);
    if (match) return match[1];

    // https://drive.google.com/uc?export=view&id=FILE_ID
    match = url.match(/[?&]id=([^&]+)/);
    if (match) return match[1];

    // https://lh3.googleusercontent.com/d/FILE_ID
    match = url.match(/googleusercontent\.com\/d\/([^\/\?]+)/);
    if (match) return match[1];

    // https://drive.google.com/open?id=FILE_ID
    match = url.match(/open\?id=([^&]+)/);
    if (match) return match[1];
  } catch {
    // ignore
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// HELPERS DE EXIBIÇÃO
// ─────────────────────────────────────────────────────────────────

/**
 * Retorna a URL de exibição correta para uma imagem (Drive ou Supabase legado)
 * Para Supabase legado, retorna a URL original (que pode estar quebrada)
 */
export function getDisplayImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // URLs do Drive e Supabase já são URLs diretas, retornar como estão
  return url;
}

/**
 * Verifica se uma URL de imagem provavelmente funciona
 * URLs do Supabase quando o storage está bloqueado retornam 402
 */
export function isImageUrlLikelyWorking(url: string | null | undefined): boolean {
  if (!url) return false;
  // URLs do Drive devem funcionar sempre (depois de tornar público)
  if (isDriveUrl(url)) return true;
  // URLs do Supabase podem estar quebradas
  if (isSupabaseUrl(url)) return false;
  // Outras URLs (externas) assumir que funcionam
  return true;
}

// ─────────────────────────────────────────────────────────────────
// UPLOAD HELPER
// ─────────────────────────────────────────────────────────────────

/**
 * Upload de arquivo via API route (que encaminha ao backend → Google Drive)
 * @param file - Arquivo do input do usuário
 * @param kind - Tipo: 'vsl' | 'imagem' | 'extra' | 'avatar'
 * @returns URL pública do arquivo no Drive
 */
export async function uploadFile(
  file: File,
  kind: string = 'imagem'
): Promise<{ url: string; fileId?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kind', kind);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || 'Erro ao fazer upload');
  }

  return response.json();
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
