# Script para configurar o ambiente de desenvolvimento
# Execute este script no PowerShell como: .\setup-env.ps1

Write-Host "🔧 Configurando ambiente de desenvolvimento..." -ForegroundColor Green

# Criar arquivo .env se não existir
if (-not (Test-Path ".env")) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    
    $envContent = @"
# Database
DATABASE_URL="file:./admin.db"

# JWT
JWT_SECRET="Qw8!zP2@rT7vL6$kN9^bS4&xM1*eJ5%uH0adadfawrd34ef344"

# Redis (desabilitado para desenvolvimento local)
ENABLE_REDIS=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app

# Server
PORT=3000
NODE_ENV=development
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "✅ Arquivo .env criado com Redis desabilitado" -ForegroundColor Green
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
}

Write-Host "🚀 Ambiente configurado! Agora você pode executar:" -ForegroundColor Green
Write-Host "   npm run dev:both" -ForegroundColor Cyan
Write-Host "   ou" -ForegroundColor Cyan
Write-Host "   .\start-dev.ps1" -ForegroundColor Cyan 