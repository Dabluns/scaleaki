# Script PowerShell para iniciar o desenvolvimento
# Execute este script no PowerShell como: .\start-dev.ps1

Write-Host "🚀 Iniciando o desenvolvimento do SaaS..." -ForegroundColor Green

# Verificar se o Node.js está instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se o npm está instalado
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm não encontrado. Instale o npm primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências do backend" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Yellow
cd frontend
npm install
cd ..

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências do frontend" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Gerando cliente Prisma..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar cliente Prisma" -ForegroundColor Red
    exit 1
}

Write-Host "🗄️ Executando migrações do banco..." -ForegroundColor Yellow
npx prisma migrate dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao executar migrações" -ForegroundColor Red
    exit 1
}

Write-Host "👤 Criando administrador..." -ForegroundColor Yellow
npm run create-admin

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao criar administrador" -ForegroundColor Red
    exit 1
}

Write-Host "🌱 Populando banco com dados iniciais..." -ForegroundColor Yellow
npm run seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao popular banco" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Iniciando servidores..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3333" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar os servidores" -ForegroundColor Yellow

# Iniciar ambos os servidores usando concurrently
npm run dev:both 