import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';
import logger from '../config/logger';

export async function requestExport(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const client: any = prisma as any;
    if (!client.dataExportRequest) {
      return res.status(501).json({ success: false, error: 'Exportação indisponível: execute as migrations do Prisma.' });
    }
    const r = await client.dataExportRequest.create({ data: { userId: req.user.userId, format: 'json', status: 'pending' } });
    return res.json({ success: true, data: { id: r.id } });
  } catch (error: any) {
    logger.error('requestExport error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function listRequests(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const client: any = prisma as any;
    if (!client.dataExportRequest) {
      return res.json({ success: true, data: [] });
    }
    const list = await client.dataExportRequest.findMany({ where: { userId: req.user.userId }, orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, data: list });
  } catch (error: any) {
    logger.error('listRequests error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getRequest(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { id } = req.params;
    const client: any = prisma as any;
    if (!client.dataExportRequest) {
      return res.status(404).json({ success: false, error: 'Não encontrado' });
    }
    const r = await client.dataExportRequest.findUnique({ where: { id } });
    if (!r || r.userId !== req.user.userId) return res.status(404).json({ success: false, error: 'Não encontrado' });
    return res.json({ success: true, data: r });
  } catch (error: any) {
    logger.error('getRequest error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function downloadFile(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { id } = req.params;
    const client: any = prisma as any;
    if (!client.dataExportRequest) {
      return res.status(404).json({ success: false, error: 'Não encontrado' });
    }
    const r = await client.dataExportRequest.findUnique({ where: { id } });
    if (!r || r.userId !== req.user.userId) return res.status(404).json({ success: false, error: 'Não encontrado' });
    if (!r.fileUrl) return res.status(400).json({ success: false, error: 'Arquivo não disponível.' });
    // Nesta versão, apenas retorna a URL pública/local do arquivo
    return res.json({ success: true, data: { url: r.fileUrl } });
  } catch (error: any) {
    logger.error('downloadFile error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

