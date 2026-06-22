import { resolveFeatureAccess, buildAccessMap, FEATURE_RULES, FeatureKey } from '../config/featureAccess';

describe('featureAccess (tiers)', () => {
  it('plus libera tudo sem limite', () => {
    (Object.keys(FEATURE_RULES) as FeatureKey[]).forEach((k) => {
      const a = resolveFeatureAccess(k, 'plus');
      expect(a.allowed).toBe(true);
      expect(a.limit).toBeNull();
    });
  });

  it('basico libera features de básico, mas vê amostra das de plus', () => {
    // básico-only → completo
    expect(resolveFeatureAccess('ofertas', 'basico')).toMatchObject({ allowed: true, limit: null });
    expect(resolveFeatureAccess('extension_download', 'basico')).toMatchObject({ allowed: true, limit: null });
    // plus-only com amostra → liberado mas limitado
    const ml = resolveFeatureAccess('marketplace_mercadolivre', 'basico');
    expect(ml.allowed).toBe(true);
    expect(ml.limit).toBe(5);
    expect(ml.requiredTier).toBe('plus');
    // plus-only sem amostra → bloqueado
    expect(resolveFeatureAccess('adspy_youtube', 'basico').allowed).toBe(false);
    expect(resolveFeatureAccess('criativo_preaprovador', 'basico').allowed).toBe(false);
  });

  it('free respeita freeAllowed de cada feature', () => {
    expect(resolveFeatureAccess('ofertas', 'free').allowed).toBe(true);
    expect(resolveFeatureAccess('adspy_youtube', 'free').allowed).toBe(false);
    expect(resolveFeatureAccess('extension_download', 'free').allowed).toBe(false);
    expect(resolveFeatureAccess('criativo_preaprovador', 'free').allowed).toBe(false);
  });

  it('free recebe limite numérico quando aplicável', () => {
    expect(resolveFeatureAccess('ofertas', 'free').limit).toBe(10);
    expect(resolveFeatureAccess('marketplace_shopee', 'free').limit).toBe(5);
  });

  it('feature bloqueada traz texto de upsell e requiredTier', () => {
    const a = resolveFeatureAccess('adspy_tiktok', 'free');
    expect(a.allowed).toBe(false);
    expect(a.upsell.length).toBeGreaterThan(0);
    expect(a.requiredTier).toBe('plus');
  });

  it('buildAccessMap cobre todas as features', () => {
    const map = buildAccessMap('free');
    expect(Object.keys(map).sort()).toEqual(Object.keys(FEATURE_RULES).sort());
  });
});
