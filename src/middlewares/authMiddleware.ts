import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import authConfig from '../config/auth';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  let token = null;
  // Tentar pegar do header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Se não houver, tentar pegar do cookie
  if (!token && req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token não fornecido.' });
  }
  try {
    const decoded = jwt.verify(token, authConfig.JWT_SECRET) as any;

    // Verificar se o email está confirmado
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { emailConfirmed: true, isActive: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Usuário não encontrado.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Conta inativa.' });
    }

    // O projeto é pago, logo o bloqueio de rota por e-mail não confirmado foi removido
    /* if (!user.emailConfirmed) {
      return res.status(403).json({ 
        success: false, 
        error: 'Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de continuar.' 
      });
    } */

    (req as AuthRequest).user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token inválido.' });
  }
} 