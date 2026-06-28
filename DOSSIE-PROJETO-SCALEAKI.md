# DOSSIÊ scaleaki — todos os caminhos (local + externo)

> SaaS espião de anúncios FB Ad Library. Freemium em produção. Meta R$300k/dez-2026.
> Snapshot: 2026-06-07.

---

## 1. REPOSITÓRIOS (GitHub)

| Repo | URL | Conteúdo |
|---|---|---|
| **App principal** (backend + frontend + scraper + extension) | https://github.com/Dabluns/scaleaki | monorepo: API Express, frontend Next.js, scraper, extensão Chrome |
| **Página de vendas** (LP) | https://github.com/Geeknosnegocios/scaleaki03 | single-page index.html + style.css + assets |

Dono GitHub app = conta **Dabluns**. Git local = **Geeknosnegocios** (collaborator write).

---

## 2. CAMINHOS LOCAIS (Windows)

| O quê | Caminho |
|---|---|
| **App principal** (raiz monorepo) | `c:\Users\freit\Documents\Geek OS\geek-os-claude\operacoes\projetos\scaleaki` |
| Backend (Express+TS+Prisma) | `...\scaleaki\src` |
| Frontend (Next.js 16) | `...\scaleaki\frontend` |
| Scraper diário | `...\scaleaki\scraper-auto.js` + `keywords.json` |
| Extensão Chrome | `...\scaleaki\extension` |
| `.env` backend (secrets) | `...\scaleaki\.env` |
| `.env.local` frontend | `...\scaleaki\frontend\.env.local` |
| Config CORS | `...\scaleaki\src\config\cors.ts` |
| Webhook Cakto | `...\scaleaki\src\controllers\caktoWebhookController.ts` |
| Doc migração Oracle | `...\scaleaki\MIGRACAO-ORACLE.md` |
| **Página de vendas (LP)** | `C:\Users\freit\Documents\04-LABS\scaleaki03` |
| LP arquivos | `04-LABS\scaleaki03\index.html` · `style.css` · `assets\` |
| **SSH key Oracle** | `C:\Users\freit\Downloads\ssh-key-2026-06-06 (1).key` ⚠️ backup obrigatório |

---

## 3. INFRA EXTERNA

### Backend — Oracle Cloud Always Free ($0/mês forever)
- Domínio: **https://api.scaleaki.site** (SSL Let's Encrypt)
- IP público: `137.131.235.236` · user SSH `ubuntu`
- SSH: `ssh -i "C:\Users\freit\Downloads\ssh-key-2026-06-06 (1).key" ubuntu@137.131.235.236`
- Shape VM.Standard.E2.1.Micro · Ubuntu 20.04 · 2 vCPU · 1GB RAM + 2GB swap · 45GB
- Região sa-saopaulo-1 AD-1 · conta Oracle `andreyfreitadsd` (root compartment)
- App na VM: `~/scaleaki` · pm2 process `scaleaki-api` (porta 4000)
- nginx :443/:80 → :4000
- Migrado do Fly 2026-06-06 (trial Fly acabou, pedia cartão)

### Frontend (app) — Vercel
- Domínio: **https://app.scaleaki.site** (abre em login)
- Source: subpasta `frontend/` do repo Dabluns/scaleaki
- Chama backend via `NEXT_PUBLIC_API_URL` = https://api.scaleaki.site

### Página de vendas (LP) — Vercel
- Projeto Vercel: **https://vercel.com/andreys-projects-5cafebdf/scaleaki03**
- Source: repo Geeknosnegocios/scaleaki03
- Deploy auto no push da main

### Banco — Supabase (projeto dedicado `awcwgshizdrvwmcmwxek`)
- URL: https://awcwgshizdrvwmcmwxek.supabase.co
- DB = só dados relacionais (arquivos grandes vão pro Google Drive p/ não estourar free tier)
- **Direct host = IPv6-only** (`db.awcwgshizdrvwmcmwxek.supabase.co:5432`) — VM Oracle é IPv4 → usar **pooler IPv4** (`aws-1-sa-east-1`, porta 6543, user `postgres.awcwgshizdrvwmcmwxek`)
- `schema.prisma` = fonte de verdade (migration history quebrada; usar `prisma db push`)
- Banco ~5450 anúncios (2026-06-06)

### Uploads — Google Drive
- service account `bot-drive@scaleakibot` · creds em `.env` (`GOOGLE_CREDENTIALS_JSON`)
- NÃO usa Supabase Storage

### Scraper diário — GitHub Actions (R$0)
- Workflow: `.github/workflows/scrape-daily.yml` · cron `0 12 * * *` (09h BRT)
- Puppeteer headless stealth, grava via Supabase REST (service_role)
- Secrets no repo: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- ~329 novos/run · gotcha: header `Accept-Language: pt-BR` obrigatório (IP US renderiza FB em inglês)

---

## 4. STACK
- Backend: Express + TypeScript + Prisma (porta 4000) · Auth = **JWT próprio** (não Supabase Auth) · Redis off local
- Frontend: Next.js 16 (porta local 3001)
- Extension Chrome · minerador.js (Puppeteer manual)

---

## 5. ADMINS
- `freitasandrey14@gmail.com` / `A@36485702d` (admin)
- `admin@scaleaki.com` / `AdminScaleaki!2024` (admin backup)

---

## 6. PREÇOS / CHECKOUT (Cakto)
| Plano | Headline | Cobrança real | Economia/ano |
|---|---|---|---|
| Mensal | R$84/mês | mensal | — |
| Trimestral | R$75/mês | R$225 a cada 3 meses | R$108 |
| Anual | R$67/mês | R$804 anual | R$204 |

⚠️ **Pendências de checkout:**
- LP scaleaki03: 4 botões ainda `href="#"` (cta-monthly, cta-quarterly, cta-annual, exitCta) — falta plotar links Cakto
- Webhook `caktoWebhookController.ts` (repo principal) ainda valida preços antigos R$97/271/974 — atualizar p/ bater nos novos product_ids senão não libera acesso

---

## 7. DEPLOY — comandos

### Backend (Oracle, via SSH)
```
cd ~/scaleaki && git pull && npx prisma generate && \
NODE_OPTIONS=--max-old-space-size=2048 npx tsc && pm2 restart scaleaki-api
```
⚠️ **OOM:** `npm run build` dá `Aborted (core dumped)` (1GB RAM). USAR `npx tsc` com NODE_OPTIONS. Build TEM que sair EXIT=0 senão pm2 roda dist antigo.

### Frontend app + LP (Vercel)
Push na main → deploy auto.

---

## 8. ÚLTIMOS COMMITS

**App principal (Dabluns/scaleaki):**
- `a512399` fix(cors): liberar app.scaleaki.site + apex + subdominios .scaleaki.site
- `a538624` fix(auth): home abre em login por padrao
- `2ede627` style(ofertas): whitespace-nowrap Data de Captura + Acessar Dossie

**LP (Geeknosnegocios/scaleaki03):**
- `168fd90` feat(exit-intent): popup saida oferta mensal R$84
- `a0135d1` fix(pricing): planos R$84/75/67 por mes
- `f7c7b28` feat: favicon SVG
