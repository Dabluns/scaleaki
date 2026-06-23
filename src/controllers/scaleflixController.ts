import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';

/**
 * Scaleflix — biblioteca de vídeos/aulas do Scaleaki+. Leitura para membros;
 * escrita só admin. Gating de acesso fica na rota (requirePaid/tier plus).
 */

/** GET /scaleflix — lista vídeos ativos agrupáveis por módulo. */
export async function listVideos(req: Request, res: Response) {
  try {
    const { module: mod } = req.query as Record<string, string>;
    const where: any = { isActive: true };
    if (mod) where.module = mod;

    const videos = await prisma.scaleflixVideo.findMany({
      where,
      orderBy: [{ module: 'asc' }, { ordem: 'asc' }],
    });
    res.json({ data: videos });
  } catch (err: any) {
    logger.error('[Scaleflix] Erro ao listar vídeos:', err);
    res.status(500).json({ error: 'Erro ao listar vídeos' });
  }
}

/** GET /scaleflix/:id — detalhe de um vídeo. */
export async function getVideo(req: Request, res: Response) {
  try {
    const video = await prisma.scaleflixVideo.findUnique({ where: { id: req.params.id } });
    if (!video || !video.isActive) return res.status(404).json({ error: 'not_found' });
    res.json({ data: video });
  } catch (err: any) {
    logger.error('[Scaleflix] Erro ao buscar vídeo:', err);
    res.status(500).json({ error: 'Erro ao buscar vídeo' });
  }
}

/** POST /scaleflix — cria vídeo (admin). */
export async function createVideo(req: Request, res: Response) {
  try {
    const { title, description, thumbnailUrl, videoUrl, durationSec, module: mod, ordem } = req.body;
    if (!title || !videoUrl) return res.status(400).json({ error: 'missing_fields' });

    const video = await prisma.scaleflixVideo.create({
      data: {
        title,
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        videoUrl,
        durationSec: durationSec ? Number(durationSec) : null,
        module: mod || null,
        ordem: ordem ? Number(ordem) : 0,
      },
    });
    res.status(201).json({ data: video });
  } catch (err: any) {
    logger.error('[Scaleflix] Erro ao criar vídeo:', err);
    res.status(500).json({ error: 'Erro ao criar vídeo' });
  }
}

/** PATCH /scaleflix/:id — edita vídeo (admin). */
export async function updateVideo(req: Request, res: Response) {
  try {
    const { title, description, thumbnailUrl, videoUrl, durationSec, module: mod, ordem, isActive } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;
    if (videoUrl !== undefined) data.videoUrl = videoUrl;
    if (durationSec !== undefined) data.durationSec = durationSec ? Number(durationSec) : null;
    if (mod !== undefined) data.module = mod;
    if (ordem !== undefined) data.ordem = Number(ordem);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const video = await prisma.scaleflixVideo.update({ where: { id: req.params.id }, data });
    res.json({ data: video });
  } catch (err: any) {
    logger.error('[Scaleflix] Erro ao atualizar vídeo:', err);
    res.status(500).json({ error: 'Erro ao atualizar vídeo' });
  }
}

/** DELETE /scaleflix/:id — soft delete (admin). */
export async function deleteVideo(req: Request, res: Response) {
  try {
    await prisma.scaleflixVideo.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ ok: true });
  } catch (err: any) {
    logger.error('[Scaleflix] Erro ao remover vídeo:', err);
    res.status(500).json({ error: 'Erro ao remover vídeo' });
  }
}
