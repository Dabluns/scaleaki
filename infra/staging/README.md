# Ambiente de Staging

1. Crie um arquivo `infra/staging/staging.env` com as variáveis necessárias. Use o modelo abaixo:

```
NODE_ENV=staging
PORT=4000
HOST=0.0.0.0
ALLOW_AUTO_CONFIRM=false
JWT_SECRET=<string aleatória com 64+ caracteres>
FRONTEND_URL=https://staging.app.example.com
BACKEND_URL=https://staging.api.example.com
DATABASE_URL=postgresql://skaleaki:skaleaki@postgres:5432/skaleaki?schema=public
REDIS_HOST=redis
REDIS_PORT=6379
ENABLE_REDIS=true
EMAIL_QUEUE_CONCURRENCY=5
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<credencial>
SMTP_PASS=<credencial>
EMAIL_FROM="Skaleaki Staging <no-reply@skaleaki.com>"
CAKTO_WEBHOOK_SECRET=<segredo do webhook>
PLAYWRIGHT_BASE_URL=https://staging.app.example.com
```

2. Execute `docker compose -f infra/staging/docker-compose.yml --env-file infra/staging/staging.env up -d` para subir Postgres, Redis, API e Frontend.

3. Exponha as portas 3000 (frontend) e 4000 (API) no load balancer da sua stack.

4. Configure os webhooks da Cakto e SMTP apontando para os hostnames definidos nas variáveis acima.

