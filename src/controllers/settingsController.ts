import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';
import { AuthRequest } from '../middlewares/authMiddleware';

function tryParseJSON(value: any) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

// Lista de campos válidos do schema UserSettings (excluindo id, userId, createdAt, updatedAt, user)
// Esta lista deve conter TODOS os campos do schema UserSettings para garantir que todas as preferências possam ser salvas
const VALID_SETTINGS_FIELDS = [
  // ===== APARÊNCIA =====
  'theme', 'accentColor', 'density', 'fontSize', 'animationsEnabled', 'cards3DEnabled',
  // ===== IDIOMA =====
  'language',
  // ===== DASHBOARD =====
  'defaultLayout', 'itemsPerPage', 'defaultSort', 'showMetricsOnCard', 'autoRefresh', 'refreshInterval',
  // ===== NOTIFICAÇÕES EMAIL =====
  'emailNewOffers', 'emailNewOffersFreq', 'emailRecommendations', 'emailRecoFrequency', 
  'emailRecoTime', 'emailRecoDayOfWeek', 'emailPerformance', 'emailPerfMinRoi', 'emailPerfMinCtr', 
  'emailWeeklySummary', 'emailUpdates', 'emailNewsletter',
  // ===== NOTIFICAÇÕES IN-APP =====
  'inAppNewOffers', 'inAppSimilar', 'inAppPerformance', 'inAppFrequency',
  // ===== PUSH =====
  'pushEnabled', 'pushSubscription', 'pushHighPerformance', 'pushMinRoi', 'pushMinCtr', 
  'pushReminders', 'pushReminderDays',
  // ===== PRIVACIDADE =====
  'profilePublic', 'showActivities', 'shareStats',
  // ===== CONTEÚDO =====
  'favoriteNichos', 'preferredPlataformas', 'defaultStatus', 'preferredTipoOferta', 
  'minRoi', 'minCtr', 'preferredLanguages',
  // ===== RECOMENDAÇÕES =====
  'recoAlgorithm', 'recoFrequency', 'recoDiversity', 'excludedNichos'
];

function serializeSettings(data: any) {
  const out: any = {};
  // Filtrar apenas campos válidos do schema
  for (const key of VALID_SETTINGS_FIELDS) {
    if (key in data) {
      out[key] = data[key];
    }
  }
  
  // Serializar campos JSON
  const jsonFields = ['favoriteNichos','preferredPlataformas','defaultStatus','preferredTipoOferta','preferredLanguages'];
  for (const f of jsonFields) {
    if (Array.isArray(out[f])) out[f] = JSON.stringify(out[f]);
  }
  return out;
}

function parseSettings(data: any) {
  if (!data) return data;
  const out: any = { ...data };
  const jsonFields = ['favoriteNichos','preferredPlataformas','defaultStatus','preferredTipoOferta','preferredLanguages'];
  for (const f of jsonFields) {
    if (typeof out[f] === 'string') out[f] = tryParseJSON(out[f]);
  }
  return out;
}

export async function getSettings(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });

    const settings = await prisma.userSettings.findUnique({ where: { userId: req.user.userId } });
    return res.json({ success: true, data: parseSettings(settings) });
  } catch (error) {
    logger.error('Error fetching user settings', { error: error instanceof Error ? error.message : String(error), userId: req.user?.userId });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateSettings(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });

    const data = serializeSettings(req.body ?? {});

    const updated = await prisma.userSettings.upsert({
      where: { userId: req.user.userId },
      update: { ...data },
      create: { userId: req.user.userId, ...data },
    });

    return res.json({ success: true, data: parseSettings(updated) });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error?.code;
    
    logger.error('Error updating user settings', { 
      error: errorMessage, 
      code: errorCode,
      userId: req.user?.userId,
      body: req.body 
    });
    
    // Erros específicos do Prisma
    if (errorCode === 'P2002') {
      return res.status(400).json({ success: false, error: 'Conflito ao salvar preferências. Tente novamente.' });
    }
    
    if (errorCode === 'P2025') {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }
    
    // Erro de validação do Prisma (campo inválido)
    if (errorMessage?.includes('Unknown argument') || errorMessage?.includes('Invalid value')) {
      logger.warn('Invalid field in settings update', { fields: Object.keys(req.body ?? {}) });
      return res.status(400).json({ success: false, error: 'Campos inválidos nas preferências.' });
    }
    
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}


