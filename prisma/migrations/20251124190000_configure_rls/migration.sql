-- Configuração de Row Level Security (RLS) para Supabase
-- IMPORTANTE: Este projeto usa autenticação JWT própria (não Supabase Auth)
-- e Prisma com connection string direta. Portanto, desabilitamos RLS nas tabelas
-- que o Prisma precisa acessar, já que a segurança é feita na camada da aplicação.

-- Desabilitar RLS em todas as tabelas (segurança na camada da aplicação)
-- A autenticação e autorização são feitas via middleware JWT no backend

ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminAuditLog" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Nicho" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Oferta" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Favorito" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "OfertaView" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "UserProfile" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Webhook" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "WebhookLog" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" DISABLE ROW LEVEL SECURITY;

-- Nota: Se você quiser habilitar RLS no futuro, precisará:
-- 1. Criar políticas que permitam acesso do service role (postgres)
-- 2. Ou usar Supabase Auth em vez de JWT próprio
-- 3. Ou criar políticas baseadas em JWT claims

-- Exemplo de política RLS (comentado - não executar agora):
-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can only see their own data"
--   ON "User" FOR SELECT
--   USING (auth.uid()::text = id);

