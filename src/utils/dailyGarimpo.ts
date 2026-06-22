import prisma from '../config/database';
import { startOfToday } from './dailyViews';

/**
 * Conta garimpos distintos feitos pelo usuário hoje.
 * Garimpo = salvar um anúncio via extensão (rota /fb-ads/user-save).
 */
export async function countGarimposToday(userId: string): Promise<number> {
  return prisma.garimpoLog.count({
    where: { userId, garimpedAt: { gte: startOfToday() } },
  });
}

/**
 * Registra um garimpo. Idempotente por (userId, fbAdId): se o usuário
 * re-garimpa o mesmo anúncio, atualiza o timestamp e NÃO conta de novo no dia
 * (o unique constraint garante uma linha por par). Retorna true se foi um
 * anúncio novo para o usuário (deve consumir cota), false se já existia.
 */
export async function recordGarimpo(userId: string, fbAdId: string): Promise<boolean> {
  const existing = await prisma.garimpoLog.findUnique({
    where: { userId_fbAdId: { userId, fbAdId } },
  });
  if (existing) {
    await prisma.garimpoLog.update({
      where: { userId_fbAdId: { userId, fbAdId } },
      data: { garimpedAt: new Date() },
    });
    return false;
  }
  await prisma.garimpoLog.create({ data: { userId, fbAdId } });
  return true;
}
