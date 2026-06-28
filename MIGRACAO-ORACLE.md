# Migração Backend scaleaki → Oracle Cloud Always Free

Motivo: trial Fly.io acabou. Oracle Always Free = VM Linux grátis pra sempre, sempre ligada.

## PARTE 1 — Tu faz (criar a VM, ~15 min, browser)

### 1. Conta Oracle Cloud
- https://www.oracle.com/cloud/free/ → "Start for free"
- Cadastro: email + cartão (só verificação de identidade, **NÃO cobra** no Always Free)
- Região: escolher **São Paulo (sa-saopaulo-1)** ou US East — perto do Supabase

### 2. Criar instância (VM)
- Menu → Compute → Instances → **Create Instance**
- Nome: `scaleaki-api`
- Image: **Ubuntu 22.04**
- Shape: **VM.Standard.E2.1.Micro** (x86, Always Free — mais disponível que ARM) OU **VM.Standard.A1.Flex** (ARM, 1 OCPU/6GB se tiver capacidade)
- **SSH keys**: "Generate a key pair for me" → **baixa a private key** (.key) — guarda, vou precisar
- Create

### 3. Abrir portas (firewall)
- Na instância → Subnet → Security List → Default → **Add Ingress Rules**:
  - Source `0.0.0.0/0`, porta **80** (HTTP)
  - Source `0.0.0.0/0`, porta **443** (HTTPS)
- (porta 22 SSH já vem aberta)

### 4. Me manda
- **IP público** da VM (aparece na página da instância)
- O arquivo **.key** (private key SSH) — ou cola o conteúdo
- (opcional) domínio que queira apontar (ex: api.geekacademy.site)

## PARTE 2 — Eu faço (via SSH, depois que me der IP+key)
1. SSH na VM, `apt install nodejs npm git nginx certbot`
2. Clone github.com/Dabluns/scaleaki
3. `.env` na VM com secrets (DB, JWT, GOOGLE_CREDENTIALS_BASE64, etc — pego do .env local)
4. **DB connection**: Oracle VM é IPv4 → usar **Supabase pooler** (IPv4) em vez do direct IPv6:
   - String: `postgresql://postgres.awcwgshizdrvwmcmwxek:[SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Username TEM que ser `postgres.awcwgshizdrvwmcmwxek` (com projectref) — o "Tenant or user not found" anterior era username errado (`postgres` puro)
   - Pegar host/região exatos no Supabase Dashboard → Connect → Connection pooling
5. `npm run build` + **pm2** (sempre ligado, restart no boot) → bot + cron funcionam
6. **nginx** reverse proxy :4000 → :80/:443 + **certbot** SSL (HTTPS grátis)
7. Apontar frontend: `vercel env` NEXT_PUBLIC_API_URL = https://[dominio-ou-ip] + redeploy
8. Smoke: login + /ofertas + bot

## Notas
- Sem IPv6 na VM → pooler IPv4 resolve (não precisa configurar IPv6 no VCN)
- pm2 mantém o processo vivo = sem cold-start (resolve o "SERVIDOR INDISPONÍVEL")
- Custo: $0/mês forever (Always Free não expira como o trial Fly)
- Secrets vêm do .env local: `operacoes/projetos/scaleaki/.env` (DATABASE_URL trocar pra pooler, resto igual)

## Estado atual (pré-migração)
- Backend Fly OFFLINE (trial acabou). Frontend Vercel ON (https://scaleaki-five.vercel.app) mas sem backend = login falha.
- Código: github.com/Dabluns/scaleaki @ main bdfd06e+ (freemium + todos fixes desta semana).
- Secrets prontos no .env local. GOOGLE_CREDENTIALS_BASE64 já gerado (bot Drive auth).
