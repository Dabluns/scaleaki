import { hasPaidAccess, resolveTier } from '../utils/access';

const base = { role: 'user', plan: 'mensal', subscription: { status: 'active', endDate: new Date(Date.now() + 86400000) } };

describe('hasPaidAccess', () => {
  it('pago ativo não-expirado = true', () => {
    expect(hasPaidAccess(base as any)).toBe(true);
  });
  it('free = false', () => {
    expect(hasPaidAccess({ ...base, plan: 'free' } as any)).toBe(false);
  });
  it('pago expirado = false', () => {
    expect(hasPaidAccess({ ...base, subscription: { status: 'active', endDate: new Date(Date.now() - 1000) } } as any)).toBe(false);
  });
  it('pago sem subscription = false', () => {
    expect(hasPaidAccess({ role: 'user', plan: 'mensal', subscription: null } as any)).toBe(false);
  });
  it('admin sempre true mesmo free', () => {
    expect(hasPaidAccess({ role: 'admin', plan: 'free', subscription: null } as any)).toBe(true);
  });
  it('endDate null + status active = true (sem expiração)', () => {
    expect(hasPaidAccess({ ...base, subscription: { status: 'active', endDate: null } } as any)).toBe(true);
  });
});

describe('resolveTier', () => {
  it('admin → plus', () => {
    expect(resolveTier({ role: 'admin', plan: 'free', subscription: null } as any)).toBe('plus');
  });
  it('sem assinatura paga → free (ignora tier salvo)', () => {
    expect(resolveTier({ role: 'user', plan: 'free', tier: 'plus', subscription: null } as any)).toBe('free');
  });
  it('pago sem tier salvo → basico', () => {
    expect(resolveTier({ ...base } as any)).toBe('basico');
  });
  it('pago com tier basico → basico', () => {
    expect(resolveTier({ ...base, tier: 'basico' } as any)).toBe('basico');
  });
  it('pago com tier plus → plus', () => {
    expect(resolveTier({ ...base, tier: 'plus' } as any)).toBe('plus');
  });
  it('assinatura expirada → free mesmo com tier plus', () => {
    expect(resolveTier({ ...base, tier: 'plus', subscription: { status: 'active', endDate: new Date(Date.now() - 1000) } } as any)).toBe('free');
  });
});
