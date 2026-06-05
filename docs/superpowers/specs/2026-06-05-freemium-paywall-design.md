# Freemium Paywall — Venda de Acesso via Cakto

**Data:** 2026-06-05
**Status:** Aprovado (design) — pendente spec review
**Projeto:** scaleaki (SaaS espião de anúncios FB Ad Library)

## Problema

Webhook Cakto já implementado (`src/controllers/caktoWebhookController.ts`) cria usuário, gerencia `Subscription`/`Payment` e seta `plan`. Mas **pagar não muda acesso a nada**:

1. Enum `UserPlan` não tem `free` — só `mensal/trimestral/anual`. Default `plan = mensal` → todo signup nasce tier pago.
2. Nenhum middleware checa `plan` ou expiração de assinatura. Gating atual = só `isActive` + `emailConfirmed` + `role`. Único filtro de conteúdo é `calcEscala` (escala≥30 não-admin), que é filtro de dado, não paywall.
3. Cancel/refund/chargeback rebaixa pra `plan:'mensal'` (linhas 469, 1149, 1242, 1336 do webhook) — não revoga acesso, porque `mensal` é tier pago.

Resultado: impossível vender acesso. Free e pago são idênticos.

## Objetivo

Modelo **freemium** que monetiza tráfego frio low-ticket:
- Free fisga (vê que tem anúncio escalando no nicho dele) mas não acessa o que dá dinheiro (o criativo).
- Pago destrava criativo + volume + ações.

## Modelo de acesso (decidido)

| Capacidade | FREE | PAGO (mensal/trim/anual) |
|---|---|---|
| Navegar todos os nichos (8 / 157 kw) | ✅ | ✅ |
| Ver anúncios FB | ⚠️ 10 distintos/dia | ✅ ilimitado |
| Metadata (score escala, dias no ar, pageName, duplicatas) | ✅ | ✅ |
| **Criativo (imagem real)** | 🔒 | ✅ |
| **Copy completa** (`adCopy`, `adHeadline`, `adCaption`, `adDescription`) | 🔒 | ✅ |
| **`adSnapshotUrl` + `libraryUrl`** | 🔒 | ✅ |
| Export / favoritos / baixar criativo | 🔒 | ✅ |

Os 3 tiers pagos (mensal/trimestral/anual) dão **acesso idêntico** — diferem só em duração/preço. (Assunção: sem diferença de feature entre tiers pagos.)

## Arquitetura (Caminho A — aprovado)

### 1. Data model
- Add `free` ao enum `UserPlan` (1ª posição). Mudar `User.plan @default(free)`.
- Migração via `prisma db push` (schema.prisma = fonte de verdade, conforme setup do projeto).
- **Backfill:** usuário com `Subscription` ativa (status active/trial, não expirada) → mantém `plan` pago atual; resto → `plan='free'`. Script único em `src/scripts/backfillFreePlan.ts`.

### 2. Helper de entitlement
`src/utils/access.ts` → `hasPaidAccess(user): boolean`
```
plan !== 'free'
  && subscription?.status in (active, trial)
  && (subscription.endDate == null || subscription.endDate > now)
```
Fonte única de verdade. Admin (`role==='admin'`) sempre paga-equivalente (bypass).

### 3. Gating de volume (free = 10 ads/dia)
- Contar anúncios FB distintos vistos hoje pelo usuário free.
- `OfertaView` existente tem `@@unique([userId, ofertaId])` e relaciona `Oferta` (não `AnuncioFacebook`). Anúncios FB precisam de log próprio.
- **Add model `AnuncioView`** (userId, anuncioId, viewedAt, `@@unique([userId, anuncioId])`) — espelha `OfertaView`.
- Cap = `count(AnuncioView where userId=X and viewedAt >= hoje_00h)`. Reabrir anúncio já visto hoje NÃO conta de novo (unique). Ao atingir 10, novos anúncios retornam mascarados + flag `limitReached`.
- Admin e pago: sem cap, sem log obrigatório.

