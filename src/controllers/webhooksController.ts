import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';
import crypto from 'crypto';
import logger from '../config/logger';

function signPayload(secret: string, payload: any) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export async function inboundHandler(req: any, res: Response) {
  try {
    // Espera raw body para validação de assinatura
    const rawBody: Buffer = req.body as Buffer;
    const bodyString = rawBody?.toString('utf8') || '';
    const providedSig = req.header('X-Webhook-Signature') || req.header('x-webhook-signature');
    const webhookId = req.header('X-Webhook-Id') || req.header('x-webhook-id');

    if (!webhookId) return res.status(400).json({ success: false, error: 'Webhook ID ausente' });

    const w = await prisma.webhook.findUnique({ where: { id: String(webhookId) } });
    if (!w) return res.status(404).json({ success: false, error: 'Webhook não encontrado' });

    // Validar assinatura se houver segredo
    if (w.secret) {
      const expected = signPayload(w.secret, bodyString);
      if (!providedSig || providedSig !== expected) {
        await prisma.webhookLog.create({ data: { webhookId: w.id, event: 'inbound', payload: bodyString, response: null, statusCode: 401, success: false, errorMessage: 'Assinatura inválida' } });
        return res.status(401).json({ success: false, error: 'Assinatura inválida' });
      }
    }

    // Registrar log e responder OK
    await prisma.webhookLog.create({ data: { webhookId: w.id, event: 'inbound', payload: bodyString, response: null, statusCode: 200, success: true, errorMessage: null } });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('inboundHandler error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function listWebhooks(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const w = await prisma.webhook.findMany({ where: { userId: req.user.userId } });
    return res.json({ success: true, data: w });
  } catch (error: any) {
    logger.error('listWebhooks error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createWebhook(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { name, url, secret, events, headers } = req.body || {};
    const w = await prisma.webhook.create({ data: { userId: req.user.userId, name, url, secret, events: JSON.stringify(events || []), headers: headers ? JSON.stringify(headers) : null } });
    return res.json({ success: true, data: w });
  } catch (error: any) {
    logger.error('createWebhook error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateWebhook(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { id } = req.params;
    const { name, url, secret, events, headers } = req.body || {};
    const w = await prisma.webhook.update({ where: { id }, data: { name, url, secret, events: events ? JSON.stringify(events) : undefined, headers: headers ? JSON.stringify(headers) : undefined } });
    return res.json({ success: true, data: w });
  } catch (error: any) {
    logger.error('updateWebhook error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deleteWebhook(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { id } = req.params;
    await prisma.webhook.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    logger.error('deleteWebhook error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function testWebhook(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { id } = req.params;
    const w = await prisma.webhook.findUnique({ where: { id } });
    if (!w || w.userId !== req.user.userId) return res.status(404).json({ success: false, error: 'Webhook não encontrado' });

    const payload = { event: 'oferta.test', timestamp: new Date().toISOString() };
    const signature = w.secret ? signPayload(w.secret, payload) : undefined;

    const headers: any = { 'Content-Type': 'application/json' };
    if (signature) headers['X-Webhook-Signature'] = signature;
    if (w.headers) Object.assign(headers, JSON.parse(w.headers));

    const resp = await fetch(w.url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const ok = resp.ok;

    await prisma.webhookLog.create({ data: { webhookId: w.id, event: 'oferta.test', payload: JSON.stringify(payload), response: null, statusCode: resp.status, success: ok, errorMessage: ok ? null : `HTTP ${resp.status}` } });

    return res.json({ success: ok, status: resp.status });
  } catch (error: any) {
    logger.error('testWebhook error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getWebhookLogs(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.userId) return res.status(401).json({ success: false, error: 'Não autenticado.' });
    const { id } = req.params;
    const logs = await prisma.webhookLog.findMany({ where: { webhookId: id }, orderBy: { createdAt: 'desc' }, take: 100 });
    return res.json({ success: true, data: logs });
  } catch (error: any) {
    logger.error('getWebhookLogs error', { error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

