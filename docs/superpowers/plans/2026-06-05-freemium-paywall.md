# Freemium Paywall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Travar criativo/copy/links e volume (10 ads/dia) pro tier free; pago (Cakto) destrava tudo.

**Architecture:** Enum `free` no `UserPlan` (default). Helper `hasPaidAccess` = verdade única. Serializer mascara campos sensíveis do `AnuncioFacebook` pra free. Cap diário via novo model `AnuncioView`. Webhook Cakto corrigido pra revogar acesso (plan→free).

**Tech Stack:** Express + TS + Prisma 6 + Postgres (Supabase) · Jest + ts-jest + supertest.

**Convenções do projeto:**
- Prisma client: `import prisma from '../config/database'`
- Schema = fonte de verdade. Aplicar mudança: `npx prisma db push` (NÃO migrate — history quebrada).
- Campo imagem do criativo = `adSnapshotUrl` (URL pública Storage `ad-creatives`).
- Rodar 1 teste: `npx jest <path> -t "<nome>"`

---

### Task 1: Enum `free` no UserPlan + default

**Files:**
- Modify: `prisma/schema.prisma:11-15` (enum), `:31` (default)

- [ ] **Step 1: Editar enum**

`prisma/schema.prisma` linhas 11-15:
```prisma
enum UserPlan {
  free
  mensal
  trimestral
  anual
}
```

- [ ] **Step 2: Mudar default do User.plan**

`prisma/schema.prisma` linha 31:
```prisma
  plan                     UserPlan      @default(free)
```

- [ ] **Step 3: Aplicar no banco**

Run: `npx prisma db push`
Expected: "Your database is now in sync with your Prisma schema" + `prisma generate` automático.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(plan): add free tier ao enum UserPlan + default free"
```

---

### Task 2: Helper `hasPaidAccess` (verdade única)

**Files:**
- Create: `src/utils/access.ts`
- Test: `src/tests/access.test.ts`

- [ ] **Step 1: Escrever teste que falha**

`src/tests/access.test.ts`:
```typescript
import { hasPaidAccess } from '../utils/access';

const base = { role: 'user', plan: 'mensal', subscription: { status: 'active', endDate: new Date(Date.now() + 86400000) } };

