import { Request } from 'express';

/**
 * Obtém o IP real do cliente, considerando proxies e headers como x-forwarded-for
 * @param req - Request do Express
 * @returns IP do cliente ou 'unknown' se não for possível determinar
 */
export function getClientIp(req: Request): string {
  // Verificar header x-forwarded-for (usado por proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for pode conter múltiplos IPs separados por vírgula
    // O primeiro é geralmente o IP original do cliente
    const ips = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor).split(',');
    const firstIp = ips[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  // Verificar header x-real-ip (usado por alguns proxies)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    const ip = Array.isArray(realIp) ? realIp[0] : realIp;
    if (ip) {
      return ip.trim();
    }
  }

  // Verificar header cf-connecting-ip (Cloudflare)
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) {
    const ip = Array.isArray(cfIp) ? cfIp[0] : cfIp;
    if (ip) {
      return ip.trim();
    }
  }

  // Usar req.ip (configurado pelo express com trust proxy)
  if (req.ip) {
    return req.ip;
  }

  // Fallback para connection.remoteAddress
  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress;
  }

  return 'unknown';
}

