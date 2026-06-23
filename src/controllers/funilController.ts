import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';
import { scanUrl } from '../services/urlscan.service';

/**
 * Tráfego & Funil (Scaleaki+). Usuário envia um domínio; rodamos o scan via
 * URLscan e devolvemos checkout, tecnologia, pixels, subdomínios e serviços
 * externos. Persistimos em FunnelExtraction para histórico do usuário.
 */

/** Normaliza entrada para uma URL https válida. */
function normalizeUrl(raw: string): string | null {
  if (!raw) return null;
  let v = raw.trim();
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    const u = new URL(v);
    if (!u.hostname.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** POST /funil — { domain } → roda scan e persiste extração. */
export async function extractFunnel(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const { domain } = req.body as { domain?: string };

  const url = normalizeUrl(domain || '');
  if (!url) return res.status(400).json({ error: 'invalid_domain', message: 'Informe um domínio válido.' });

  // Registra a extração como pending
  const record = await prisma.funnelExtraction.create({
    data: { userId, domain: url, status: 'pending' },
  });

  try {
    const scan = await scanUrl(url);

    const updated = await prisma.funnelExtraction.update({
      where: { id: record.id },
      data: {
        checkout: scan.checkout,
        tecnologia: scan.tecnologia,
        activePixels: JSON.stringify(scan.activePixels),
        subdomains: JSON.stringify(scan.subdomains),
        externalServices: JSON.stringify(scan.externalServices),
        screenshot: scan.screenshot,
        redirectChain: JSON.stringify(scan.redirectChain),
        urlscanUuid: scan.uuid,
        status: 'done',
      },
    });

    res.json({ data: serialize(updated) });
  } catch (err: any) {
    logger.error('[Funil] Erro ao extrair funil:', err);
    await prisma.funnelExtraction.update({
      where: { id: record.id },
      data: { status: 'failed' },
    }).catch(() => {});
    res.status(502).json({ error: 'scan_failed', message: 'Não foi possível analisar este domínio agora.' });
  }
}

/** GET /funil — histórico do usuário. */
export async function listFunnels(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const take = Math.min(Number(limit) || 20, 50);
    const skip = (Number(page) - 1) * take;

    const [rows, total] = await Promise.all([
      prisma.funnelExtraction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.funnelExtraction.count({ where: { userId } }),
    ]);

    res.json({
      data: rows.map(serialize),
      meta: { total, page: Number(page), limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err: any) {
    logger.error('[Funil] Erro ao listar histórico:', err);
    res.status(500).json({ error: 'Erro ao listar histórico' });
  }
}

/** GET /funil/:id — detalhe (só do próprio usuário). */
export async function getFunnel(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const row = await prisma.funnelExtraction.findUnique({ where: { id: req.params.id } });
    if (!row || row.userId !== userId) return res.status(404).json({ error: 'not_found' });
    res.json({ data: serialize(row) });
  } catch (err: any) {
    logger.error('[Funil] Erro ao buscar extração:', err);
    res.status(500).json({ error: 'Erro ao buscar extração' });
  }
}

/** Desserializa campos JSON-string para arrays antes de devolver. */
function serialize(row: any) {
  const parse = (v: string | null) => {
    if (!v) return [];
    try { return JSON.parse(v); } catch { return []; }
  };
  return {
    ...row,
    activePixels: parse(row.activePixels),
    subdomains: parse(row.subdomains),
    externalServices: parse(row.externalServices),
    redirectChain: parse(row.redirectChain),
  };
}
