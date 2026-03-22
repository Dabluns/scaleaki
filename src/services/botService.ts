import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Readable } from 'stream';
import mammoth from 'mammoth';
import prisma from '../config/database';
import logger from '../config/logger';
import { randomUUID } from 'crypto';

// ─────────────────────────────────────────────────────────────────
// Bot Service v2.0 — Production-Ready
// Phase 1: Persistent state, retry, validation, DB logs, dedup
// ─────────────────────────────────────────────────────────────────

// --- CONFIGURAÇÕES ---
const GOOGLE_DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const GOOGLE_CREDENTIALS_PATH = 'google-credentials.json';

const BUCKET_IMAGES = 'images';
const BUCKET_VIDEOS = 'videos';

// Instâncias
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Auth do Google Drive
let drive: any = null;
try {
    const auth = new google.auth.GoogleAuth({
        keyFile: GOOGLE_CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    drive = google.drive({ version: 'v3', auth });
} catch (err) {
    logger.warn('Google Drive auth failed (credentials missing?)');
}

// Auth do Gemini
let genAI: any = null;
if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

// Controle de Estado em Memória (sincronizado com DB)
let isRunning = false;
let loopInterval: NodeJS.Timeout | null = null;
let currentCycleId: string | null = null;

// ─────────────────────────────────────────────────────────────────
// FASE 1.3 — Validação de Configuração
// ─────────────────────────────────────────────────────────────────

function validateBotConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!GOOGLE_DRIVE_FOLDER_ID) errors.push('DRIVE_FOLDER_ID não configurado');
    if (!drive) errors.push('Google Drive auth falhou — google-credentials.json ausente ou inválido');
    if (!SUPABASE_URL) errors.push('NEXT_PUBLIC_SUPABASE_URL não configurado');
    if (!SUPABASE_KEY) errors.push('SUPABASE_SERVICE_ROLE_KEY não configurado');
    if (!GEMINI_API_KEY) warnings.push('GEMINI_API_KEY não configurado — classificação de nicho por IA desabilitada');

    return { valid: errors.length === 0, errors, warnings };
}

// ─────────────────────────────────────────────────────────────────
// FASE 1.1 — Estado Persistente no Banco
// ─────────────────────────────────────────────────────────────────

async function ensureBotState() {
    try {
        const existing = await prisma.botState.findUnique({ where: { id: 'singleton' } });
        if (!existing) {
            await prisma.botState.create({ data: { id: 'singleton' } });
        }
    } catch (err) {
        logger.error('Failed to ensure BotState record:', err);
    }
}

async function updateBotState(data: Record<string, any>) {
    try {
        await prisma.botState.upsert({
            where: { id: 'singleton' },
            update: data,
            create: { id: 'singleton', ...data },
        });
    } catch (err) {
        logger.error('Failed to update BotState:', err);
    }
}

async function getBotStateFromDB() {
    try {
        return await prisma.botState.findUnique({ where: { id: 'singleton' } });
    } catch (err) {
        logger.error('Failed to read BotState:', err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────
// FASE 1.4 — Logs do Bot no Banco de Dados
// ─────────────────────────────────────────────────────────────────

async function logBot(
    level: 'info' | 'success' | 'warning' | 'error',
    message: string,
    offerName?: string,
    details?: Record<string, any>
) {
    // Log no Winston (console/arquivo) como antes
    const logFn = level === 'error' ? logger.error : level === 'warning' ? logger.warn : logger.info;
    logFn(`Bot: ${message}`, details || {});

    // Log no banco (para o painel admin)
    try {
        await prisma.botLog.create({
            data: {
                level,
                message,
                offerName: offerName || null,
                cycleId: currentCycleId || null,
                details: details ? JSON.stringify(details) : null,
            },
        });
    } catch (err) {
        // Não falhar o bot por causa de log
        logger.error('Failed to write BotLog to DB:', err);
    }
}

// Limpar logs antigos (manter últimos 7 dias)
async function cleanupOldLogs() {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const { count } = await prisma.botLog.deleteMany({
            where: { createdAt: { lt: sevenDaysAgo } },
        });
        if (count > 0) {
            logger.info(`Bot: Cleaned up ${count} old log entries`);
        }
    } catch (err) {
        logger.error('Failed to cleanup old bot logs:', err);
    }
}

// ─────────────────────────────────────────────────────────────────
// FASE 1.2 — Retry com Backoff Exponencial
// ─────────────────────────────────────────────────────────────────

async function withRetry<T>(
    fn: () => Promise<T>,
    label: string,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s

            // Não fazer retry em erros de autenticação ou not-found
            const statusCode = err?.code || err?.response?.status;
            if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
                await logBot('error', `${label} — erro não-retentável (${statusCode}), abortando.`, undefined, { error: err.message });
                return null;
            }

            if (attempt < maxRetries) {
                await logBot('warning', `${label} — tentativa ${attempt}/${maxRetries} falhou. Retentando em ${delay}ms...`, undefined, { error: err.message });
                await new Promise(r => setTimeout(r, delay));
            } else {
                await logBot('error', `${label} — todas as ${maxRetries} tentativas esgotadas.`, undefined, { error: err.message });
            }
        }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────
// FASE 2.2 — Timeout por Operação
// ─────────────────────────────────────────────────────────────────

async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    label: string
): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(new Error(`TIMEOUT: Operação "${label}" excedeu ${timeoutMs / 1000}s`));
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutHandle!);
        return result;
    } catch (error) {
        clearTimeout(timeoutHandle!);
        throw error;
    }
}

// ─────────────────────────────────────────────────────────────────
// FUNÇÕES ORIGINAIS — Upload, Download, Helpers
// ─────────────────────────────────────────────────────────────────

