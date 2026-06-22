import nookies from 'nookies';

const TOKEN_KEY = 'auth_token';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

export type FeatureAccess = {
  allowed: boolean;
  limit: number | null;
  upsell: string;
};

export type AccessResponse = {
  tier: 'free' | 'mensal' | 'trimestral' | 'anual';
  paid: boolean;
  dailyViewsUsed: number;
  dailyViewsLimit: number | null;
  subscriptionEndDate: string | null;
  features: Record<FeatureKey, FeatureAccess>;
};

export async function fetchAccess(): Promise<AccessResponse | null> {
  const token = nookies.get(null)[TOKEN_KEY];
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/account/access`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as AccessResponse;
  } catch {
    return null;
  }
}
