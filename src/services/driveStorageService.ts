import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../config/logger';

// ─────────────────────────────────────────────────────────────────
// DriveStorageService — Substitui completamente o Supabase Storage
// Usa Google Drive API para upload, download e serving de arquivos
// ─────────────────────────────────────────────────────────────────

const CREDENTIALS_FILE = path.join(process.cwd(), 'google-credentials.json');

// Inicializar Google Drive com escopo completo (leitura + escrita).
// Passa credentials como OBJETO (não keyFile) → sem dependência de cwd/disco read-only.
// Corrige \n escapado no private_key (comum quando o JSON vem de env/secret).
let drive: drive_v3.Drive | null = null;

try {
    let credsJson: string | undefined;
    if (process.env.GOOGLE_CREDENTIALS_BASE64) {
        credsJson = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8');
    } else if (process.env.GOOGLE_CREDENTIALS_JSON) {
        credsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    } else if (fs.existsSync(CREDENTIALS_FILE)) {
        credsJson = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    }
    if (!credsJson) throw new Error('GOOGLE_CREDENTIALS_JSON / _BASE64 ausente e arquivo não existe');

    const creds = JSON.parse(credsJson); // valida JSON na inicialização
    if (creds.private_key) creds.private_key = String(creds.private_key).replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    drive = google.drive({ version: 'v3', auth });
    logger.info('DriveStorage: Google Drive auth OK ✅');
} catch (err) {
    drive = null;
    logger.error('DriveStorage: Google Drive auth FAILED — bot ciclo abortará', err);
}

// Pasta raiz do bot de ofertas (já existente)
const DRIVE_BOT_FOLDER_ID = process.env.DRIVE_FOLDER_ID || '';

// Cache de IDs de pastas para evitar lookups repetidos
const folderIdCache = new Map<string, string>();

// ─────────────────────────────────────────────────────────────────
// URLs PÚBLICAS
// ─────────────────────────────────────────────────────────────────

/**
 * Gera URL pública de visualização de imagem.
 * Usa o endpoint /thumbnail do Drive (estável, não expira, funciona em <img>
 * para arquivos anyone:reader). O antigo lh3.googleusercontent.com/d/ redirecionava
 * pra URL assinada temporária (drive-storage) que quebrava no browser.
 */
function getPublicImageUrl(fileId: string): string {
    return getThumbnailUrl(fileId, 1600);
}

/**
 * Gera URL de embed para vídeo (iframe do Drive)
 */
