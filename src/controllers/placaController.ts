import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';

/**
 * Placa de faturamento (Scaleaki+). Membro solicita uma placa enviando
 * faturamento + período + comprovante. Admin aprova/rejeita e adiciona
 * tracking de envio. Fluxo de status: pendente → aprovada → enviada | rejeitada.
 */

/** POST /placa — membro solicita placa. */
export async function requestPlaca(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { faturamento, periodo, comprovante, observacao } = req.body;

    if (!faturamento || !periodo) {
      return res.status(400).json({ error: 'missing_fields', message: 'Informe faturamento e período.' });
    }
    const fat = Number(faturamento);
    if (!Number.isFinite(fat) || fat <= 0) {
      return res.status(400).json({ error: 'invalid_faturamento' });
    }

    const placa = await prisma.placaRequest.create({
      data: {
        userId,
        faturamento: fat,
        periodo: String(periodo),
        comprovante: comprovante || null,
        observacao: observacao || null,
      },
    });
    res.status(201).json({ data: placa });
  } catch (err: any) {
    logger.error('[Placa] Erro ao solicitar placa:', err);
    res.status(500).json({ error: 'Erro ao solicitar placa' });
  }
}

/** GET /placa/me — solicitações do próprio usuário. */
export async function myPlacas(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const placas = await prisma.placaRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: placas });
  } catch (err: any) {
    logger.error('[Placa] Erro ao listar placas do usuário:', err);
    res.status(500).json({ error: 'Erro ao listar placas' });
  }
}

/** GET /placa — admin lista todas (filtro por status). */
export async function listPlacas(req: Request, res: Response) {
  try {
    const { status, page = '1', limit = '30' } = req.query as Record<string, string>;
    const take = Math.min(Number(limit) || 30, 100);
    const skip = (Number(page) - 1) * take;

    const where: any = {};
    if (status) where.status = status;

    const [placas, total] = await Promise.all([
      prisma.placaRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.placaRequest.count({ where }),
    ]);

    res.json({
      data: placas,
      meta: { total, page: Number(page), limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err: any) {
    logger.error('[Placa] Erro ao listar placas:', err);
    res.status(500).json({ error: 'Erro ao listar placas' });
  }
}

/** PATCH /placa/:id — admin muda status/tracking. */
export async function updatePlaca(req: Request, res: Response) {
  try {
    const { status, adminNote, trackingUrl } = req.body;
    const valid = ['pendente', 'aprovada', 'enviada', 'rejeitada'];
    const data: any = {};
    if (status !== undefined) {
      if (!valid.includes(status)) return res.status(400).json({ error: 'invalid_status' });
      data.status = status;
    }
    if (adminNote !== undefined) data.adminNote = adminNote;
    if (trackingUrl !== undefined) data.trackingUrl = trackingUrl;

    const placa = await prisma.placaRequest.update({ where: { id: req.params.id }, data });
    res.json({ data: placa });
  } catch (err: any) {
    logger.error('[Placa] Erro ao atualizar placa:', err);
    res.status(500).json({ error: 'Erro ao atualizar placa' });
  }
}
