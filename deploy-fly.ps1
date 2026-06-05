# deploy-fly.ps1 — sobe secrets do .env pro Fly e faz deploy do backend scaleaki.
# Rodar APOS: flyctl auth login  +  flyctl apps create scaleaki-api
# Uso: .\deploy-fly.ps1

$ErrorActionPreference = "Stop"
$APP = "scaleaki-api"

# Keys que NAO vao como secret (vem do fly.toml [env] ou sao dev-only / setadas a parte)
$DENY = @(
  "PORT","HOST","NODE_ENV",
  "FRONTEND_URL","BACKEND_URL","APP_URL","NEXT_PUBLIC_API_URL"
)

if (-not (Test-Path ".env")) { throw ".env nao encontrado no diretorio atual" }

# Monta lista KEY=VALUE filtrada
$lines = Get-Content ".env" | Where-Object {
  $_ -match "^\s*[A-Z_]+=" -and $_ -notmatch "^\s*#"
}
$payload = foreach ($l in $lines) {
  $parts = $l -split "=",2
  $key = $parts[0].Trim()
  if ($DENY -contains $key) { continue }
  $val = $parts[1]
  # strip aspas externas (" ou ') que o .env usa mas o fly guardaria literal
  if ($val -match '^\s*"(.*)"\s*$') { $val = $Matches[1] }
  elseif ($val -match "^\s*'(.*)'\s*$") { $val = $Matches[1] }
  "$key=$val"
}

Write-Host "Importando $($payload.Count) secrets para $APP..." -ForegroundColor Cyan
$payload -join "`n" | flyctl secrets import --app $APP --stage

# BACKEND_URL/APP_URL prod (dominio fixo Fly). FRONTEND_URL fica pendente ate Vercel.
flyctl secrets set --app $APP --stage `
  BACKEND_URL="https://$APP.fly.dev" `
  APP_URL="https://$APP.fly.dev"

Write-Host "Secrets staged. Deployando..." -ForegroundColor Cyan
flyctl deploy --app $APP

Write-Host ""
Write-Host "PENDENTE apos deploy do frontend na Vercel:" -ForegroundColor Yellow
Write-Host "  flyctl secrets set --app $APP FRONTEND_URL=`"https://SEU-APP.vercel.app`"" -ForegroundColor Yellow