### 4. Mascaramento de campo (serializer)
Camada única de serialização de anúncio FB em `src/controllers/fbAdsController.ts` (e `ofertaController.ts` se servir o mesmo conteúdo). Se `!hasPaidAccess`:
- Remover/nulificar: imagem do criativo (campo URL do Storage), `adCopy`, `adHeadline`, `adCaption`, `adDescription`, `adSnapshotUrl`, `libraryUrl`.
- Manter: score escala, `daysActive`/dias no ar, `pageName`, `duplicatas`, nicho.
- Adicionar flag `locked: true` por item → frontend renderiza blur + CTA upgrade.

### 5. Gating de ações
Bloquear pra free (403 + `{error:'paid_required'}`):
- `POST /favoritos`, `/export` (todas), download de criativo.
- Middleware `requirePaid` em `src/middlewares/requirePaid.ts` aplicado nessas rotas.

### 6. Fix do webhook (bug de revogação)
Em `caktoWebhookController.ts`, trocar `plan:'mensal'` por `plan:'free'` nos handlers: `handleSubscriptionCanceled`, `handlePurchaseRefused`, `handleRefund`, `handleChargeback`. Assinatura cancelada/expirada → vira free de verdade.

### 7. Endpoint de status pro frontend
`GET /account/access` → `{ tier: 'free'|'mensal'|..., paid: bool, dailyViewsUsed: n, dailyViewsLimit: 10, subscriptionEndDate }`. Frontend usa pra mostrar paywall/contador/CTA checkout.

## Data flow

```
Signup → plan='free' (default)
  → navega nichos (livre) → vê anúncios mascarados + 10/dia
  → bate parede → CTA checkout Cakto (NEXT_PUBLIC_CHECKOUT_*_URL)
  → paga → Cakto POST /payments/webhook/cakto
  → handlePurchaseApproved → Subscription active + plan=mensal/trim/anual
  → hasPaidAccess()=true → criativo destravado, sem cap
  → cancel/refund → plan='free' → re-travado
```

## Componentes (unidades isoladas)

| Unidade | Responsabilidade | Depende de |
|---|---|---|
| `utils/access.ts` | `hasPaidAccess(user)` — verdade única | User+Subscription |
| `middlewares/requirePaid.ts` | bloqueia rota se !pago | access.ts |
| `AnuncioView` model + contador | cap diário free | Prisma |
| serializer mask em `fbAdsController` | esconde criativo/copy/links | access.ts |
| webhook fix (plan→free) | revoga acesso ao cancelar | — |
| `GET /account/access` | status pro frontend | access.ts + contador |
| `backfillFreePlan.ts` | migra usuários atuais | Prisma |

## Erros / edge cases
- Assinatura expirada mas status ainda `active` no banco (renovação falhou): `hasPaidAccess` checa `endDate > now` → trava mesmo se status não atualizou. `billingService` já monitora; alinhar.
- Webhook duplicado (Cakto reenvia): idempotência por `caktoPaymentId` já parcial no handler — fora de escopo desta spec, anotar como follow-up.
- Race no cap (10 requests simultâneos): aceitável passar 1-2 do limite; não crítico.
- Admin nunca travado.

## Testes
- Unit `hasPaidAccess`: free, pago-ativo, pago-expirado, admin, sem subscription.
- Integração: free vê anúncio mascarado (sem `adCopy`/criativo); pago vê completo.
- Cap: 11º anúncio do dia retorna `locked`; reabrir o 1º não conta.
- Webhook: `subscription_canceled` → user vira `free` → próximo GET mascara.
- Backfill: usuário com sub ativa mantém pago; sem sub vira free.

## Fora de escopo (YAGNI)
- Diferença de feature entre tiers pagos.
- Tabela `CheckoutAbandonment` (já há TODO no código).
- Idempotência robusta de webhook (follow-up separado).
- Trial por tempo.