describe('hasPaidAccess', () => {
  it('pago ativo não-expirado = true', () => {
    expect(hasPaidAccess(base as any)).toBe(true);
  });
  it('free = false', () => {
    expect(hasPaidAccess({ ...base, plan: 'free' } as any)).toBe(false);
  });
  it('pago expirado = false', () => {
    expect(hasPaidAccess({ ...base, subscription: { status: 'active', endDate: new Date(Date.now() - 1000) } } as any)).toBe(false);
  });
  it('pago sem subscription = false', () => {
    expect(hasPaidAccess({ role: 'user', plan: 'mensal', subscription: null } as any)).toBe(false);
  });
  it('admin sempre true mesmo free', () => {
    expect(hasPaidAccess({ role: 'admin', plan: 'free', subscription: null } as any)).toBe(true);
  });
  it('endDate null + status active = true (sem expiração)', () => {
    expect(hasPaidAccess({ ...base, subscription: { status: 'active', endDate: null } } as any)).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar — falha**

Run: `npx jest src/tests/access.test.ts`
Expected: FAIL "Cannot find module '../utils/access'"

- [ ] **Step 3: Implementar**

`src/utils/access.ts`:
```typescript
export interface AccessUser {
  role: string;
  plan: string;
  subscription?: { status: string; endDate: Date | null } | null;
}

const ACTIVE_SUB = new Set(['active', 'trial']);

export function hasPaidAccess(user: AccessUser): boolean {
  if (user.role === 'admin') return true;
  if (user.plan === 'free') return false;
  const sub = user.subscription;
  if (!sub || !ACTIVE_SUB.has(sub.status)) return false;
  if (sub.endDate && sub.endDate.getTime() <= Date.now()) return false;
  return true;
}
```

- [ ] **Step 4: Rodar — passa**

Run: `npx jest src/tests/access.test.ts`
Expected: PASS (6 testes)

- [ ] **Step 5: Commit**

```bash
git add src/utils/access.ts src/tests/access.test.ts
git commit -m "feat(access): hasPaidAccess helper (verdade única de entitlement)"
```

---

### Task 3: Serializer de mascaramento

**Files:**
- Create: `src/utils/anuncioSerializer.ts`
- Test: `src/tests/anuncioSerializer.test.ts`

- [ ] **Step 1: Teste que falha**

`src/tests/anuncioSerializer.test.ts`:
```typescript
import { maskAnuncio, LOCKED_FIELDS } from '../utils/anuncioSerializer';

const full = {
  id: 'a1', pageName: 'Loja X', escala: 42, duplicatas: 12, deliveryStartTime: new Date(),
  adSnapshotUrl: 'https://store/img.jpg', adCopy: 'compre já', adHeadline: 'H', adCaption: 'C',
  adDescription: 'D', libraryUrl: 'https://fb/lib', destinationUrl: 'https://offer',
};

describe('maskAnuncio', () => {
  it('paid=true retorna tudo', () => {
    expect(maskAnuncio(full as any, true)).toEqual(full);
  });
  it('paid=false nulifica campos sensíveis e marca locked', () => {
    const m = maskAnuncio(full as any, false) as any;
    for (const f of LOCKED_FIELDS) expect(m[f]).toBeNull();
    expect(m.locked).toBe(true);
    expect(m.pageName).toBe('Loja X');
    expect(m.escala).toBe(42);
    expect(m.duplicatas).toBe(12);
  });
});
```

- [ ] **Step 2: Rodar — falha**

Run: `npx jest src/tests/anuncioSerializer.test.ts`
Expected: FAIL "Cannot find module"

- [ ] **Step 3: Implementar**

`src/utils/anuncioSerializer.ts`:
```typescript
export const LOCKED_FIELDS = [
  'adSnapshotUrl', 'adCopy', 'adHeadline', 'adCaption',
  'adDescription', 'libraryUrl', 'destinationUrl',
] as const;

export function maskAnuncio<T extends Record<string, any>>(anuncio: T, paid: boolean): T & { locked?: boolean } {
  if (paid) return anuncio;
  const masked: Record<string, any> = { ...anuncio, locked: true };
  for (const f of LOCKED_FIELDS) masked[f] = null;
  return masked as T & { locked: boolean };
}
```

- [ ] **Step 4: Rodar — passa**

Run: `npx jest src/tests/anuncioSerializer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/anuncioSerializer.ts src/tests/anuncioSerializer.test.ts
git commit -m "feat(serializer): maskAnuncio nulifica criativo/copy/links pra free"
```

---

### Task 4: Model `AnuncioView` + contador diário

**Files:**
- Modify: `prisma/schema.prisma` (novo model + relation no User)
- Create: `src/utils/dailyViews.ts`
- Test: `src/tests/dailyViews.test.ts`

- [ ] **Step 1: Add model no schema**

`prisma/schema.prisma` (após model OfertaView, ~linha 149):
```prisma
model AnuncioView {
  id        String   @id @default(uuid())
  userId    String
  anuncioId String
  viewedAt  DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, anuncioId])
  @@index([userId, viewedAt])
}
```

Add relation no model User (após `subscription Subscription?`, ~linha 44):
```prisma
  anuncioViews             AnuncioView[]
```

- [ ] **Step 2: Aplicar**

Run: `npx prisma db push`
Expected: "in sync" + generate.

- [ ] **Step 3: Teste que falha**

`src/tests/dailyViews.test.ts`:
```typescript
import { startOfToday } from '../utils/dailyViews';

describe('startOfToday', () => {
  it('retorna 00:00 de hoje', () => {
    const d = startOfToday();
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getDate()).toBe(new Date().getDate());
  });
});
```

- [ ] **Step 4: Rodar — falha**

Run: `npx jest src/tests/dailyViews.test.ts`
Expected: FAIL "Cannot find module"

- [ ] **Step 5: Implementar**

`src/utils/dailyViews.ts`:
```typescript
import prisma from '../config/database';

export const DAILY_FREE_LIMIT = 10;

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function countViewsToday(userId: string): Promise<number> {
  return prisma.anuncioView.count({
    where: { userId, viewedAt: { gte: startOfToday() } },
  });
}

export async function recordView(userId: string, anuncioId: string): Promise<void> {
  await prisma.anuncioView.upsert({
    where: { userId_anuncioId: { userId, anuncioId } },
    create: { userId, anuncioId },
    update: { viewedAt: new Date() },
  });
}

export async function viewedTodayIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.anuncioView.findMany({
    where: { userId, viewedAt: { gte: startOfToday() } },
    select: { anuncioId: true },
  });
  return new Set(rows.map(r => r.anuncioId));
}
```

- [ ] **Step 6: Rodar — passa**

Run: `npx jest src/tests/dailyViews.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma src/utils/dailyViews.ts src/tests/dailyViews.test.ts
git commit -m "feat(cap): AnuncioView model + contador diário de views"
```

---

### Task 5: Aplicar freemium nas listagens de anúncio

**Files:**
- Create: `src/utils/freemium.ts`
- Test: `src/tests/freemium.test.ts`
- Modify: `src/controllers/fbAdsController.ts` (handler `liveSearch` :58, e demais handlers que retornam `prisma.anuncioFacebook.findMany`)

- [ ] **Step 1: Teste que falha**

`src/tests/freemium.test.ts`:
```typescript
import { applyFreemium } from '../utils/freemium';

const ads = Array.from({ length: 15 }, (_, i) => ({ id: `a${i}`, escala: i, adCopy: 'x', adSnapshotUrl: 'u', adHeadline: null, adCaption: null, adDescription: null, libraryUrl: null, destinationUrl: null, pageName: 'P' }));

describe('applyFreemium', () => {
  it('paid retorna tudo sem máscara nem cap', async () => {
    const out = await applyFreemium(ads as any, { id: 'u1', role: 'user', plan: 'mensal', subscription: { status: 'active', endDate: null } } as any);
    expect(out).toHaveLength(15);
    expect(out[0].adCopy).toBe('x');
    expect(out[0].locked).toBeUndefined();
  });
});
```
(Teste de free com cap exige DB — cobrir em teste de integração no Step 6.)

- [ ] **Step 2: Rodar — falha**

Run: `npx jest src/tests/freemium.test.ts`
Expected: FAIL "Cannot find module"

- [ ] **Step 3: Implementar**

`src/utils/freemium.ts`:
```typescript
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
```

- [ ] **Step 4: Rodar — passa**

Run: `npx jest src/tests/freemium.test.ts`
Expected: PASS

- [ ] **Step 5: Plugar no controller**

`src/controllers/fbAdsController.ts` — no `liveSearch`, trocar o `res.json` (linha ~58):
```typescript
    const { hasPaidAccess } = require('../utils/access');
    const { applyFreemium } = require('../utils/freemium');
    const fbUser = await prisma.user.findUnique({ where: { id: (req as any).user.id }, include: { subscription: true } });
    const data = await applyFreemium(dbResults as any, fbUser as any);

    res.json({
      data,
      total,
      query,
      source: 'database',
      miningStarted,
      paid: hasPaidAccess(fbUser as any),
    });
```
Repetir o mesmo wrap (`applyFreemium` no array antes de retornar) em qualquer outro handler de `fbAdsController.ts` que faça `prisma.anuncioFacebook.findMany` e retorne ao usuário autenticado. Handlers internos da extensão/admin NÃO recebem freemium.

> Nota: a rota de `liveSearch` precisa estar autenticada (`authenticateJWT`) pra `req.user` existir. Confirmar em `src/routes/fbAdsRoutes.ts`; se pública, adicionar auth.

- [ ] **Step 6: Teste de integração (free mascara + cap)**

`src/tests/freemium.integration.test.ts` — seguir padrão dos testes existentes em `src/tests` (supertest no app). Cenário:
```
- cria user free + 12 anúncios no banco
- GET autenticado de listagem
- assert: itens 1-10 têm adCopy=null/locked=true; itens 11-12 têm {locked:true, limitReached:true}
- assert: paid vê adCopy preenchido
```
(Usar o helper de setup de DB de teste do projeto; se inexistente, mockar `prisma.anuncioView` e `prisma.user`.)

- [ ] **Step 7: Commit**

```bash
git add src/utils/freemium.ts src/tests/freemium.test.ts src/tests/freemium.integration.test.ts src/controllers/fbAdsController.ts
git commit -m "feat(freemium): mascara criativo + cap 10/dia nas listagens FB ads"
```

---

### Task 6: Middleware `requirePaid` nas ações

**Files:**
- Create: `src/middlewares/requirePaid.ts`
- Test: `src/tests/requirePaid.test.ts`
- Modify: rotas de favoritos (`src/routes/favoritoRoutes.ts`) e export (`src/routes/exportRoutes.ts`)

- [ ] **Step 1: Teste que falha**

`src/tests/requirePaid.test.ts`:
```typescript
import { requirePaid } from '../middlewares/requirePaid';

function mockRes() {
  const r: any = {};
  r.status = (c: number) => { r._status = c; return r; };
  r.json = (b: any) => { r._body = b; return r; };
  return r;
}

describe('requirePaid', () => {
  it('admin passa', async () => {
    const res = mockRes(); let nexted = false;
    await requirePaid({ user: { id: 'a', role: 'admin', plan: 'free' } } as any, res, () => { nexted = true; });
    expect(nexted).toBe(true);
  });
});
```
(Casos free/pago dependem de DB → cobrir em integração.)

- [ ] **Step 2: Rodar — falha**

Run: `npx jest src/tests/requirePaid.test.ts`
Expected: FAIL "Cannot find module"

- [ ] **Step 3: Implementar**

`src/middlewares/requirePaid.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { hasPaidAccess } from '../utils/access';

export async function requirePaid(req: Request, res: Response, next: NextFunction) {
  const auth = (req as any).user;
  if (!auth?.id) return res.status(401).json({ error: 'unauthenticated' });

  if (auth.role === 'admin') return next();

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    include: { subscription: true },
  });
  if (!user || !hasPaidAccess(user as any)) {
    return res.status(403).json({ error: 'paid_required', message: 'Recurso disponível apenas no plano pago.' });
  }
  next();
}
```

- [ ] **Step 4: Rodar — passa**

Run: `npx jest src/tests/requirePaid.test.ts`
Expected: PASS

- [ ] **Step 5: Aplicar nas rotas**

Em `src/routes/favoritoRoutes.ts` e `src/routes/exportRoutes.ts`, importar e aplicar `requirePaid` após `authenticateJWT` nas rotas de escrita/export. Exemplo favoritos:
```typescript
import { requirePaid } from '../middlewares/requirePaid';
router.post('/', requirePaid, favoritoController.create);
```

- [ ] **Step 6: Commit**

```bash
git add src/middlewares/requirePaid.ts src/tests/requirePaid.test.ts src/routes/favoritoRoutes.ts src/routes/exportRoutes.ts
git commit -m "feat(paywall): requirePaid bloqueia favoritos/export pra free"
```

---

### Task 7: Fix do webhook — revogar acesso (plan→free)

**Files:**
- Modify: `src/controllers/caktoWebhookController.ts` (linhas ~469, 1149, 1242, 1336)

- [ ] **Step 1: Substituir os 4 downgrades**

Em `caktoWebhookController.ts`, nos handlers `handleSubscriptionCanceled`, `handlePurchaseRefused`, `handleRefund`, `handleChargeback`, trocar cada ocorrência de:
```typescript
      data: { plan: 'mensal' },
```
por:
```typescript
      data: { plan: 'free' },
```
(São 4 ocorrências, uma por handler — verificar com `grep -n "plan: 'mensal'" src/controllers/caktoWebhookController.ts`.)

- [ ] **Step 2: Verificar build**

Run: `npx tsc --noEmit`
Expected: sem erro (UserPlan agora aceita 'free').

- [ ] **Step 3: Commit**

```bash
git add src/controllers/caktoWebhookController.ts
git commit -m "fix(webhook): cancel/refund/chargeback rebaixam pra free (revoga acesso)"
```

---

### Task 8: Endpoint `GET /account/access`

**Files:**
- Modify: `src/controllers/accountController.ts` (add handler), `src/routes/accountRoutes.ts` (add rota)
- Test: integração

- [ ] **Step 1: Implementar handler**

Em `src/controllers/accountController.ts`, adicionar:
```typescript
import { hasPaidAccess } from '../utils/access';
import { countViewsToday, DAILY_FREE_LIMIT } from '../utils/dailyViews';

export async function getAccess(req: Request, res: Response) {
  const authId = (req as any).user.id;
  const user = await prisma.user.findUnique({
    where: { id: authId },
    include: { subscription: true },
  });
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const paid = hasPaidAccess(user as any);
  const used = paid ? 0 : await countViewsToday(authId);

  res.json({
    tier: user.plan,
    paid,
    dailyViewsUsed: used,
    dailyViewsLimit: paid ? null : DAILY_FREE_LIMIT,
    subscriptionEndDate: user.subscription?.endDate ?? null,
  });
}
```
(Confirmar import de `prisma`/`Request,Response` no topo do arquivo; seguir o padrão dos handlers existentes.)

- [ ] **Step 2: Add rota**

Em `src/routes/accountRoutes.ts`, após o `authenticateJWT`:
```typescript
router.get('/access', accountController.getAccess);
```

- [ ] **Step 3: Verificar build**

Run: `npx tsc --noEmit`
Expected: sem erro.

- [ ] **Step 4: Commit**

```bash
git add src/controllers/accountController.ts src/routes/accountRoutes.ts
git commit -m "feat(account): GET /account/access expõe tier/paid/cap pro frontend"
```

---

### Task 9: Backfill de usuários existentes

**Files:**
- Create: `src/scripts/backfillFreePlan.ts`

- [ ] **Step 1: Implementar script**

`src/scripts/backfillFreePlan.ts`:
```typescript
import prisma from '../config/database';
import { hasPaidAccess } from '../utils/access';

async function main() {
  const users = await prisma.user.findMany({ include: { subscription: true } });
  let toFree = 0, kept = 0;
  for (const u of users) {
    if (u.role === 'admin') { kept++; continue; }
    if (hasPaidAccess(u as any)) { kept++; continue; }
    if (u.plan !== 'free') {
      await prisma.user.update({ where: { id: u.id }, data: { plan: 'free' } });
      toFree++;
    }
  }
  console.log(`Backfill: ${toFree} → free, ${kept} mantidos (pagos/admin).`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Rodar (após deploy do schema)**

Run: `npx ts-node src/scripts/backfillFreePlan.ts`
Expected: "Backfill: N → free, M mantidos".

- [ ] **Step 3: Commit**

```bash
git add src/scripts/backfillFreePlan.ts
git commit -m "chore(backfill): usuários sem sub ativa viram free"
```

---

### Task 10: Deploy + smoke test

- [ ] **Step 1: Redeploy backend**

Run: `.\deploy-fly.ps1`
Expected: deploy ok, health passing.

- [ ] **Step 2: Smoke — free mascara**

Criar/logar user free, `GET /fb-ads` (ou rota de listagem), assert criativo null + `locked:true`. `GET /account/access` → `{paid:false, dailyViewsLimit:10}`.

- [ ] **Step 3: Smoke — pago destrava**

User com subscription ativa → criativo preenchido, `paid:true`.

---

## Self-Review

**Cobertura da spec:**
- enum free → Task 1 ✅
- hasPaidAccess → Task 2 ✅
- mascaramento campos → Task 3 (adSnapshotUrl/adCopy/adHeadline/adCaption/adDescription/libraryUrl/destinationUrl) ✅
- cap 10/dia → Task 4+5 (AnuncioView) ✅
- requirePaid favoritos/export → Task 6 ✅
- fix webhook plan→free → Task 7 ✅
- GET /account/access → Task 8 ✅
- backfill → Task 9 ✅

**Gaps conhecidos (anotar p/ execução):**
- Confirmar se `liveSearch` e demais listagens FB ads estão sob `authenticateJWT` (Task 5 Step 5 nota). Se alguma for pública, exige auth pra freemium funcionar.
- Nomes de handlers em `accountController`/`favoritoRoutes`/`exportRoutes` a confirmar no momento da edição (seguir padrão do arquivo).
- Testes de integração dependem do setup de DB de teste do projeto (verificar `jest.setup.js`).

**Consistência de tipos:** `AccessUser` (Task 2) reusado por freemium/requirePaid/account. `maskAnuncio`/`LOCKED_FIELDS` (Task 3) reusado por freemium. `DAILY_FREE_LIMIT`/`viewedTodayIds`/`recordView`/`countViewsToday` (Task 4) reusado por freemium/account. OK.
