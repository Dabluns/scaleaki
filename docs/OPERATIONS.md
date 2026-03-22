# Operações e Ambiente

## Variáveis de Ambiente Obrigatórias

| Variável | Descrição |
| --- | --- |
| `NODE_ENV` | `development`, `staging` ou `production`. |
| `PORT` / `HOST` | Porta/host expostos pelo backend. |
| `DATABASE_URL` | Connection string Prisma (Postgres). |
| `JWT_SECRET` | String ≥ 32 caracteres para assinar tokens. |
| `FRONTEND_URL` / `BACKEND_URL` | URLs públicas usadas em e-mails/webhooks. |
| `ALLOW_AUTO_CONFIRM` | `true` apenas em ambientes controlados (checkout). |
| `REDIS_HOST` / `REDIS_PORT` / `ENABLE_REDIS` | Configuração dos caches & filas Bull. |
| `CAKTO_WEBHOOK_SECRET` | Secret compartilhado com a Cakto. |
| `SMTP_*` / `EMAIL_FROM` | Credenciais SMTP para disparos transacionais. |

Use o modelo `infra/staging/README.md` para gerar arquivos `.env` específicos por ambiente.

## Setup Local / Staging

```bash
npm run install:all        # deps raiz + frontend
npm run prisma:generate
npm run prisma:migrate
npm run seed               # popula nichos + ofertas
npm run dev:both           # backend 4000 + frontend 3001
```

Em staging utilize `docker compose -f infra/staging/docker-compose.yml --env-file infra/staging/staging.env up -d` para subir Postgres, Redis, API e Frontend de uma vez.

## Scripts Úteis

| Comando | Descrição |
| --- | --- |
| `npm run test:backend` | Executa Jest no backend (unit/integration). |
| `npm run test:frontend` | Executa Jest no frontend. |
| `npm run test:e2e` | Roda Playwright (requer `npx playwright install`). |
| `npm run build` / `npm run build:frontend` | Gera artefatos do backend e Next.js. |
| `npm run seed` / `npm run seed:exemplo` | Seeds oficiais de nichos/ofertas. |
| `npm run seed:staging` | Cria usuários de teste com planos pagos para staging. |

## Deploys

1. **CI:** `.github/workflows/ci.yml` roda lint + testes + builds em cada PR.
2. **Staging:** `.github/workflows/deploy-staging.yml` publica artefatos e (opcionalmente) sincroniza via `rsync` para o servidor configurado nas variáveis `STAGING_*`.
3. **Produção:** `.github/workflows/deploy-prod.yml` promove uma build da main (`mode=deploy`) e permite rollback instantâneo (`mode=rollback`) reaplicando qualquer artefato armazenado.

Para rollback manual consulte `infra/deploy/ROLLBACK.md`.

