import { hasPaidAccess, AccessUser } from './access';
import { maskAnuncio } from './anuncioSerializer';
import { DAILY_FREE_LIMIT, viewedTodayIds, recordView } from './dailyViews';

type Anuncio = Record<string, any> & { id: string };
type FreemiumUser = AccessUser & { id: string };

/**
 * Pago/admin: retorna tudo. Free: mascara criativo SEMPRE; libera metadata
 * de até DAILY_FREE_LIMIT anúncios distintos/dia; além disso, stub locked.
 */
export async function applyFreemium(anuncios: Anuncio[], user: FreemiumUser): Promise<Anuncio[]> {
  if (hasPaidAccess(user)) return anuncios;

  const seen = await viewedTodayIds(user.id);
  let budget = Math.max(0, DAILY_FREE_LIMIT - seen.size);
  const out: Anuncio[] = [];

  for (const ad of anuncios) {
    if (seen.has(ad.id)) {
      out.push(maskAnuncio(ad, false));
    } else if (budget > 0) {
      budget--;
      await recordView(user.id, ad.id);
      out.push(maskAnuncio(ad, false));
    } else {
      out.push({ id: ad.id, locked: true, limitReached: true });
    }
  }
  return out;
}
