import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../config/database';
import crypto from 'crypto';
import net from 'net';
import { lookup } from 'dns/promises';
import logger from '../config/logger';

function signPayload(secret: string, payload: any) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/** Detecta IP privado/loopback/link-local (inclui metadata cloud 169.254.x). */
function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local + metadata cloud
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true; // multicast/reservado
    return false;
  }
  const v = ip.toLowerCase();
  if (v === '::1' || v === '::') return true;
  if (v.startsWith('fe80')) return true; // link-local
  if (v.startsWith('fc') || v.startsWith('fd')) return true; // ULA
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return false;
}

/**
 * Valida URL de webhook contra SSRF. Lança Error se insegura.
 * Bloqueia protocolos não-http(s), hosts internos e IPs privados/loopback/link-local.
 */
async function assertSafeWebhookUrl(raw?: string): Promise<void> {
  if (!raw) throw new Error('URL ausente');
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error('URL inválida');
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('Protocolo não permitido');
  const host = u.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.internal') ||
    host.endsWith('.local')
  ) {
    throw new Error('Host não permitido');
  }
  let ips: string[];
  if (net.isIP(host)) {
    ips = [host];
  } else {
    const recs = await lookup(host, { all: true });
    ips = recs.map((r) => r.address);
  }
  if (ips.length === 0) throw new Error('Host não resolve');
  for (const ip of ips) {
    if (isPrivateIp(ip)) throw new Error('Endereço de destino não permitido');
  }
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
    try { await assertSafeWebhookUrl(url); } catch (e: any) { return res.status(400).json({ success: false, error: `URL inválida: ${e.message}` }); }
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
    if (url !== undefined) {
      try { await assertSafeWebhookUrl(url); } catch (e: any) { return res.status(400).json({ success: false, error: `URL inválida: ${e.message}` }); }
    }
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

    // Revalida no momento do disparo (defesa contra registros antigos / DNS rebinding)
    try { await assertSafeWebhookUrl(w.url); } catch (e: any) { return res.status(400).json({ success: false, error: `URL não permitida: ${e.message}` }); }

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

