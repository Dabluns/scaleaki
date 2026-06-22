export type PlanTier = 'free' | 'basico' | 'plus';

export interface AccessUser {
  role: string;
  plan: string;
  tier?: string | null;
  subscription?: { status: string; endDate: Date | null } | null;
}

const ACTIVE_SUB = new Set(['active', 'trial']);

/** Assinatura paga ativa? (admin sempre true). Não diferencia tier. */
export function hasPaidAccess(user: AccessUser): boolean {
  if (user.role === 'admin') return true;
  if (user.plan === 'free') return false;
  const sub = user.subscription;
  if (!sub || !ACTIVE_SUB.has(sub.status)) return false;
  if (sub.endDate && sub.endDate.getTime() <= Date.now()) return false;
  return true;
}

/**
 * Tier de produto efetivo do usuário (escada free < basico < plus).
 * - admin → plus (vê tudo)
 * - sem assinatura paga ativa → free (ignora tier salvo; assinatura vencida não dá acesso)
 * - pago → tier salvo no user (default basico se ausente/inválido)
 */
export function resolveTier(user: AccessUser): PlanTier {
  if (user.role === 'admin') return 'plus';
  if (!hasPaidAccess(user)) return 'free';
  const t = user.tier;
  if (t === 'plus') return 'plus';
  return 'basico';
}

const TIER_RANK: Record<PlanTier, number> = { free: 0, basico: 1, plus: 2 };

/** tier do usuário >= tier mínimo exigido? */
export function tierMeets(userTier: PlanTier, required: PlanTier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[required];
}
