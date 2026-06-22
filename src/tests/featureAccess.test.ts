import { resolveFeatureAccess, buildAccessMap, FEATURE_RULES, FeatureKey } from '../config/featureAccess';

describe('featureAccess', () => {
  it('pago libera tudo sem limite', () => {
    (Object.keys(FEATURE_RULES) as FeatureKey[]).forEach((k) => {
      const a = resolveFeatureAccess(k, true);
      expect(a.allowed).toBe(true);
      expect(a.limit).toBeNull();
    });
  });

  it('free respeita freeAllowed de cada feature', () => {
    expect(resolveFeatureAccess('ofertas', false).allowed).toBe(true);
    expect(resolveFeatureAccess('adspy_youtube', false).allowed).toBe(false);
    expect(resolveFeatureAccess('extension_download', false).allowed).toBe(false);
    expect(resolveFeatureAccess('criativo_preaprovador', false).allowed).toBe(false);
  });

  it('free recebe limite numérico quando aplicável', () => {
    expect(resolveFeatureAccess('ofertas', false).limit).toBe(10);
    expect(resolveFeatureAccess('marketplace_shopee', false).limit).toBe(5);
  });

  it('feature bloqueada para free traz texto de upsell', () => {
    const a = resolveFeatureAccess('adspy_tiktok', false);
    expect(a.allowed).toBe(false);
    expect(a.upsell.length).toBeGreaterThan(0);
  });

  it('buildAccessMap cobre todas as features', () => {
    const map = buildAccessMap(false);
    expect(Object.keys(map).sort()).toEqual(Object.keys(FEATURE_RULES).sort());
  });
});
