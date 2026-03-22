# Configuração de RLS (Row Level Security) no Supabase

## Status Atual

✅ **RLS está configurado e desabilitado** para todas as tabelas do projeto.

## Por que RLS está desabilitado?

Este projeto usa uma arquitetura específica que requer RLS desabilitado:

1. **Autenticação JWT Própria**: O projeto não usa Supabase Auth, mas sim autenticação JWT própria implementada no backend
2. **Prisma com Connection String Direta**: O Prisma acessa o banco usando a connection string do postgres (service role), não a anon key do Supabase
3. **Segurança na Camada da Aplicação**: A segurança é implementada via:
   - Middleware de autenticação JWT (`authMiddleware.ts`)
   - Rate limiting (`redisRateLimit.ts`)
   - Validação de permissões nos controllers
   - Logs de auditoria (`AdminAuditLog`)

## Tabelas com RLS Desabilitado

Todas as tabelas do projeto têm RLS desabilitado:

- `User`
- `AdminAuditLog`
- `Nicho`
- `Oferta`
- `Favorito`
- `OfertaView`
- `UserSettings`
- `UserProfile`
- `ApiKey`
- `Webhook`
- `WebhookLog`
- `Subscription`
- `Payment`

## Segurança Implementada

Mesmo com RLS desabilitado, o projeto implementa segurança robusta:

### 1. Autenticação e Autorização
- ✅ JWT tokens assinados com `JWT_SECRET` (mínimo 32 caracteres)
- ✅ Middleware `authenticateJWT` valida tokens em todas as rotas protegidas
- ✅ Verificação de roles (admin/user) nos controllers
- ✅ Validação de propriedade de recursos (usuário só acessa seus próprios dados)

### 2. Rate Limiting
- ✅ Rate limiting por IP para login/registro
- ✅ Rate limiting por usuário para operações autenticadas
- ✅ Proteção contra DDoS e brute force

### 3. Validação de Dados
- ✅ Validação de entrada com Joi
- ✅ Sanitização de dados
- ✅ Validação de tipos e formatos

### 4. Logs e Auditoria
- ✅ Logs estruturados (Winston)
- ✅ Logs de auditoria para ações administrativas
- ✅ Logs de webhooks recebidos

### 5. Criptografia
- ✅ Senhas hasheadas com bcrypt (12 rounds)
- ✅ Tokens JWT assinados
- ✅ HTTPS obrigatório em produção

## Se Você Quiser Habilitar RLS no Futuro

Se você decidir migrar para Supabase Auth e habilitar RLS, precisará:

### 1. Migrar para Supabase Auth
```typescript
// Em vez de JWT próprio, usar:
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, anonKey);
```

### 2. Criar Políticas RLS
```sql
-- Exemplo para tabela User
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON "User" FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON "User" FOR UPDATE
  USING (auth.uid()::text = id);
```

### 3. Atualizar Prisma
- Usar connection string com anon key (não service role)
- Ou criar políticas que permitam service role para operações administrativas

## Verificação

Para verificar o status do RLS no Supabase:

1. Acesse o Supabase Dashboard
2. Vá em **Database** → **Tables**
3. Selecione uma tabela
4. Vá na aba **Policies**
5. Verifique se RLS está desabilitado (ou políticas configuradas)

## Migração Aplicada

A migração `20251124190000_configure_rls` foi aplicada e desabilita RLS em todas as tabelas.

Para verificar:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Todas as tabelas devem ter `rowsecurity = false`.

## Recomendações

1. ✅ **Mantenha RLS desabilitado** enquanto usar autenticação JWT própria
2. ✅ **Continue usando** middleware de autenticação no backend
3. ✅ **Monitore logs** para detectar acessos não autorizados
4. ✅ **Use HTTPS** em produção
5. ✅ **Mantenha `JWT_SECRET` seguro** (não commitar no repositório)
6. ✅ **Configure rate limiting** adequadamente
7. ✅ **Faça backups regulares** do banco de dados

## Conclusão

A configuração atual (RLS desabilitado + segurança na camada da aplicação) é **adequada e segura** para este projeto, considerando que:

- A autenticação é feita via JWT próprio
- O Prisma usa connection string direta
- A segurança é implementada na camada da aplicação
- Há logs e auditoria adequados

**Não é necessário habilitar RLS** a menos que você migre para Supabase Auth.

