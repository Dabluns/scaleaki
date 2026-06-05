import prisma from '../config/database';

export const DAILY_FREE_LIMIT = 10;

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function countViewsToday(userId: string): Promise<number> {
  return prisma.anuncioView.count({
    where: { userId, viewedAt: { gte: startOfToday() } },
  });
}

export async function recordView(userId: string, anuncioId: string): Promise<void> {
  await prisma.anuncioView.upsert({
    where: { userId_anuncioId: { userId, anuncioId } },
    create: { userId, anuncioId },
    update: { viewedAt: new Date() },
  });
}

export async function viewedTodayIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.anuncioView.findMany({
    where: { userId, viewedAt: { gte: startOfToday() } },
    select: { anuncioId: true },
  });
  return new Set(rows.map(r => r.anuncioId));
}
