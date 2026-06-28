# Plano — Front-end das features Scaleaki+

Backend pronto no commit `88d7eec`. API em `NEXT_PUBLIC_API_URL`. Objetivo: criar as telas que consomem essas APIs + cards no dashboard, com gating por tier.

## Critério de sucesso

- [ ] 6 features acessíveis via UI no app
- [ ] Cada feature gated corretamente (FeatureGate p/ as 4 com FeatureKey; `access.paid` p/ Scaleflix e Placa)
- [ ] Cards no dashboard linkando as features (com selo Plus quando aplicável)
- [ ] Itens na Sidebar (seção nova "Scaleaki+")
- [ ] `next build` passa sem erro de tipo
- [ ] Usuário free vê upsell; Plus vê conteúdo

## Decisões de design (seguir padrão existente)

- Fetch: `const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'` + `nookies.get` token + `Authorization: Bearer`. (padrão de `anuncios-fb/page.tsx`)
- Layout: client components, fundo transparente, glass cards, verde/emerald, framer-motion reveal. (padrão dashboard)
- Cards do dashboard: `Card3D` glass, mesma estrutura do `AcoesRapidas`, mas com selo Plus roxo (`#a855f7`).
- Gating:
  - AdSpy, Marketplace, Funil, Pré-aprovador → `<FeatureGate feature=...>` (já existe).
  - Scaleflix, Placa → checar `access.paid` via `useAccess` (não têm FeatureKey).

## Rotas a criar (app/(dashboard)/)

1. `adspy/page.tsx` — tabs YouTube/TikTok, grid de ScaledAd, busca, ordenação, paginação. Gate `adspy_youtube`/`adspy_tiktok`.
2. `marketplace/page.tsx` — seletor de origem (5), filtros (categoria, desconto), grid ScaledProduct, banner "amostra" quando `limitReached`. Gate marketplace_*.
3. `funil/page.tsx` — input de domínio + botão analisar (POST), resultado (checkout/tech/pixels/subdomínios/screenshot) + histórico. Gate `trafego_funil`.
4. `pre-aprovador/page.tsx` — form (headline/copy/descrição/plataforma) → parecer (veredito/score/motivos/ajustes/termos). Gate `criativo_preaprovador`.
5. `scaleflix/page.tsx` — biblioteca de vídeos agrupada por módulo, player embed. Gate `access.paid`.
6. `placa/page.tsx` — form de solicitação + lista "minhas placas" com status. Gate `access.paid`.

## Componentes compartilhados a criar

- `components/features/plus/` — cards de ad, produto, etc., se reuso justificar. Senão inline.
- `components/features/dashboard/FerramentasPlus.tsx` — bloco de cards Plus no dashboard.

## Integrações

- Dashboard: inserir `<FerramentasPlus />` como nova section após `AcoesRapidas`.
- Sidebar: nova `SectionLabel "Scaleaki+"` com NavItems das 6 rotas (selo Plus).

## Ordem de execução (commits atômicos)

1. Lib de API helper p/ Plus + tipos (`lib/plus.ts`) — tipos ScaledAd/ScaledProduct/etc + fetch helpers.
2. Marketplace (mais completo, valida padrão de lista+filtro+amostra).
3. AdSpy (reusa padrão de lista).
4. Funil (POST + resultado).
5. Pré-aprovador (form + parecer).
6. Scaleflix (lista + player).
7. Placa (form + status).
8. Dashboard cards + Sidebar nav.
9. `next build` + ajustes de tipo.

## Riscos / pendências

- Tabelas vazias? Scrapers precisam ter rodado p/ ter dados. UI deve tratar estado vazio.
- `next build` pode demorar/pesar (já houve OOM no backend; front é Vercel, ok local).
- Pré-aprovador depende de LLM configurado no backend (`llmAvailable`) — tratar 503.
- Placa/Scaleflix gating por `paid` inclui básico (não só Plus) — confirmar se é intencional. Backend usa `requirePaid`, então sim.
