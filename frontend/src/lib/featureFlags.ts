/**
 * Feature flags do Scaleaki.
 *
 * MVP fechado (decisão 2026-06-27): vender só a biblioteca de anúncios do
 * Facebook + básico. As features "Scaleaki+" ficam ESCONDIDAS (não deletadas —
 * servem de isca de upgrade futuro).
 *
 * Atualização 2026-06-27: liberar só o Pré-aprovador no MVP. As demais
 * continuam escondidas (menu + rotas bloqueadas). Para habilitar outra, basta
 * adicioná-la em SCALEAKI_PLUS_ENABLED_ROUTES.
 */

/** Todas as rotas do pacote Scaleaki+. */
export const SCALEAKI_PLUS_ROUTES = [
  '/marketplace',
  '/adspy',
  '/funil',
  '/pre-aprovador',
  '/scaleflix',
  '/placa',
] as const;

/** Rotas Plus liberadas no MVP. Tudo que não estiver aqui fica escondido/bloqueado. */
export const SCALEAKI_PLUS_ENABLED_ROUTES: string[] = [
  '/pre-aprovador',
];

/** true se a rota Plus está liberada (aparece no menu e é acessível). */
export function isPlusRouteEnabled(route: string): boolean {
  return SCALEAKI_PLUS_ENABLED_ROUTES.includes(route);
}

/** Rotas Plus que devem aparecer no menu (subconjunto liberado). */
export const SCALEAKI_PLUS_VISIBLE_ROUTES = SCALEAKI_PLUS_ROUTES.filter((r) =>
  SCALEAKI_PLUS_ENABLED_ROUTES.includes(r)
);

/** true quando há ao menos uma feature Plus liberada (controla a seção do menu). */
export const SCALEAKI_PLUS_HAS_VISIBLE = SCALEAKI_PLUS_VISIBLE_ROUTES.length > 0;

/** true se o caminho pertence a uma feature Plus atualmente DESABILITADA. */
export function isPlusRouteBlocked(pathname: string): boolean {
  return SCALEAKI_PLUS_ROUTES.some(
    (r) =>
      (pathname === r || pathname.startsWith(`${r}/`)) &&
      !SCALEAKI_PLUS_ENABLED_ROUTES.includes(r)
  );
}
