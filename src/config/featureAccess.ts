/**
 * Single source of truth do Freemium + tiers de produto.
 * Define o tier mínimo de cada feature e os limites de amostra.
 * Escada: free < basico < plus. Quem está abaixo do tier mínimo vê amostra (se freeAllowed) ou é bloqueado.
 * Consumido por: middleware requireFeature, endpoint /account/access, frontend e extensão.
 */

import type { PlanTier } from '../utils/access';
import { tierMeets } from '../utils/access';

export type FeatureKey =
  | 'ofertas'
  | 'criativos'
  | 'anuncios_fb'
  | 'extension_garimpo'
  | 'extension_download'
  | 'marketplace_dropshipping'
  | 'marketplace_mercadolivre'
  | 'marketplace_aliexpress'
  | 'marketplace_shopee'
  | 'marketplace_shein'
  | 'adspy_youtube'
  | 'adspy_tiktok'
  | 'criativo_preaprovador'
  | 'trafego_funil';

export interface FeatureRule {
  /** Tier mínimo para acesso COMPLETO à feature. */
  minTier: PlanTier;
  /** Quem está abaixo do minTier tem amostra? */
  freeAllowed: boolean;
  /** Limite numérico da amostra (ex: nº de itens/dia). null = sem limite. */
  freeLimit: number | null;
  /** Texto curto para o paywall/upsell. */
  upsell: string;
}

export interface FeatureAccess {
  allowed: boolean;
  limit: number | null;
  upsell: string;
  /** Tier mínimo exigido — frontend usa para escolher o checkout (básico vs Scaleaki+). */
  requiredTier: PlanTier;
}

/**
 * Regras por feature.
 * - Básico: ofertas, criativos, anúncios FB, extensão (garimpo + download).
 * - Plus (Scaleaki+): marketplaces (5), AdSpy YouTube/TikTok, pré-aprovador, funil.
 * Marketplaces seguem como amostra (5) para free E básico — isca de upgrade pro Plus.
 * Mexer aqui é a única forma de mudar a regra — não espalhar checagem pelo código.
 */
export const FEATURE_RULES: Record<FeatureKey, FeatureRule> = {
  ofertas:                   { minTier: 'basico', freeAllowed: true,  freeLimit: 10, upsell: 'Veja todas as ofertas escaladas no plano pago.' },
  criativos:                 { minTier: 'basico', freeAllowed: true,  freeLimit: 5,  upsell: 'Baixe criativos ilimitados no plano pago.' },
  anuncios_fb:               { minTier: 'basico', freeAllowed: true,  freeLimit: 10, upsell: 'Acesso completo à biblioteca de anúncios no plano pago.' },
  extension_garimpo:         { minTier: 'basico', freeAllowed: true,  freeLimit: 5,  upsell: 'Garimpe sem limite na extensão com o plano pago.' },
  extension_download:        { minTier: 'basico', freeAllowed: false, freeLimit: 0,  upsell: 'Download de criativos é exclusivo do plano pago.' },
  marketplace_dropshipping:  { minTier: 'plus',   freeAllowed: true,  freeLimit: 5,  upsell: 'Dropshipping completo é exclusivo do Scaleaki+.' },
  marketplace_mercadolivre:  { minTier: 'plus',   freeAllowed: true,  freeLimit: 5,  upsell: 'Mercado Livre completo é exclusivo do Scaleaki+.' },
  marketplace_aliexpress:    { minTier: 'plus',   freeAllowed: true,  freeLimit: 5,  upsell: 'AliExpress completo é exclusivo do Scaleaki+.' },
  marketplace_shopee:        { minTier: 'plus',   freeAllowed: true,  freeLimit: 5,  upsell: 'Shopee completo é exclusivo do Scaleaki+.' },
  marketplace_shein:         { minTier: 'plus',   freeAllowed: true,  freeLimit: 5,  upsell: 'Shein completo é exclusivo do Scaleaki+.' },
  adspy_youtube:             { minTier: 'plus',   freeAllowed: false, freeLimit: 0,  upsell: 'Anúncios escalados do YouTube são exclusivos do Scaleaki+.' },
  adspy_tiktok:              { minTier: 'plus',   freeAllowed: false, freeLimit: 0,  upsell: 'Anúncios escalados do TikTok são exclusivos do Scaleaki+.' },
  criativo_preaprovador:     { minTier: 'plus',   freeAllowed: false, freeLimit: 0,  upsell: 'O Pré-aprovador de Criativo é exclusivo do Scaleaki+.' },
  trafego_funil:             { minTier: 'plus',   freeAllowed: false, freeLimit: 0,  upsell: 'A análise de funil e tráfego é exclusiva do Scaleaki+.' },
};

/** Resolve o acesso de um tier a uma feature. */
export function resolveFeatureAccess(feature: FeatureKey, tier: PlanTier): FeatureAccess {
  const rule = FEATURE_RULES[feature];
  if (tierMeets(tier, rule.minTier)) {
    return { allowed: true, limit: null, upsell: '', requiredTier: rule.minTier };
  }
  if (rule.freeAllowed) {
    return { allowed: true, limit: rule.freeLimit, upsell: rule.upsell, requiredTier: rule.minTier };
  }
  return { allowed: false, limit: 0, upsell: rule.upsell, requiredTier: rule.minTier };
}

/** Mapa completo de acesso para um tier — payload do endpoint /account/access. */
export function buildAccessMap(tier: PlanTier): Record<FeatureKey, FeatureAccess> {
  const out = {} as Record<FeatureKey, FeatureAccess>;
  (Object.keys(FEATURE_RULES) as FeatureKey[]).forEach((k) => {
    out[k] = resolveFeatureAccess(k, tier);
  });
  return out;
}