async function uploadToSupabase(buffer: Buffer, fileName: string, mimeType: string, bucket: string): Promise<string | null> {
    return withRetry(async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const timestamp = Date.now();
        const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `${year}/${month}/${timestamp}-${cleanName}`;

        await yieldEventLoop();

        const { error } = await supabase.storage
            .from(bucket)
            .upload(path, buffer, { contentType: mimeType, upsert: false });

        if (error) {
            throw new Error(`Supabase upload error(${fileName}): ${error.message}`);
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }, `Upload "${fileName}"`, 3, 2000);
}

async function deleteFileFromUrl(url: string) {
    try {
        const path = url.split(`${BUCKET_IMAGES}/`).pop() || url.split(`${BUCKET_VIDEOS}/`).pop();
        if (!path) return;

        const bucket = url.includes(BUCKET_IMAGES) ? BUCKET_IMAGES : BUCKET_VIDEOS;
        await supabase.storage.from(bucket).remove([path]);
        logger.info(`Rollback: Deleted file ${path}`);
    } catch (err) {
        logger.error(`Rollback failed for ${url}`, err);
    }
}

// Tipo de retorno da classificação
type NicheClassification = { id: string; newNicheName?: undefined } | { newNicheName: string; id?: undefined } | null;

async function analyzeOfferWithGemini(title: string, text: string, availableNiches: { id: string, nome: string }[]): Promise<NicheClassification> {
    if (!genAI) {
        await logBot('warning', `Gemini desabilitado — usando classificador local para "${title}"`);
        return classifyByKeywords(title, text, availableNiches);
    }

    const geminiResult = await withRetry(async () => {
        // Rate Limiting (Pausa de 2s para evitar 429)
        await new Promise(r => setTimeout(r, 2000));

        // Modelo atualizado — gemini-pro foi descontinuado
        // gemini-flash-latest aponta sempre para o modelo mais recente e estável
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const nichesList = availableNiches.map(n => `- "${n.nome}" (ID: ${n.id})`).join('\n');

        const prompt = `Você é um classificador de ofertas de marketing digital.

TAREFA: Classifique a oferta abaixo em um nicho de mercado.

TÍTULO DA OFERTA: "${title}"
DESCRIÇÃO: "${text.substring(0, 2000)}"

NICHOS JÁ EXISTENTES NO SISTEMA:
${nichesList || '(nenhum nicho cadastrado ainda)'}

REGRAS:
1. Se a oferta se encaixa em um nicho existente, retorne o ID dele.
2. Se NÃO se encaixa em nenhum existente, CRIE um novo nicho com um nome CURTO (1-2 palavras) em português. Exemplos: "Saúde", "Emagrecimento", "Pets", "Finanças", "Beleza", "Educação", "Tecnologia", "Automotivo", "Casa e Jardim", "Moda", "Esportes", "Jogos", "Relacionamento", "Culinária".
3. NUNCA retorne "Sem Categoria" ou "Outros". Sempre classifique em algo específico.
4. Responda APENAS com JSON puro, sem markdown, sem explicação.

FORMATO:
Se existente: {"nicheId": "ID_AQUI"}
Se novo: {"newNiche": "Nome Do Nicho"}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let output = response.text().trim();

        // Limpar markdown/código que o Gemini às vezes adiciona
        output = output.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        // Remover possíveis caracteres invisíveis no início
        output = output.replace(/^\s*\{/, '{');

        await logBot('info', `Gemini respondeu: ${output.substring(0, 200)}`, title);

        // Tentar parse JSON
        let json: any;
        try {
            json = JSON.parse(output);
        } catch (parseErr) {
            // Fallback: tentar extrair JSON de dentro do texto
            const jsonMatch = output.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                json = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error(`Gemini retornou resposta inválida (não é JSON): "${output.substring(0, 100)}"`);
            }
        }

        if (json.nicheId) {
            const existing = availableNiches.find(n => n.id === json.nicheId);
            if (existing) {
                await logBot('success', `Gemini classificou "${title}" → nicho existente: "${existing.nome}"`, title);
                return { id: json.nicheId };
            }
            // Se o ID retornado não existe, tentar pelo nome
            await logBot('warning', `Gemini retornou ID inválido: ${json.nicheId}. Tentando por nome...`, title);
        }

        if (json.newNiche) {
            // Rejeitar respostas genéricas
            const genericNames = ['sem categoria', 'outros', 'geral', 'indefinido', 'não classificado', 'unknown'];
            if (genericNames.includes(json.newNiche.toLowerCase().trim())) {
                await logBot('warning', `Gemini sugeriu nome genérico "${json.newNiche}". Usando classificador local.`, title);
                return classifyByKeywords(title, text, availableNiches);
            }
            await logBot('success', `Gemini sugeriu novo nicho: "${json.newNiche}" para "${title}"`, title);
            return { newNicheName: json.newNiche };
        }

        // Se nenhum campo reconhecido, usar fallback
        return null;
    }, `Gemini analysis for "${title}"`, 2, 3000);

    // Se o Gemini falhou completamente, usar classificação por palavras-chave
    if (!geminiResult) {
        await logBot('warning', `Gemini falhou para "${title}". Usando classificador local como fallback.`, title);
        return classifyByKeywords(title, text, availableNiches);
    }

    return geminiResult;
}

// ─────────────────────────────────────────────────────────────────
// Classificador local por palavras-chave (fallback quando Gemini falha)
// ─────────────────────────────────────────────────────────────────

function classifyByKeywords(
    title: string,
    text: string,
    availableNiches: { id: string, nome: string }[]
): NicheClassification {
    const combined = `${title} ${text}`.toLowerCase();

    // Mapa de palavras-chave → nicho sugerido
    const keywordMap: Record<string, string[]> = {
        'Saúde': ['saúde', 'saude', 'suplemento', 'cápsula', 'capsula', 'vitamina', 'remédio', 'remedio', 'imunidade', 'colágeno', 'colageno', 'detox', 'natural', 'fitoterápico'],
        'Emagrecimento': ['emagrecer', 'emagrecimento', 'dieta', 'peso', 'gordura', 'queimar', 'barriga', 'slim', 'fit', 'seca', 'metabolismo', 'termogênico'],
        'Beleza': ['beleza', 'pele', 'cabelo', 'anti-idade', 'rejuvenescimento', 'creme', 'skincare', 'ruga', 'acne', 'hidratante', 'cosmético'],
        'Finanças': ['dinheiro', 'renda', 'investimento', 'investir', 'ganhar', 'lucro', 'trade', 'trading', 'bitcoin', 'crypto', 'forex', 'financeiro', 'milionário'],
        'Relacionamento': ['relacionamento', 'conquista', 'namoro', 'casamento', 'ex', 'paquera', 'sedução', 'amor', 'casais'],
        'Educação': ['curso', 'aula', 'aprender', 'inglês', 'idioma', 'certificado', 'concurso', 'vestibular', 'enem', 'educação', 'treinamento'],
        'Pets': ['pet', 'cachorro', 'gato', 'cão', 'animal', 'ração', 'veterinário', 'adestramento'],
        'Tecnologia': ['software', 'app', 'aplicativo', 'inteligência artificial', 'ia', 'automação', 'programação', 'tech'],
        'Esportes': ['esporte', 'treino', 'academia', 'musculação', 'crossfit', 'corrida', 'futebol', 'fitness', 'whey', 'proteína'],
        'Culinária': ['receita', 'culinária', 'cozinha', 'bolo', 'comida', 'gourmet', 'confeitaria', 'gastronomia'],
        'Moda': ['moda', 'roupa', 'vestido', 'calçado', 'acessório', 'bolsa', 'joia', 'relógio', 'óculos'],
        'Casa e Jardim': ['casa', 'jardim', 'decoração', 'móveis', 'limpeza', 'organização', 'cozinha', 'banheiro'],
        'Automotivo': ['carro', 'moto', 'veículo', 'motor', 'gasolina', 'automotivo', 'acessório automotivo'],
        'Jogos': ['jogo', 'game', 'gamer', 'console', 'ps5', 'xbox', 'pc gamer', 'rpg'],
        'Marketing Digital': ['marketing', 'tráfego', 'afiliado', 'vendas online', 'lançamento', 'copywriting', 'funil', 'leads', 'infoproduto'],
    };

    // 1. Tentar encontrar match com nicho existente pelo nome
    for (const nicho of availableNiches) {
        const nichoLower = nicho.nome.toLowerCase();
        if (combined.includes(nichoLower) || nichoLower.split(' ').some(word => word.length > 3 && combined.includes(word))) {
            logger.info(`Bot: Classificador local: "${title}" → nicho existente "${nicho.nome}" (match direto)`);
            return { id: nicho.id };
        }
    }

    // 2. Tentar classificar por palavras-chave
    let bestMatch = '';
    let bestScore = 0;

    for (const [nicheName, keywords] of Object.entries(keywordMap)) {
        let score = 0;
        for (const keyword of keywords) {
            if (combined.includes(keyword)) {
                score += keyword.length; // Palavras mais longas = match mais confiável
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = nicheName;
        }
    }

    if (bestMatch && bestScore >= 4) {
        // Verificar se já existe um nicho com nome parecido
        const existingMatch = availableNiches.find(n =>
            n.nome.toLowerCase() === bestMatch.toLowerCase() ||
            n.nome.toLowerCase().includes(bestMatch.toLowerCase()) ||
            bestMatch.toLowerCase().includes(n.nome.toLowerCase())
        );

        if (existingMatch) {
            logger.info(`Bot: Classificador local: "${title}" → nicho existente "${existingMatch.nome}" (keyword match: ${bestScore})`);
            return { id: existingMatch.id };
        }

        logger.info(`Bot: Classificador local: "${title}" → novo nicho sugerido "${bestMatch}" (keyword match: ${bestScore})`);
        return { newNicheName: bestMatch };
    }

    // 3. Último recurso: extrair possível nicho do título
    // Ex: "Cápsulas Detox Premium" → "Saúde" (já coberto por keywords)
    // Se nada funcionou, usar o título como base para um novo nicho
    const titleWords = title.split(/[\s\-_]+/).filter(w => w.length > 3);
    if (titleWords.length > 0) {
        // Usar as primeiras 2 palavras significativas como nome do nicho
        const suggestedName = titleWords.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        logger.info(`Bot: Classificador local: "${title}" → gerando nicho do título: "${suggestedName}"`);
        return { newNicheName: suggestedName };
    }

    return null;
}

// Helper: Lista todos os arquivos dentro de uma pasta do Drive (PAGINADO)
async function listFilesInFolder(folderId: string): Promise<any[]> {
    if (!drive) return [];

    const allFiles: any[] = [];
    let pageToken: string | undefined = undefined;

    try {
        do {
            const res: any = await withRetry(async () => {
                return await drive.files.list({
                    q: `'${folderId}' in parents and trashed = false`,
                    fields: 'nextPageToken, files(id, name, mimeType, size)',
                    pageSize: 100,
                    pageToken: pageToken
                });
            }, `List files in folder ${folderId.substring(0, 10)}... (Page: ${pageToken ? 'next' : '1'})`);

            if (res?.data?.files) {
                allFiles.push(...res.data.files);
            }
            pageToken = res?.data?.nextPageToken;
        } while (pageToken);

        return allFiles;
    } catch (err) {
        logger.error(`Error listing folder ${folderId}:`, err);
        return [];
    }
}

// Helpers de tipo de arquivo (sem alteração)
function getFileTypeByExtension(fileName: string): 'image' | 'video' | 'text' | 'html' | 'unknown' {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'flv'].includes(ext)) return 'video';
    if (['txt', 'text', 'rtf', 'md'].includes(ext)) return 'text';
    if (['html', 'htm'].includes(ext)) return 'html';
    return 'unknown';
}

function isVideoFile(mime: string, fileName: string): boolean {
    return mime.includes('video/') || getFileTypeByExtension(fileName) === 'video';
}
function isImageFile(mime: string, fileName: string): boolean {
    return mime.includes('image/') || getFileTypeByExtension(fileName) === 'image';
}
function isTextFile(mime: string, fileName: string): boolean {
    return mime.includes('text/') || mime.includes('application/octet-stream') || getFileTypeByExtension(fileName) === 'text';
}
function isGoogleDoc(mime: string): boolean {
    return mime === 'application/vnd.google-apps.document';
}
function isGoogleAppsFile(mime: string): boolean {
    return mime.includes('google-apps') && !isGoogleDoc(mime);
}
function isDocxFile(mime: string, fileName: string): boolean {
    return mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mime === 'application/msword' ||
        fileName.toLowerCase().endsWith('.docx') ||
        fileName.toLowerCase().endsWith('.doc');
}

// Extrair texto de arquivo .docx usando mammoth
async function extractTextFromDocx(buffer: Buffer, fileName: string): Promise<string | null> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value.trim();
        if (text.length > 5) {
            return text;
        }
        logger.warn(`Bot: .docx "${fileName}" está vazio ou muito curto (${text.length} chars)`);
        return null;
    } catch (err) {
        logger.error(`Bot: Falha ao extrair texto de "${fileName}":`, err);
        return null;
    }
}

// Ceder event loop
function yieldEventLoop(): Promise<void> {
    return new Promise(resolve => setImmediate(resolve));
}

// Limite suave — logar warning mas não bloquear (Supabase Pro suporta até 5GB)
const WARN_FILE_SIZE = 50 * 1024 * 1024; // 50MB — warning
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB — limite absoluto (proteger memória)

async function getFileSize(fileId: string): Promise<number> {
    if (!drive) return 0;
    try {
        const res = await drive.files.get({ fileId, fields: 'size' });
        return parseInt(res.data.size || '0', 10);
    } catch {
        return 0;
    }
}

// Baixar arquivo do Drive (com retry e streaming)
async function downloadFile(fileId: string, fileName: string): Promise<Buffer | null> {
    if (!drive) return null;

    return withRetry(async () => {
        const fileSize = await getFileSize(fileId);
        const sizeMB = (fileSize / 1024 / 1024).toFixed(1);

        // Bloquear apenas arquivos absurdamente grandes (>500MB) para proteger memória
        if (fileSize > MAX_FILE_SIZE) {
            await logBot('warning', `⚠️ Arquivo "${fileName}" é muito grande (${sizeMB}MB > 500MB). Pulando para proteger memória.`, fileName);
            return null;
        }

        // Avisar sobre arquivos grandes mas prosseguir
        if (fileSize > WARN_FILE_SIZE) {
            await logBot('info', `📦 Arquivo grande detectado: "${fileName}" (${sizeMB}MB). Baixando...`, fileName);
        }

        await yieldEventLoop();

        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        const chunks: Buffer[] = [];
        const stream = response.data as unknown as Readable;
        let downloadedBytes = 0;

        return new Promise<Buffer>((resolve, reject) => {
            stream.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
                downloadedBytes += chunk.length;
            });
            stream.on('end', () => {
                const totalMB = (downloadedBytes / 1024 / 1024).toFixed(1);
                if (downloadedBytes > WARN_FILE_SIZE) {
                    logger.info(`Bot: ✅ Download completo: "${fileName}" (${totalMB}MB)`);
                }
                resolve(Buffer.concat(chunks));
            });
            stream.on('error', (err: Error) => {
                reject(err);
            });
        });
    }, `Download "${fileName}"`, 3, 2000);
}

// Classificar tipo de subpasta pelo nome
function classifySubfolder(name: string): 'vsl' | 'transcricao' | 'html' | 'criativo' | 'unknown' {
    const lower = name.toLowerCase().trim();
    // IMPORTANTE: checar transcrição ANTES de vsl
    if (lower.includes('transcrição') || lower.includes('transcricao') || lower.includes('transcri')) return 'transcricao';
    if (lower === 'vsl' || lower.includes('vsl')) return 'vsl';
    if (lower === 'html' || lower.includes('html') || lower.includes('landing')) return 'html';
    if (lower === 'criativo' || lower.includes('criativo') || lower.includes('creative') || lower.includes('asset')) return 'criativo';
    return 'unknown';
}

// ─────────────────────────────────────────────────────────────────
// PROCESSAMENTO PRINCIPAL — processSingleFolder
// ─────────────────────────────────────────────────────────────────

async function processSingleFolder(folderId: string, folderName: string) {
    if (!drive) return;

    // ═══ FASE 1.5 — Deduplicação Robusta ═══
    // Verificar por driveFileId (prioritário) e depois por título
    const existing = await prisma.oferta.findFirst({
        where: {
            OR: [
                { driveFileId: folderId },
                { titulo: folderName },
            ],
        },
    });

    if (existing) {
        // Se a oferta já existe E está completa, pular
        const isComplete = existing.imagem && existing.vsl && existing.texto !== 'Sem descrição';
        if (isComplete) {
            await logBot('info', `Oferta "${folderName}" já existe e está completa, pulando.`, folderName);
            return;
        }
        // Se existe mas está incompleta, deletar e reprocessar
        await logBot('info', `Oferta "${folderName}" existe mas está INCOMPLETA — reprocessando.`, folderName);
        await prisma.oferta.delete({ where: { id: existing.id } });
    }

    await logBot('info', `===== Processando pasta de oferta: "${folderName}" =====`, folderName);

    // Listar conteúdo da pasta da oferta
    const items = await listFilesInFolder(folderId);
    if (items.length === 0) {
        await logBot('warning', `Pasta "${folderName}" está vazia, pulando.`, folderName);
        return;
    }

    let titulo = folderName;
    let texto = '';
    let htmlContent = '';
    let imagemUrl: string | null = null;
    let vslUrl: string | null = null;
    let vslDescricao = '';
    const criativoUrls: string[] = [];

    // Separar subpastas e arquivos soltos
    const subfolders = items.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    const looseFiles = items.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');

    await logBot('info', `"${folderName}" tem ${subfolders.length} subpastas e ${looseFiles.length} arquivos soltos.`, folderName);

    // Log de todos os itens para debug
    for (const item of items) {
        logger.info(`Bot:   📁 Item: "${item.name}" (mime: ${item.mimeType}, size: ${item.size || 'N/A'})`);
    }

    // === PROCESSAR SUBPASTAS ===
    for (const subfolder of subfolders) {
        if (!subfolder.id || !subfolder.name) continue;
        const type = classifySubfolder(subfolder.name);
        await logBot('info', `📂 Subpasta "${subfolder.name}" → classificada como: ${type}`, folderName);

        const subFiles = await listFilesInFolder(subfolder.id);
        if (subFiles.length === 0) {
            await logBot('warning', `Subpasta "${subfolder.name}" está vazia.`, folderName);
            continue;
        }

        for (const sf of subFiles) {
            logger.info(`Bot:     📄 File: "${sf.name}" (mime: ${sf.mimeType}, size: ${sf.size || 'N/A'})`);
        }

        for (const file of subFiles) {
            if (!file.id || !file.name) continue;
            const mime = file.mimeType || '';

            if (isGoogleAppsFile(mime)) {
                logger.info(`Bot:     ⏭️ Skipping Google Apps file "${file.name}" (${mime})`);
                continue;
            }

            await yieldEventLoop();

            switch (type) {
                case 'vsl': {
                    if (isVideoFile(mime, file.name) && !vslUrl) {
                        await logBot('info', `🎥 Baixando VSL video "${file.name}"...`, folderName);
                        const buffer = await downloadFile(file.id, file.name);
                        if (buffer) {
                            const url = await uploadToSupabase(buffer, file.name, mime || 'video/mp4', BUCKET_VIDEOS);
                            if (url) {
                                vslUrl = url;
                                await logBot('success', `✅ VSL video salvo`, folderName);
                            }
                        } else {
                            await logBot('warning', `❌ Falha ao baixar VSL video "${file.name}"`, folderName);
                        }
                    }
                    break;
                }

                case 'transcricao': {
                    if (isGoogleDoc(mime) && !texto) {
                        try {
                            await logBot('info', `📝 Exportando Google Doc "${file.name}" como texto...`, folderName);
                            const docRes = await drive.files.export({
                                fileId: file.id,
                                mimeType: 'text/plain'
                            });
                            const docText = (typeof docRes.data === 'string' ? docRes.data : String(docRes.data || '')).trim();
                            if (docText.length > 5) {
                                texto = docText;
                                vslDescricao = texto.substring(0, 500);
                                await logBot('success', `✅ Transcrição carregada (${texto.length} chars)`, folderName);
                            } else {
                                await logBot('warning', `⚠️ Google Doc "${file.name}" está vazio ou muito curto`, folderName);
                            }
                        } catch (docErr) {
                            await logBot('error', `❌ Falha ao exportar Google Doc "${file.name}"`, folderName, { error: (docErr as any).message });
                        }
                    } else if (isDocxFile(mime, file.name) && !texto) {
                        await logBot('info', `📄 Baixando Word "${file.name}"...`, folderName);
                        const buffer = await downloadFile(file.id, file.name);
                        if (buffer) {
                            const docxText = await extractTextFromDocx(buffer, file.name);
                            if (docxText) {
                                texto = docxText;
                                vslDescricao = texto.substring(0, 500);
                                await logBot('success', `✅ Word (.docx) carregado (${texto.length} chars)`, folderName);
                            }
                        }
                    } else if (isTextFile(mime, file.name) && !texto) {
                        await logBot('info', `📝 Baixando arquivo de texto "${file.name}"...`, folderName);
                        const buffer = await downloadFile(file.id, file.name);
                        if (buffer) {
                            const fullText = buffer.toString('utf-8').trim();
                            if (fullText.length > 5) {
                                texto = fullText;
                                vslDescricao = texto.substring(0, 500);
                                await logBot('success', `✅ Transcrição carregada (${texto.length} chars)`, folderName);
                            } else {
                                await logBot('warning', `⚠️ Arquivo "${file.name}" muito curto (${fullText.length} chars)`, folderName);
                            }
                        }
                    }
                    break;
                }

                case 'html': {
                    if (isGoogleDoc(mime) && !htmlContent) {
                        try {
                            await logBot('info', `🌐 Exportando Google Doc "${file.name}" como HTML...`, folderName);
                            const docRes = await drive.files.export({
                                fileId: file.id,
                                mimeType: 'text/html'
                            });
                            htmlContent = (typeof docRes.data === 'string' ? docRes.data : '').trim();
                            await logBot('success', `✅ HTML do Google Doc carregado (${htmlContent.length} chars)`, folderName);
                        } catch (docErr) {
                            await logBot('error', `❌ Falha ao exportar HTML do Google Doc`, folderName, { error: (docErr as any).message });
                        }
                    } else if ((mime.includes('text/html') || mime.includes('text/plain') || file.name.toLowerCase().endsWith('.html')) && !htmlContent) {
                        const buffer = await downloadFile(file.id, file.name);
                        if (buffer) {
                            htmlContent = buffer.toString('utf-8').trim();
                            await logBot('success', `✅ HTML landing page carregada (${htmlContent.length} chars)`, folderName);
                        }
                    }
                    break;
                }

                case 'criativo': {
                    if (isImageFile(mime, file.name)) {
                        await logBot('info', `🖼️ Baixando imagem criativa "${file.name}"...`, folderName);
                        const buffer = await downloadFile(file.id, file.name);
                        if (buffer) {
                            const url = await uploadToSupabase(buffer, file.name, mime || 'image/jpeg', BUCKET_IMAGES);
                            if (url) {
                                if (!imagemUrl) {
                                    imagemUrl = url;
                                    await logBot('success', `✅ Imagem principal definida`, folderName);
                                }
                                criativoUrls.push(url);
                            }
                        }
                    } else if (isVideoFile(mime, file.name)) {
                        await logBot('info', `🎬 Baixando vídeo criativo "${file.name}"...`, folderName);
                        const buffer = await downloadFile(file.id, file.name);
                        if (buffer) {
                            const url = await uploadToSupabase(buffer, file.name, mime || 'video/mp4', BUCKET_VIDEOS);
                            if (url) {
                                criativoUrls.push(url);
                                await logBot('success', `✅ Vídeo criativo enviado`, folderName);
                            }
                        }
                    }
                    break;
                }

                default: {
                    logger.info(`Bot:     🔍 Unknown subfolder type, trying generic for "${file.name}"`);
                    if (isImageFile(mime, file.name) && !imagemUrl) {
                        const buffer = await downloadFile(file.id, file.name);
                        if (buffer) {
                            const url = await uploadToSupabase(buffer, file.name, mime || 'image/jpeg', BUCKET_IMAGES);
                            if (url) imagemUrl = url;
                        }
                    } else if (isVideoFile(mime, file.name) && !vslUrl) {
                        const buffer = await downloadFile(file.id, file.name);
                        if (buffer) {
                            const url = await uploadToSupabase(buffer, file.name, mime || 'video/mp4', BUCKET_VIDEOS);
                            if (url) vslUrl = url;
                        }
                    } else if (isTextFile(mime, file.name) && !texto) {
                        const buffer = await downloadFile(file.id, file.name);
                        if (buffer) {
                            texto = buffer.toString('utf-8').trim();
                            vslDescricao = texto.substring(0, 500);
                        }
                    }
                    break;
                }
            }
        }
    }

    // === PROCESSAR ARQUIVOS SOLTOS ===
    for (const file of looseFiles) {
        if (!file.id || !file.name) continue;
        const mime = file.mimeType || '';

        if (isGoogleAppsFile(mime)) continue;

        await yieldEventLoop();

        // Google Doc solto → texto
        if (isGoogleDoc(mime) && !texto) {
            try {
                const docRes = await drive.files.export({ fileId: file.id, mimeType: 'text/plain' });
                const docText = (typeof docRes.data === 'string' ? docRes.data : String(docRes.data || '')).trim();
                if (docText.length > 5) {
                    texto = docText;
                    vslDescricao = texto.substring(0, 500);
                    await logBot('success', `✅ Google Doc solto carregado (${texto.length} chars)`, folderName);
                }
            } catch (err) {
                await logBot('error', `❌ Falha ao exportar Google Doc solto "${file.name}"`, folderName);
            }
            continue;
        }

        const buffer = await downloadFile(file.id, file.name);
        if (!buffer) continue;

        if (isDocxFile(mime, file.name) && !texto) {
            const docxText = await extractTextFromDocx(buffer, file.name);
            if (docxText) {
                texto = docxText;
                vslDescricao = texto.substring(0, 500);
                await logBot('success', `✅ Word (.docx) solto carregado (${texto.length} chars)`, folderName);
            }
        } else if (isTextFile(mime, file.name) && !texto) {
            texto = buffer.toString('utf-8').trim();
            vslDescricao = texto.substring(0, 500);
            await logBot('success', `✅ Arquivo de texto solto carregado (${texto.length} chars)`, folderName);
        } else if (isImageFile(mime, file.name) && !imagemUrl) {
            const url = await uploadToSupabase(buffer, file.name, mime || 'image/jpeg', BUCKET_IMAGES);
            if (url) {
                imagemUrl = url;
                await logBot('success', `✅ Imagem solta enviada`, folderName);
            }
        } else if (isVideoFile(mime, file.name) && !vslUrl) {
            const url = await uploadToSupabase(buffer, file.name, mime || 'video/mp4', BUCKET_VIDEOS);
            if (url) {
                vslUrl = url;
                await logBot('success', `✅ Vídeo solto enviado como VSL`, folderName);
            }
        }
    }

    // === RESUMO ===
    const summary = {
        imagem: !!imagemUrl,
        vsl: !!vslUrl,
        texto: texto ? texto.length : 0,
        html: htmlContent ? htmlContent.length : 0,
        criativos: criativoUrls.length,
    };
    await logBot('info', `Resumo para "${titulo}": Img=${summary.imagem ? '✅' : '❌'} VSL=${summary.vsl ? '✅' : '❌'} Texto=${summary.texto}ch HTML=${summary.html}ch Criativos=${summary.criativos}`, folderName, summary);

    // === CATEGORIZAR COM GEMINI ===
    let nichoId = '';
    const availableNiches = await prisma.nicho.findMany({ select: { id: true, nome: true } });

    if (titulo) {
        const geminiText = texto || titulo;
        const geminiResult = await analyzeOfferWithGemini(titulo, geminiText, availableNiches);

        if (geminiResult && 'id' in geminiResult && geminiResult.id) {
            nichoId = geminiResult.id;
        } else if (geminiResult && 'newNicheName' in geminiResult && geminiResult.newNicheName) {
            const newNicheName = geminiResult.newNicheName;
            await logBot('info', `Criando novo nicho: ${newNicheName}`, folderName);
            try {
                const slug = newNicheName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
                const existingNiche = await prisma.nicho.findUnique({ where: { slug } });
                if (existingNiche) {
                    nichoId = existingNiche.id;
                } else {
                    const newNiche = await prisma.nicho.create({
                        data: {
                            nome: newNicheName,
                            slug: slug,
                            icone: 'tag',
                            descricao: `Ofertas de ${newNicheName}`
                        }
                    });
                    nichoId = newNiche.id;
                }
            } catch (err) {
                await logBot('error', 'Erro ao criar novo nicho', folderName, { error: (err as any).message });
            }
        }
    }

    if (!nichoId) {
        const outros = await prisma.nicho.findFirst({ where: { slug: 'outros' } });
        if (outros) nichoId = outros.id;
        else {
            const any = await prisma.nicho.findFirst();
            nichoId = any?.id || '';
        }
    }

    if (!nichoId) {
        await logBot('warning', 'Nenhum nicho encontrado. Criando fallback "Sem Categoria".', folderName);
        try {
            let defaultNiche = await prisma.nicho.findUnique({ where: { slug: 'sem-categoria' } });
            if (!defaultNiche) {
                defaultNiche = await prisma.nicho.create({
                    data: {
                        nome: 'Sem Categoria',
                        slug: 'sem-categoria',
                        icone: 'Box',
                        descricao: 'Ofertas importadas sem classificação automática'
                    }
                });
                await logBot('info', 'Nicho "Sem Categoria" criado', folderName);
            }
            nichoId = defaultNiche.id;
        } catch (err) {
            await logBot('error', 'Falha ao criar nicho fallback. Pulando oferta.', folderName, { error: (err as any).message });
            if (imagemUrl) await deleteFileFromUrl(imagemUrl);
            if (vslUrl) await deleteFileFromUrl(vslUrl);
            for (const url of criativoUrls) await deleteFileFromUrl(url);
            return;
        }
    }

    // === MONTAR LINKS ===
    const linksData: Record<string, any> = {};
    if (criativoUrls.length > 0) linksData.criativos = criativoUrls;
    if (htmlContent) linksData.html = htmlContent;

    // ═══ FASE 1.5 — Determinar Import Status ═══
    const hasImage = !!imagemUrl;
    const hasVsl = !!vslUrl;
    const hasText = !!texto && texto !== 'Sem descrição';
    const importStatus = (hasImage && hasVsl && hasText) ? 'complete' : 'partial';

    // === CRIAR OFERTA (com campos de rastreabilidade) ===
    await prisma.oferta.create({
        data: {
            titulo,
            texto: texto || 'Sem descrição',
            imagem: imagemUrl,
            vsl: vslUrl,
            vslDescricao: vslDescricao || null,
            nichoId,
            plataforma: 'facebook_ads',
            tipoOferta: 'ecommerce',
            status: 'ativa',
            linguagem: 'pt_BR',
            links: JSON.stringify(linksData),
            metricas: JSON.stringify({}),
            isActive: true,
            // Novos campos de rastreabilidade
            driveFileId: folderId,
            importSource: 'bot_v1',
            importStatus,
            importedAt: new Date(),
            importDetails: JSON.stringify({
                hasImage,
                hasVsl,
                hasText,
                hasHtml: !!htmlContent,
                creativesCount: criativoUrls.length,
                textLength: texto?.length || 0,
                classifiedByAI: !!genAI,
                cycleId: currentCycleId,
            }),
        }
    });

    const uploadSummary = [
        imagemUrl ? '📷 Imagem' : null,
        vslUrl ? '🎥 VSL' : null,
        texto ? '📝 Texto' : null,
        htmlContent ? '🌐 HTML' : null,
        criativoUrls.length > 0 ? `🎨 ${criativoUrls.length} criativos` : null,
    ].filter(Boolean).join(', ');

    await logBot('success', `✅ Oferta "${titulo}" criada (${importStatus}) [${uploadSummary}]`, folderName, {
        importStatus,
        nichoId,
    });
}

// ─────────────────────────────────────────────────────────────────
// CICLO PRINCIPAL — runBotCycle
// ─────────────────────────────────────────────────────────────────

async function runBotCycle() {
    if (!drive || !GOOGLE_DRIVE_FOLDER_ID) {
        await logBot('warning', 'Drive não configurado. Ciclo cancelado.');
        return;
    }

    // Gerar ID do ciclo para rastreabilidade
    currentCycleId = randomUUID();
    let offersProcessed = 0;
    let errorsInCycle = 0;

    try {
        await logBot('info', `Ciclo #${currentCycleId.substring(0, 8)} iniciando...`);
        await updateBotState({
            lastCycleAt: new Date(),
            currentCycleId,
        });

        // --- FASE 2.1 — Buscar Todas as Pastas (Paginação) ---
        const allOfferFolders: any[] = [];
        let pageToken: string | undefined = undefined;

        do {
            const res: any = await drive.files.list({
                q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'nextPageToken, files(id, name)',
                pageSize: 100,
                pageToken,
            });
            if (res.data?.files) {
                allOfferFolders.push(...res.data.files);
            }
            pageToken = res.data?.nextPageToken;
        } while (pageToken);

        // Filtrar pastas ignoráveis
        const IGNORE_FOLDERS = ['backup', 'temp', 'tmp', 'test', 'lixo', 'old', 'antigo'];
        const folders = allOfferFolders.filter((f: any) => {
            const lowerName = (f.name || '').toLowerCase();
            return !IGNORE_FOLDERS.some(ignore => lowerName.includes(ignore));
        });

        await logBot('info', `Encontradas ${folders.length} pastas de ofertas (${allOfferFolders.length - folders.length} ignoradas).`);

        for (let i = 0; i < folders.length; i++) {
            const folder = folders[i];

            if (!isRunning) {
                await logBot('warning', 'Bot parado no meio do ciclo.');
                break;
            }

            if (folder.id && folder.name) {
                try {
                    await logBot('info', `[${i + 1}/${folders.length}] Iniciando: "${folder.name}"`, folder.name);

                    // --- FASE 2.2 — Timeout de 10 min por pasta ---
                    // Se download/upload travar, libera o bot após 10 min
                    await withTimeout(
                        processSingleFolder(folder.id, folder.name),
                        10 * 60 * 1000,
                        `Processamento da pasta "${folder.name}"`
                    );

                    offersProcessed++;
                } catch (err: any) {
                    errorsInCycle++;
                    await logBot('error', `Erro ao processar "${folder.name}": ${err.message}`, folder.name, { error: err.message });
                }

                // Ceder event loop e pequena pausa entre ofertas
                await new Promise(r => setTimeout(r, 1000));
                await yieldEventLoop();
            }
        }

        await logBot('success', `Ciclo #${currentCycleId.substring(0, 8)} concluído: ${offersProcessed} ofertas processadas, ${errorsInCycle} erros.`);

        // Atualizar estado com métricas do ciclo
        const state = await getBotStateFromDB();
        await updateBotState({
            lastSuccessAt: new Date(),
            totalCycles: (state?.totalCycles || 0) + 1,
            totalOffers: (state?.totalOffers || 0) + offersProcessed,
            totalErrors: (state?.totalErrors || 0) + errorsInCycle,
            lastError: errorsInCycle > 0 ? `${errorsInCycle} erros no ciclo ${currentCycleId.substring(0, 8)}` : state?.lastError,
        });

    } catch (err: any) {
        await logBot('error', `Erro fatal no ciclo: ${err.message}`, undefined, {
            error: err.message,
            stack: err.stack?.substring(0, 500),
        });

        await updateBotState({
            lastErrorAt: new Date(),
            lastError: err.message,
            totalErrors: ((await getBotStateFromDB())?.totalErrors || 0) + 1,
        });
    } finally {
        currentCycleId = null;
        // Limpar logs antigos a cada ciclo
        await cleanupOldLogs();
    }
}

// ─────────────────────────────────────────────────────────────────
// CONTROLE PÚBLICO — start, stop, getStatus, getLogs, restore
// ─────────────────────────────────────────────────────────────────

export const botService = {
    start: async () => {
        if (isRunning) return { message: 'Bot já está rodando', status: 'running' };

        // Fase 1.3 — Validação de configuração
        const config = validateBotConfig();
        if (!config.valid) {
            return {
                message: 'Bot não pode iniciar — configuração incompleta',
                errors: config.errors,
                warnings: config.warnings,
                status: 'error',
            };
        }

        isRunning = true;
        await ensureBotState();
        await updateBotState({
            isRunning: true,
            startedAt: new Date(),
            stoppedAt: null,
        });

        // Log warnings (ex: Gemini desabilitado)
        for (const warning of config.warnings) {
            await logBot('warning', warning);
        }

        await logBot('success', 'Bot iniciado com sucesso.');

        // Iniciar ciclo imediatamente e agendar loop
        runBotCycle();
        loopInterval = setInterval(runBotCycle, 10 * 60 * 1000);

        return {
            message: 'Bot iniciado',
            status: 'running',
            warnings: config.warnings,
        };
    },

    stop: async () => {
        isRunning = false;
        if (loopInterval) clearInterval(loopInterval);
        loopInterval = null;

        await updateBotState({
            isRunning: false,
            stoppedAt: new Date(),
            currentCycleId: null,
        });

        await logBot('warning', 'Bot parado pelo admin.');

        return { message: 'Bot parado', status: 'stopped' };
    },

    getStatus: async () => {
        const state = await getBotStateFromDB();
        return {
            status: isRunning ? 'running' : 'stopped',
            lastCycleAt: state?.lastCycleAt || null,
            lastSuccessAt: state?.lastSuccessAt || null,
            lastErrorAt: state?.lastErrorAt || null,
            lastError: state?.lastError || null,
            totalCycles: state?.totalCycles || 0,
            totalOffers: state?.totalOffers || 0,
            totalErrors: state?.totalErrors || 0,
            startedAt: state?.startedAt || null,
            uptime: state?.startedAt && isRunning
                ? Date.now() - new Date(state.startedAt).getTime()
                : null,
            currentCycleId: currentCycleId || null,
        };
    },

    getLogs: async (limit = 50, level?: string) => {
        try {
            const where: any = {};
            if (level) where.level = level;

            const logs = await prisma.botLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: Math.min(limit, 200),
            });

            return { logs, total: logs.length };
        } catch (err) {
            logger.error('Failed to fetch bot logs:', err);
            return { logs: [], total: 0 };
        }
    },

    // Fase 1.1 — Restaurar estado após restart do servidor
    restoreState: async () => {
        try {
            await ensureBotState();
            const state = await getBotStateFromDB();
            if (state?.isRunning) {
                logger.info('Bot was running before restart — auto-resuming...');
                await botService.start();
            }
        } catch (err) {
            logger.error('Failed to restore bot state:', err);
        }
    },
};
