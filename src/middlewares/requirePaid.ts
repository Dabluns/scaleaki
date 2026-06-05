import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { hasPaidAccess } from '../utils/access';

/** Bloqueia rota se o usuário não tem acesso pago (free → 403 paid_required). */
export async function requirePaid(req: Request, res: Response, next: NextFunction) {
  const auth = (req as any).user;
  if (!auth?.userId) return res.status(401).json({ error: 'unauthenticated' });

  if (auth.role === 'admin') return next();

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { subscription: true },
  });
  if (!user || !hasPaidAccess(user as any)) {
    return res.status(403).json({ error: 'paid_required', message: 'Recurso disponível apenas no plano pago.' });
  }
  next();
}
