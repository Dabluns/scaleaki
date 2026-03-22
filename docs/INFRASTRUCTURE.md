# Infraestrutura e Observabilidade

## Componentes

| Serviço | Descrição |
| --- | --- |
| `api` | Backend Express (porta 4000). |
| `frontend` | Next.js App Router (porta 3000). |
| `postgres` | Banco transacional para Prisma. |
| `redis` | Cache, rate limit e filas Bull (e-mail + billing). |
| `billing monitor` | Job periódico definido em `src/services/billingService.ts`. |
| `playwright` | Testes E2E da pasta `frontend/tests`. |

## Fluxo de deploy

1. **CI** garante lint/tests/build (`ci.yml`).
2. **Staging** recebe cada merge na `main` (`deploy-staging.yml`).
3. **Produção** é promovida manualmente com aprovação (`deploy-prod.yml` – ambiente `production` no GitHub). Use `mode=rollback` para reinstalar um artefato antigo.
4. Os artefatos (`dist/` + `frontend/.next`) são sincronizados via `rsync`. Ajuste os segredos `STAGING_*`/`PROD_*` com host, usuário, porta e chave SSH.

## Monitoramento

- **Health endpoints**
  - `GET /health` – uptime do backend.
  - `GET /payments/health` – métricas do billing (pendências, expirações, último ciclo).
- **Logs estruturados** (`src/config/logger.ts`) enviados para stdout. Configure forwarder para Loki/Datadog.
- **Alertas sugeridos**
  - Falha de webhook da Cakto (`logger.error` em `caktoWebhookController`).
  - `billingService` registrando `error` ou `warn`.
  - Falhas no workflow de deploy (GitHub notifications / Slack).

## Procedimentos Operacionais

- **Backups**: use snapshots do Postgres + `redis-cli --rdb` diariamente.
- **Seeds**: `npm run seed` popula nichos iniciais; `npm run seed:exemplo` adiciona ofertas demo.
- **Migrações**: rodar `npm run prisma:migrate deploy` antes de subir containers.
- **Incidentes**: acione rollback pelo workflow de produção e abra tarefa de RCA documentando logs + passo a passo.

## Checklist antes do Go-Live

- [ ] Variáveis sensíveis em `staging.env`/`production.env`.
- [ ] `npm run test:e2e` executado contra ambiente provisionado.
- [ ] Webhook da Cakto apontando para `/payments/webhook/cakto`.
- [ ] Monitoramento externo configurado (Statuspage, Pingdom etc.).

