/**
 * Feature flags do Scaleaki.
 *
 * MVP fechado (decisão 2026-06-27): vender só a biblioteca de anúncios do
 * Facebook + básico. As features "Scaleaki+" ficam ESCONDIDAS (não deletadas —
 * servem de isca de upgrade futuro). Basta flipar SCALEAKI_PLUS_ENABLED para
 * trazer tudo de volta (menu + rotas).
 */
export const SCALEAKI_PLUS_ENABLED = false;

/** Rotas que compõem o pacote Scaleaki+ (escondidas no MVP). */
export const SCALEAKI_PLUS_ROUTES = [
  '/marketplace',
  '/adspy',
  '/funil',
  '/pre-aprovador',
  '/scaleflix',
  '/placa',
] as const;

/** true se o caminho pertence a uma feature Plus atualmente desabilitada. */
export function isPlusRouteBlocked(pathname: string): boolean {
  if (SCALEAKI_PLUS_ENABLED) return false;
  return SCALEAKI_PLUS_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
}
