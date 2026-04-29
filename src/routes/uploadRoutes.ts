import { Router, Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');
import driveStorageService from '../services/driveStorageService';
import logger from '../config/logger';

const router = Router();

// Interface para o arquivo processado pelo multer
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}

// Multer para processar uploads em memória (max 700MB para vídeos)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 700 * 1024 * 1024, // 700MB max
    },
});

/**
 * POST /upload/drive
 * Upload de arquivo para Google Drive Storage
 * Requer autenticação admin
 */
router.post('/drive', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const file = (req as any).file as MulterFile | undefined;
        const kind = String(req.body.kind || ''); // 'vsl' | 'imagem' | 'extra' | 'avatar'

        if (!file) {
            return res.status(400).json({ error: 'Arquivo não enviado' });
        }

        // Verificar se Drive Storage está configurado
        if (!driveStorageService.isConfigured()) {
            return res.status(500).json({ error: 'Google Drive Storage não está configurado' });
        }

        const mime = file.mimetype || '';
        const MAX_VIDEO_SIZE = 700 * 1024 * 1024; // 700MB
        const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
        const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

        // Validações por tipo
        if (kind === 'avatar') {
            if (!mime.startsWith('image/')) {
                return res.status(400).json({ error: 'Apenas imagens são permitidas para avatar' });
            }
            if (file.size > MAX_AVATAR_SIZE) {
                return res.status(400).json({ error: 'Avatar excede 5MB' });
            }
        } else if (kind === 'vsl') {
            const isMp4Mime = mime === 'video/mp4' || mime === 'application/octet-stream';
            const isMp4Ext = (file.originalname || '').toLowerCase().endsWith('.mp4');
            if (!(isMp4Mime && isMp4Ext)) {
                return res.status(400).json({ error: 'Apenas arquivos MP4 são permitidos para VSL' });
            }
            if (file.size > MAX_VIDEO_SIZE) {
                return res.status(400).json({ error: 'Arquivo MP4 excede 700MB' });
            }
        } else {
            // Imagem padrão
            if (!mime.startsWith('image/')) {
                return res.status(400).json({ error: 'Apenas imagens são permitidas' });
            }
            if (file.size > MAX_IMAGE_SIZE) {
                return res.status(400).json({ error: 'Imagem excede 10MB' });
            }
        }

        // Determinar pasta de destino no Drive
        const DRIVE_ROOT = driveStorageService.DRIVE_BOT_FOLDER_ID;
        
        // Criar/encontrar subpasta _uploads
        const uploadsFolderId = await driveStorageService.ensureFolder('_uploads', DRIVE_ROOT);
        
        // Subpasta por tipo
        const subfolder = kind === 'vsl' ? 'videos' : (kind === 'avatar' ? 'avatars' : 'images');
        const targetFolderId = await driveStorageService.ensureFolder(subfolder, uploadsFolderId);

        // Upload para o Drive
        const result = await driveStorageService.uploadFile(
            file.buffer,
            file.originalname || 'upload',
            mime,
            targetFolderId
        );

        if (!result) {
            return res.status(500).json({ error: 'Falha ao fazer upload para o Google Drive' });
        }

        logger.info('Upload para Drive concluído', {
            kind,
            fileId: result.fileId,
            url: result.url,
            size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
        });

        return res.json({
            url: result.url,
            fileId: result.fileId,
            kind,
        });
    } catch (error) {
        logger.error('Erro no upload para Drive:', error);
        return res.status(500).json({ error: 'Erro ao fazer upload' });
    }
});

export default router;
