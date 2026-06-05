export interface AccessUser {
  role: string;
  plan: string;
  subscription?: { status: string; endDate: Date | null } | null;
}

const ACTIVE_SUB = new Set(['active', 'trial']);

export function hasPaidAccess(user: AccessUser): boolean {
  if (user.role === 'admin') return true;
  if (user.plan === 'free') return false;
  const sub = user.subscription;
  if (!sub || !ACTIVE_SUB.has(sub.status)) return false;
  if (sub.endDate && sub.endDate.getTime() <= Date.now()) return false;
  return true;
}
