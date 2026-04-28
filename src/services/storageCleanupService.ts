import prisma from '../config/database';
import logger from '../config/logger';
import driveStorageService from './driveStorageService';

// ─────────────────────────────────────────────────────────────────
// Storage Cleanup Service — Garbage Collection para Google Drive
// Encontra e remove arquivos órfãos (que não são mais referenciados
// por nenhuma oferta no banco de dados)
// ─────────────────────────────────────────────────────────────────

interface CleanupResult {
  success: boolean;
  orphanedFiles: number;
  deletedFiles: number;
  errors: number;
  details: Array<{
    fileId: string;
    fileName: string;
    action: 'deleted' | 'error' | 'skipped';
    error?: string;
  }>;
}

/**
 * Executa a limpeza de arquivos órfãos no Google Drive
 * 
 * 1. Lista todas as URLs de imagem/vsl referenciadas pelas ofertas no banco
 * 2. Extrai os file IDs do Drive dessas URLs
 * 3. Lista todos os arquivos na pasta _uploads/ do Drive
 * 4. Compara e deleta os que não são referenciados
 */
export async function runStorageCleanup(): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: false,
    orphanedFiles: 0,
    deletedFiles: 0,
    errors: 0,
    details: [],
  };

  try {
    if (!driveStorageService.isConfigured()) {
      logger.warn('StorageCleanup: Google Drive não configurado, pulando limpeza');
      return { ...result, success: false };
    }

    // 1. Buscar todas as URLs de arquivos referenciadas nas ofertas
    const ofertas = await prisma.oferta.findMany({
      select: {
        imagem: true,
        vsl: true,
        links: true,
      },
    });

    // 2. Extrair todos os file IDs que estão em uso
    const usedFileIds = new Set<string>();

    for (const oferta of ofertas) {
      // Imagem
      if (oferta.imagem && driveStorageService.isDriveUrl(oferta.imagem)) {
        const fileId = driveStorageService.extractFileId(oferta.imagem);
        if (fileId) usedFileIds.add(fileId);
      }

      // VSL
      if (oferta.vsl && driveStorageService.isDriveUrl(oferta.vsl)) {
        const fileId = driveStorageService.extractFileId(oferta.vsl);
        if (fileId) usedFileIds.add(fileId);
      }

      // Criativos nos links
      if (oferta.links) {
        try {
          const linksData = typeof oferta.links === 'string'
            ? JSON.parse(oferta.links)
            : oferta.links;

          if (linksData?.criativos && Array.isArray(linksData.criativos)) {
            for (const url of linksData.criativos) {
              if (driveStorageService.isDriveUrl(url)) {
                const fileId = driveStorageService.extractFileId(url);
                if (fileId) usedFileIds.add(fileId);
              }
            }
          }
        } catch {
          // Ignorar JSON inválido
        }
      }
    }

    logger.info(`StorageCleanup: ${usedFileIds.size} file IDs em uso encontrados`);

    // 3. Verificar se existe pasta _uploads
    const rootFolderId = driveStorageService.DRIVE_BOT_FOLDER_ID;
    if (!rootFolderId) {
      logger.warn('StorageCleanup: DRIVE_FOLDER_ID não configurado');
      return { ...result, success: false };
    }

    // Listar pasta _uploads (se existir)
    const drive = driveStorageService.getDriveClient();
    if (!drive) {
      return { ...result, success: false };
    }

    const uploadsFolderRes = await drive.files.list({
      q: `'${rootFolderId}' in parents and name = '_uploads' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
    });

    const uploadsFolder = uploadsFolderRes.data.files?.[0];
    if (!uploadsFolder?.id) {
      logger.info('StorageCleanup: Pasta _uploads não existe, nada para limpar');
      return { ...result, success: true };
    }

    // 4. Recursivamente listar todos os arquivos na pasta _uploads
    const allUploadedFiles = await listFilesRecursive(drive, uploadsFolder.id);
    logger.info(`StorageCleanup: ${allUploadedFiles.length} arquivos encontrados na pasta _uploads`);

    // 5. Comparar e encontrar órfãos
    const orphanedFiles = allUploadedFiles.filter(
      file => file.id && !usedFileIds.has(file.id)
    );

    result.orphanedFiles = orphanedFiles.length;
    logger.info(`StorageCleanup: ${orphanedFiles.length} arquivos órfãos encontrados`);

    // 6. Deletar órfãos (com rate limiting)
    for (const file of orphanedFiles) {
      if (!file.id) continue;

      try {
        const success = await driveStorageService.deleteFile(file.id);
        if (success) {
          result.deletedFiles++;
          result.details.push({
            fileId: file.id,
            fileName: file.name || 'unknown',
            action: 'deleted',
          });
        } else {
          result.errors++;
          result.details.push({
            fileId: file.id,
            fileName: file.name || 'unknown',
            action: 'error',
            error: 'deleteFile retornou false',
          });
        }
      } catch (err) {
        result.errors++;
        result.details.push({
          fileId: file.id,
          fileName: file.name || 'unknown',
          action: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
      }

      // Pausa entre deletes para não exceder quotas
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    result.success = true;
    logger.info(`StorageCleanup concluído: ${result.deletedFiles} deletados, ${result.errors} erros`);
    return result;
  } catch (error) {
    logger.error('StorageCleanup erro fatal:', error);
    return { ...result, success: false };
  }
}

/**
 * Lista recursivamente todos os arquivos em uma pasta do Drive
 * Percorre subpastas (ano/mês) dentro de _uploads
 */
async function listFilesRecursive(drive: any, folderId: string): Promise<any[]> {
  const allFiles: any[] = [];
  let pageToken: string | undefined;

  try {
    // Listar itens da pasta
    do {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, size)',
        pageSize: 100,
        pageToken,
      });

      if (res.data.files) {
        for (const item of res.data.files) {
          if (item.mimeType === 'application/vnd.google-apps.folder') {
            // Recursão para subpastas
            const subFiles = await listFilesRecursive(drive, item.id);
            allFiles.push(...subFiles);
          } else {
            // Arquivo regular
            allFiles.push(item);
          }
        }
      }
      pageToken = res.data.nextPageToken;
    } while (pageToken);
  } catch (err) {
    logger.warn(`StorageCleanup: Erro ao listar pasta ${folderId}`, err);
  }

  return allFiles;
}
