/**
 * Single source of truth do Freemium.
 * Define o que cada plano libera e os limites do free.
 * Consumido por: middleware requireFeature, endpoint /me/access, frontend e extensão.
 */

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
  | 'criativo_preaprovador';

export interface FeatureRule {
  /** Free tem algum acesso? */
  freeAllowed: boolean;
  /** Limite numérico para o free (ex: nº de itens visíveis/dia). null = sem limite numérico. */
  freeLimit: number | null;
  /** Texto curto para o paywall/upsell. */
  upsell: string;
}

/**
 * Regras por feature. Free vê amostra limitada; pago libera tudo.
 * Mexer aqui é a única forma de mudar a regra de acesso — não espalhar checagem pelo código.
 */
export const FEATURE_RULES: Record<FeatureKey, FeatureRule> = {
  ofertas:                   { freeAllowed: true,  freeLimit: 10,   upsell: 'Veja todas as ofertas escaladas no plano pago.' },
  criativos:                 { freeAllowed: true,  freeLimit: 5,    upsell: 'Baixe criativos ilimitados no plano pago.' },
  anuncios_fb:               { freeAllowed: true,  freeLimit: 10,   upsell: 'Acesso completo à biblioteca de anúncios no plano pago.' },
  extension_garimpo:         { freeAllowed: true,  freeLimit: 5,    upsell: 'Garimpe sem limite na extensão com o plano pago.' },
  extension_download:        { freeAllowed: false, freeLimit: 0,    upsell: 'Download de criativos é exclusivo do plano pago.' },
  marketplace_dropshipping:  { freeAllowed: true,  freeLimit: 5,    upsell: 'Produtos de dropshipping escalados — completo no plano pago.' },
  marketplace_mercadolivre:  { freeAllowed: true,  freeLimit: 5,    upsell: 'Produtos do Mercado Livre escalados — completo no plano pago.' },
  marketplace_aliexpress:    { freeAllowed: true,  freeLimit: 5,    upsell: 'Promoções do AliExpress — completo no plano pago.' },
  marketplace_shopee:        { freeAllowed: true,  freeLimit: 5,    upsell: 'Promoções da Shopee — completo no plano pago.' },
  marketplace_shein:         { freeAllowed: true,  freeLimit: 5,    upsell: 'Promoções da Shein — completo no plano pago.' },
  adspy_youtube:             { freeAllowed: false, freeLimit: 0,    upsell: 'Anúncios escalados do YouTube são exclusivos do plano pago.' },
  adspy_tiktok:              { freeAllowed: false, freeLimit: 0,    upsell: 'Anúncios escalados do TikTok são exclusivos do plano pago.' },
  criativo_preaprovador:     { freeAllowed: false, freeLimit: 0,    upsell: 'O Pré-aprovador de Criativo é exclusivo do plano pago.' },
};

/** Resolve, para um user, o acesso a uma feature. */
export function resolveFeatureAccess(
  feature: FeatureKey,
  isPaid: boolean
): { allowed: boolean; limit: number | null; upsell: string } {
  const rule = FEATURE_RULES[feature];
  if (isPaid) return { allowed: true, limit: null, upsell: '' };
  return { allowed: rule.freeAllowed, limit: rule.freeLimit, upsell: rule.upsell };
}

/** Mapa completo de acesso para um user — payload do endpoint /me/access. */
export function buildAccessMap(isPaid: boolean): Record<FeatureKey, { allowed: boolean; limit: number | null; upsell: string }> {
  const out = {} as Record<FeatureKey, { allowed: boolean; limit: number | null; upsell: string }>;
  (Object.keys(FEATURE_RULES) as FeatureKey[]).forEach((k) => {
    out[k] = resolveFeatureAccess(k, isPaid);
  });
  return out;
}
