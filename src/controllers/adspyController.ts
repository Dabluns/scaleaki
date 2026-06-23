import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';
import type { AdPlatform } from '@prisma/client';

/**
 * Controller unificado do AdSpy (youtube, tiktok). Plataforma vem da rota.
 * Gating no middleware requireFeature(adspy_youtube|adspy_tiktok).
 */

const PLATFORMS: AdPlatform[] = ['youtube', 'tiktok'];

function parsePlatform(raw?: string): AdPlatform | null {
  if (!raw) return null;
  return PLATFORMS.includes(raw as AdPlatform) ? (raw as AdPlatform) : null;
}

/** GET /adspy/:platform — lista anúncios escalados. */
export async function listAds(req: Request, res: Response) {
  try {
    const platform = parsePlatform(req.params.platform);
    if (!platform) return res.status(400).json({ error: 'invalid_platform' });

    const {
      page = '1',
      limit = '24',
      search,
      orderBy = 'escala',
      order = 'desc',
    } = req.query as Record<string, string>;

    const take = Math.min(Number(limit) || 24, 100);
    const skip = (Number(page) - 1) * take;

    const where: any = { platform, isActive: true };
    if (search) {
      where.OR = [
        { advertiser: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { adCopy: { contains: search, mode: 'insensitive' } },
      ];
    }

    const validOrder = ['escala', 'views', 'likes', 'createdAt', 'lastSeen'];
    const sortField = validOrder.includes(orderBy) ? orderBy : 'escala';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [ads, total] = await Promise.all([
      prisma.scaledAd.findMany({
        where,
        skip,
        take,
        orderBy: { [sortField]: sortOrder },
      }),
      prisma.scaledAd.count({ where }),
    ]);

    res.json({
      data: ads,
      meta: { total, page: Number(page), limit: take, pages: Math.ceil(total / take) },
      platform,
    });
  } catch (err: any) {
    logger.error('[AdSpy] Erro ao listar anúncios:', err);
    res.status(500).json({ error: 'Erro ao listar anúncios' });
  }
}

/** GET /adspy/:platform/:id — detalhe. */
export async function getAd(req: Request, res: Response) {
  try {
    const platform = parsePlatform(req.params.platform);
    if (!platform) return res.status(400).json({ error: 'invalid_platform' });

    const ad = await prisma.scaledAd.findUnique({ where: { id: req.params.id } });
    if (!ad || ad.platform !== platform) return res.status(404).json({ error: 'not_found' });

    res.json({ data: ad });
  } catch (err: any) {
    logger.error('[AdSpy] Erro ao buscar anúncio:', err);
    res.status(500).json({ error: 'Erro ao buscar anúncio' });
  }
}