function getPublicVideoUrl(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Gera URL de download direto
 */
function getDirectDownloadUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Gera URL de visualização direta (alternativa para imagens)
 */
function getViewUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Gera URL de thumbnail do Google Drive
 * Funciona para vídeos, PDFs e imagens públicas
 * @param fileId - ID do arquivo no Drive
 * @param width - Largura desejada (default: 800px)
 */
function getThumbnailUrl(fileId: string, width: number = 800): string {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

/**
 * Busca a thumbnailLink oficial via API do Drive (melhor qualidade)
 * Requer que o arquivo já esteja público
 * Retorna null se não conseguir obter
 */
async function fetchThumbnailLink(fileId: string): Promise<string | null> {
    if (!drive) return null;

    try {
        const res = await drive.files.get({
            fileId,
            fields: 'thumbnailLink',
        });

        const link = res.data.thumbnailLink;
        if (link) {
            // thumbnailLink vem com =s220 (220px), trocar para tamanho maior
            return link.replace(/=s\d+$/, '=s800');
        }
    } catch (err) {
        logger.warn(`DriveStorage: Falha ao buscar thumbnailLink para ${fileId}`, err);
    }

    return null;
}

// ─────────────────────────────────────────────────────────────────
// DETECÇÃO E EXTRAÇÃO DE URLs
// ─────────────────────────────────────────────────────────────────

/**
 * Extrai o FILE_ID de qualquer URL do Google Drive
 * Suporta múltiplos formatos de URL do Drive
 */
function extractFileId(url: string): string | null {
    if (!url) return null;

    try {
        // https://drive.google.com/file/d/FILE_ID/preview
        // https://drive.google.com/file/d/FILE_ID/view
        let match = url.match(/\/file\/d\/([^\/\?]+)/);
        if (match) return match[1];

        // https://drive.google.com/uc?export=view&id=FILE_ID
        // https://drive.google.com/uc?export=download&id=FILE_ID
        match = url.match(/[?&]id=([^&]+)/);
        if (match) return match[1];

        // https://lh3.googleusercontent.com/d/FILE_ID
        match = url.match(/googleusercontent\.com\/d\/([^\/\?]+)/);
        if (match) return match[1];

        // https://drive.google.com/open?id=FILE_ID
        match = url.match(/open\?id=([^&]+)/);
        if (match) return match[1];
    } catch (err) {
        logger.warn('DriveStorage: falha ao extrair fileId de URL', { url });
    }

    return null;
}

/**
 * Detecta se uma URL é do Google Drive
 */
function isDriveUrl(url: string): boolean {
    if (!url) return false;
    return url.includes('drive.google.com') ||
        url.includes('googleusercontent.com') ||
        url.includes('googleapis.com');
}

/**
 * Detecta se uma URL é do Supabase Storage (legado)
 */
function isSupabaseUrl(url: string): boolean {
    if (!url) return false;
    return url.includes('supabase.co');
}

// ─────────────────────────────────────────────────────────────────
// PERMISSÕES
// ─────────────────────────────────────────────────────────────────

/**
 * Torna um arquivo público (qualquer pessoa com o link pode visualizar)
 * Necessário para que imagens/vídeos apareçam no site
 */
async function makeFilePublic(fileId: string): Promise<boolean> {
    if (!drive) return false;

    try {
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });
        logger.info(`DriveStorage: Arquivo ${fileId} tornado público ✅`);
        return true;
    } catch (err: any) {
        // Se já for público, ignorar o erro
        if (err?.code === 409) {
            logger.info(`DriveStorage: Arquivo ${fileId} já era público`);
            return true;
        }
        logger.error(`DriveStorage: Falha ao tornar arquivo ${fileId} público`, err);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────
// PASTAS
// ─────────────────────────────────────────────────────────────────

/**
 * Garante que uma subpasta existe dentro de um parent
 * Retorna o ID da pasta (cria se não existir)
 * Usa cache para evitar lookups repetidos
 */
async function ensureFolder(name: string, parentId: string): Promise<string> {
    if (!drive) throw new Error('DriveStorage: Drive não inicializado');

    const cacheKey = `${parentId}/${name}`;
    const cached = folderIdCache.get(cacheKey);
    if (cached) return cached;

    // Verificar se a pasta já existe
    const res = await drive.files.list({
        q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
    });

    if (res.data.files && res.data.files.length > 0) {
        const folderId = res.data.files[0].id!;
        folderIdCache.set(cacheKey, folderId);
        return folderId;
    }

    // Criar pasta
    const folder = await drive.files.create({
        requestBody: {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        },
        fields: 'id',
    });

    const folderId = folder.data.id!;
    folderIdCache.set(cacheKey, folderId);
    logger.info(`DriveStorage: Pasta "${name}" criada em ${parentId}`);
    return folderId;
}

// ─────────────────────────────────────────────────────────────────
// UPLOAD
// ─────────────────────────────────────────────────────────────────

/**
 * Upload de arquivo para o Google Drive
 * Usado para uploads manuais do admin (criar/editar ofertas)
 * 
 * @param source - Buffer ou caminho de arquivo no disco
 * @param fileName - Nome original do arquivo
 * @param mimeType - Tipo MIME (ex: 'image/jpeg', 'video/mp4')
 * @param parentFolderId - ID da pasta pai no Drive
 * @returns { fileId, url } ou null se falhar
 */
async function uploadFile(
    source: Buffer | string,
    fileName: string,
    mimeType: string,
    parentFolderId: string
): Promise<{ fileId: string; url: string } | null> {
    if (!drive) {
        logger.error('DriveStorage: Drive não inicializado, upload impossível');
        return null;
    }

    try {
        // Gerar nome único
        const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const timestamp = Date.now();
        const uniqueName = `${timestamp}-${cleanName}`;

        // Garantir que subpastas ano/mês existem
        const yearFolderId = await ensureFolder(String(year), parentFolderId);
        const monthFolderId = await ensureFolder(month, yearFolderId);

        // Preparar media body
        let body: Readable;
        if (typeof source === 'string') {
            // Caminho de arquivo no disco
            body = fs.createReadStream(source);
        } else {
            // Buffer
            body = Readable.from(source);
        }

        // Upload
        const res = await drive.files.create({
            requestBody: {
                name: uniqueName,
                parents: [monthFolderId],
            },
            media: {
                mimeType,
                body,
            },
            fields: 'id, name, size',
        });

        const fileId = res.data.id!;
        const fileSize = res.data.size ? `${(parseInt(res.data.size) / 1024 / 1024).toFixed(1)}MB` : 'unknown';

        // Tornar público
        await makeFilePublic(fileId);

        // Determinar URL baseado no tipo
        const isVideo = mimeType.startsWith('video/');
        const url = isVideo
            ? getPublicVideoUrl(fileId)
            : getPublicImageUrl(fileId);

        logger.info(`DriveStorage: Upload OK ✅ "${uniqueName}" (${fileSize}) → ${url}`);
        return { fileId, url };
    } catch (err) {
        logger.error(`DriveStorage: Upload falhou para "${fileName}"`, err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────

/**
 * Deletar um arquivo do Google Drive pelo ID
 */
async function deleteFile(fileId: string): Promise<boolean> {
    if (!drive) return false;

    try {
        await drive.files.delete({ fileId });
        logger.info(`DriveStorage: Arquivo ${fileId} deletado ✅`);
        return true;
    } catch (err: any) {
        if (err?.code === 404) {
            logger.warn(`DriveStorage: Arquivo ${fileId} não encontrado (já deletado?)`);
            return true;
        }
        logger.error(`DriveStorage: Falha ao deletar arquivo ${fileId}`, err);
        return false;
    }
}

/**
 * Deletar arquivo a partir de uma URL (Drive ou Supabase)
 * Para URLs do Supabase (legado), apenas ignora
 */
async function deleteFileFromUrl(url: string): Promise<boolean> {
    if (!url) return false;

    // Ignorar URLs do Supabase (legado — não temos mais acesso)
    if (isSupabaseUrl(url)) {
        logger.info(`DriveStorage: Ignorando delete de URL legado Supabase: ${url.substring(0, 60)}...`);
        return false;
    }

    const fileId = extractFileId(url);
    if (!fileId) {
        logger.warn(`DriveStorage: Não foi possível extrair fileId de: ${url.substring(0, 60)}...`);
        return false;
    }

    return deleteFile(fileId);
}

// ─────────────────────────────────────────────────────────────────
// LISTAGEM
// ─────────────────────────────────────────────────────────────────

/**
 * Listar arquivos dentro de uma pasta (com paginação)
 */
async function listFilesInFolder(folderId: string): Promise<drive_v3.Schema$File[]> {
    if (!drive) return [];

    const allFiles: drive_v3.Schema$File[] = [];
    let pageToken: string | undefined;

    try {
        do {
            const res = await drive.files.list({
                q: `'${folderId}' in parents and trashed = false`,
                fields: 'nextPageToken, files(id, name, mimeType, size)',
                pageSize: 100,
                pageToken,
            });

            if (res.data.files) allFiles.push(...res.data.files);
            pageToken = res.data.nextPageToken || undefined;
        } while (pageToken);

        return allFiles;
    } catch (err) {
        logger.error(`DriveStorage: Falha ao listar pasta ${folderId}`, err);
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────
// VALIDAÇÃO
// ─────────────────────────────────────────────────────────────────

/**
 * Verifica se o Drive Storage está configurado e funcional
 */
function isConfigured(): boolean {
    return drive !== null;
}

/**
 * Retorna a instância do Google Drive client
 * Usado pelo botService para operações de leitura (list, download, export)
 */
function getDriveClient(): drive_v3.Drive | null {
    return drive;
}

// ─────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────

export const driveStorageService = {
    // URLs
    getPublicImageUrl,
    getPublicVideoUrl,
    getDirectDownloadUrl,
    getViewUrl,
    getThumbnailUrl,
    fetchThumbnailLink,

    // Detecção
    extractFileId,
    isDriveUrl,
    isSupabaseUrl,

    // Permissões
    makeFilePublic,

    // Pastas
    ensureFolder,

    // CRUD
    uploadFile,
    deleteFile,
    deleteFileFromUrl,

    // Listagem
    listFilesInFolder,

    // Utilitários
    isConfigured,
    getDriveClient,

    // Constantes
    DRIVE_BOT_FOLDER_ID,
};

export default driveStorageService;
