import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';
import type { ProductSource } from '@prisma/client';

/**
 * Controller unificado dos 5 marketplaces (dropshipping, mercadolivre,
 * aliexpress, shopee, shein). A origem vem da rota (req.params.source ou
 * fixada pela rota). Gating de feature fica no middleware requireFeature.
 *
 * Freemium: req.featureLimit (injetado pelo requireFeature) corta a amostra.
 */

const SOURCES: ProductSource[] = ['dropshipping', 'mercadolivre', 'aliexpress', 'shopee', 'shein'];

function parseSource(raw?: string): ProductSource | null {
  if (!raw) return null;
  return SOURCES.includes(raw as ProductSource) ? (raw as ProductSource) : null;
}

/** GET /marketplace/:source — lista produtos escalados da origem. */
export async function listProducts(req: Request, res: Response) {
  try {
    const source = parseSource(req.params.source);
    if (!source) return res.status(400).json({ error: 'invalid_source' });

    const {
      page = '1',
      limit = '24',
      search,
      category,
      discountMin,
      orderBy = 'escala',
      order = 'desc',
    } = req.query as Record<string, string>;

    const take = Math.min(Number(limit) || 24, 100);
    const skip = (Number(page) - 1) * take;

    const where: any = { source, isActive: true };
    if (category) where.category = category;
    if (discountMin) where.discountPct = { gte: Number(discountMin) };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { storeName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const validOrder = ['escala', 'soldCount', 'discountPct', 'price', 'createdAt'];
    const sortField = validOrder.includes(orderBy) ? orderBy : 'escala';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    // Freemium: amostra limitada injeta teto no take
    const featureLimit = (req as any).featureLimit as number | null;
    const effectiveTake = featureLimit != null ? Math.min(take, featureLimit) : take;
    const limitReached = featureLimit != null;

    const [products, total] = await Promise.all([
      prisma.scaledProduct.findMany({
        where,
        skip: limitReached ? 0 : skip,
        take: effectiveTake,
        orderBy: { [sortField]: sortOrder },
      }),
      prisma.scaledProduct.count({ where }),
    ]);

    res.json({
      data: products,
      meta: {
        total: limitReached ? Math.min(total, featureLimit!) : total,
        page: limitReached ? 1 : Number(page),
        limit: effectiveTake,
        pages: limitReached ? 1 : Math.ceil(total / effectiveTake),
      },
      limitReached,
      source,
    });
  } catch (err: any) {
    logger.error('[Marketplace] Erro ao listar produtos:', err);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
}

/** GET /marketplace/:source/:id — detalhe de um produto. */
export async function getProduct(req: Request, res: Response) {
  try {
    const source = parseSource(req.params.source);
    if (!source) return res.status(400).json({ error: 'invalid_source' });

    const product = await prisma.scaledProduct.findUnique({ where: { id: req.params.id } });
    if (!product || product.source !== source) return res.status(404).json({ error: 'not_found' });

    res.json({ data: product });
  } catch (err: any) {
    logger.error('[Marketplace] Erro ao buscar produto:', err);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
}

/** GET /marketplace/:source/meta/categories — categorias distintas. */
export async function listCategories(req: Request, res: Response) {
  try {
    const source = parseSource(req.params.source);
    if (!source) return res.status(400).json({ error: 'invalid_source' });

    const rows = await prisma.scaledProduct.findMany({
      where: { source, isActive: true, category: { not: null } },
      distinct: ['category'],
      select: { category: true },
      take: 100,
    });
    res.json({ data: rows.map((r) => r.category).filter(Boolean) });
  } catch (err: any) {
    logger.error('[Marketplace] Erro ao listar categorias:', err);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
}
