// Vercel Serverless Function para webhook GeekPay.
// Handler puro, sem Express, sem DB.
// Valida signature HMAC-SHA256 per contrato v1.0.
// Doc: docs/SCALEAKI-INTEGRATION.md

import crypto from 'crypto';

const SECRET = process.env.GEEKPAY_WEBHOOK_SECRET || '';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

interface VercelLikeRequest {
  method?: string;
  body: any;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelLikeResponse {
  status: (code: number) => VercelLikeResponse;
  json: (data: any) => VercelLikeResponse;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  // Health check via GET
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      message: 'Scaleaki GeekPay webhook endpoint',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = (req.headers['x-geekpay-signature'] as string) || '';
  const ts = (req.headers['x-geekpay-timestamp'] as string) || '';
  const event = (req.headers['x-geekpay-event'] as string) || '';
  const delivery = (req.headers['x-geekpay-delivery'] as string) || '';

  if (!SECRET) {
    console.error('[GeekPay] GEEKPAY_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  if (!sig || !ts) {
    return res.status(401).json({ error: 'Missing signature or timestamp' });
  }

  // Anti-replay
  const tsMs = Date.parse(ts);
  if (Number.isNaN(tsMs)) {
    return res.status(401).json({ error: 'Invalid timestamp' });
  }
  const ageMs = Math.abs(Date.now() - tsMs);
  if (ageMs > 5 * 60 * 1000) {
    return res.status(401).json({ error: 'Timestamp out of window' });
  }

  // rawBody — Vercel parseia JSON automaticamente. Reconstruir string canônica.
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});

  const expected = 'sha256=' + crypto
    .createHmac('sha256', SECRET)
    .update(`${ts}.${rawBody}`)
    .digest('hex');

  const sigValue = sig.startsWith('sha256=') ? sig : 'sha256=' + sig;
  if (!safeEqual(sigValue, expected)) {
    console.warn('[GeekPay] invalid signature', { sig_prefix: sigValue.slice(0, 12) });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse
  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const eventType = (payload?.event || event || '').toLowerCase();
  const data = payload?.data || {};
  const productSlug = data.product_slug;
  const plan = productSlug === 'scaleaki-mensal' ? 'mensal'
    : productSlug === 'scaleaki-trimestral' ? 'trimestral'
    : productSlug === 'scaleaki-anual' ? 'anual' : null;
  const customerEmail = data.customer?.email;
  const externalId = data.external_id || data.id;

  console.log('[GeekPay] webhook received', JSON.stringify({
    event: eventType,
    delivery: delivery.slice(0, 8),
    productSlug,
    plan,
    gateway: data.gateway,
    externalId,
    email: customerEmail,
    amount_cents: data.amount_cents,
  }));

  // TODO: ativar subscription no DB (Postgres) — bloqueado por limitação de rede atual.
  // Por ora, apenas log e retorna 200.
  return res.status(200).json({
    received: true,
    event: eventType,
    delivery: delivery.slice(0, 8),
    plan,
    externalId,
    note: 'DB activation skipped — signature validated OK',
  });
}