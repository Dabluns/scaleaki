@echo off
echo 🚀 Iniciando o desenvolvimento do SaaS...

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Instale o Node.js primeiro.
    pause
    exit /b 1
)

REM Verificar se o npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm não encontrado. Instale o npm primeiro.
    pause
    exit /b 1
)

echo 📦 Instalando dependências do backend...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências do backend
    pause
    exit /b 1
)

echo 📦 Instalando dependências do frontend...
cd frontend
call npm install
cd ..
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências do frontend
    pause
    exit /b 1
)

echo 🔧 Gerando cliente Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Erro ao gerar cliente Prisma
    pause
    exit /b 1
)

echo 🗄️ Executando migrações do banco...
call npx prisma migrate dev
if %errorlevel% neq 0 (
    echo ❌ Erro ao executar migrações
    pause
    exit /b 1
)

echo 👤 Criando administrador...
call npm run create-admin
if %errorlevel% neq 0 (
    echo ❌ Erro ao criar administrador
    pause
    exit /b 1
)

echo 🌱 Populando banco com dados iniciais...
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ Erro ao popular banco
    pause
    exit /b 1
)

echo 🚀 Iniciando servidores...
echo Backend: http://localhost:3333
echo Frontend: http://localhost:3001
echo Pressione Ctrl+C para parar os servidores

REM Iniciar ambos os servidores usando concurrently
call npm run dev:both 