# Implementação de Segurança - Proteção de Rotas

## Visão Geral

Este documento descreve as proteções de segurança implementadas em todas as rotas do sistema antes do lançamento.

## Middlewares de Segurança Implementados

### 1. Autenticação e Autorização

#### `authenticateJWT`
- **Localização**: `src/middlewares/authMiddleware.ts`
- **Função**: Valida tokens JWT e verifica se o usuário está autenticado
- **Aplicado em**: Todas as rotas protegidas
- **Validações**:
  - Token JWT válido
  - Email confirmado
  - Conta ativa

#### `authorizeRoles`
- **Localização**: `src/middlewares/roleMiddleware.ts`
- **Função**: Valida se o usuário tem as permissões necessárias
- **Aplicado em**: Rotas admin e rotas premium

#### `validateAdminAccess`
- **Localização**: `src/middlewares/adminSecurityMiddleware.ts`
- **Função**: Validação adicional para rotas administrativas
- **Validações**:
  - Usuário existe no banco
  - Conta está ativa
  - Role é realmente 'admin'
  - Email confirmado
- **Logging**: Registra todas as ações administrativas

### 2. Validação de Propriedade de Recursos

#### `validateOwnership`
- **Localização**: `src/middlewares/ownershipMiddleware.ts`
- **Função**: Garante que usuários só acessam seus próprios recursos
- **Tipos de recursos protegidos**:
  - `user`: Dados do usuário
  - `favorito`: Favoritos do usuário
  - `settings`: Configurações do usuário
  - `profile`: Perfil do usuário
  - `apikey`: Chaves de API do usuário
  - `webhook`: Webhooks do usuário
  - `export`: Exports de dados do usuário
  - `subscription`: Assinaturas do usuário
  - `payment`: Pagamentos do usuário
- **Exceção**: Admins podem acessar qualquer recurso

### 3. Sanitização de Entrada

#### `sanitizeInput`
- **Localização**: `src/middlewares/inputSanitizationMiddleware.ts`
- **Função**: Remove caracteres perigosos e scripts maliciosos
- **Aplicado em**: Globalmente (server.ts) e em rotas específicas
- **Proteções**:
  - Remove caracteres de controle
  - Remove tags `<script>`
  - Sanitiza body, query params e route params

#### `validateUUID`
- **Localização**: `src/middlewares/inputSanitizationMiddleware.ts`
- **Função**: Valida que IDs são UUIDs válidos
- **Aplicado em**: Rotas que recebem IDs como parâmetro

### 4. Rate Limiting

#### Rate Limiting Global
- **Localização**: `src/server.ts`
- **Configuração**: 100 requisições por IP a cada 15 minutos

#### Rate Limiting por Tipo
- **Admin Routes**: 20 requisições por 15 minutos
- **User Routes**: Configurável via Redis
- **Auth Routes**: Rate limiting específico para login/registro

### 5. Proteção CSRF

#### `validateCSRF` / `requireCSRF`
- **Localização**: `src/middlewares/csrfMiddleware.ts`
- **Função**: Protege contra ataques Cross-Site Request Forgery
- **Aplicado em**: Rotas que modificam dados (POST, PUT, PATCH, DELETE)
- **Como funciona**:
  - Token CSRF gerado após login
  - Token enviado no header `X-CSRF-Token`
  - Token válido por 1 hora
  - Tokens expirados são limpos automaticamente
- **Endpoint**: `GET /auth/csrf-token` (requer autenticação)

### 6. Logging de Segurança

#### `securityLogger`
- **Localização**: `src/middlewares/securityLoggingMiddleware.ts`
- **Função**: Registra ações de segurança críticas
- **Informações registradas**:
  - Ação executada
  - Usuário e role
  - Método HTTP e path
  - IP e User-Agent
  - Status code e duração
  - Timestamp

#### `logAdminAction`
- **Localização**: `src/middlewares/adminSecurityMiddleware.ts`
- **Função**: Logging específico para ações administrativas
- **Aplicado em**: Todas as rotas admin críticas

## Rotas Protegidas

### Rotas Admin (`/admin/*`)
- ✅ Autenticação JWT
- ✅ Validação de acesso admin
- ✅ Autorização de role
- ✅ Rate limiting rigoroso (20 req/15min)
- ✅ Sanitização de entrada
- ✅ Logging de segurança
- ✅ Validação de UUID

**Rotas protegidas**:
- `GET /admin/users` - Listar usuários
- `PUT /admin/users/:id` - Atualizar usuário
- `DELETE /admin/users/:id` - Deletar usuário
- `POST /admin/admins` - Criar admin

### Rotas de Favoritos (`/favoritos/*`)
- ✅ Autenticação JWT
- ✅ Validação de propriedade
- ✅ Rate limiting
- ✅ Sanitização de entrada
- ✅ Validação de UUID

### Rotas de Perfil (`/profile/*`)
- ✅ Autenticação JWT
- ✅ Validação de propriedade
- ✅ Rate limiting
- ✅ Sanitização de entrada
- ✅ Logging de atualizações

### Rotas de Configurações (`/settings/*`)
- ✅ Autenticação JWT
- ✅ Validação de propriedade
- ✅ Rate limiting
- ✅ Sanitização de entrada

### Rotas de API Keys (`/keys/*`)
- ✅ Autenticação JWT
- ✅ Validação de propriedade
- ✅ Rate limiting
- ✅ Sanitização de entrada
- ✅ Validação de UUID
- ✅ Logging de ações críticas

### Rotas de Webhooks (`/webhooks/*`)
- ✅ Autenticação JWT (exceto `/inbound`)
- ✅ Validação de propriedade
- ✅ Rate limiting
- ✅ Sanitização de entrada
- ✅ Validação de UUID
- ✅ Logging de ações críticas

### Rotas de Pagamentos (`/payments/*`)
- ✅ Autenticação JWT (exceto `/webhook/cakto`)
- ✅ Validação de propriedade
- ✅ Rate limiting
- ✅ Sanitização de entrada
- ✅ Validação de UUID
- ✅ Logging de ações críticas (sem dados sensíveis)

### Rotas de Conta (`/account/*`)
- ✅ Autenticação JWT
- ✅ Validação de propriedade
- ✅ Rate limiting
- ✅ Sanitização de entrada
- ✅ Logging de ações críticas

### Rotas de Export (`/export/*`)
- ✅ Autenticação JWT
- ✅ Validação de propriedade
- ✅ Rate limiting
- ✅ Sanitização de entrada
- ✅ Validação de UUID
- ✅ Logging de downloads

## Proteções Adicionais

### 1. Helmet.js
- Content Security Policy (CSP)
- HSTS (HTTP Strict Transport Security)
- XSS Protection
- Frame Options

### 2. CORS
- Configuração restritiva
- Apenas origens permitidas

### 3. Cookie Security
- `httpOnly`: true
- `sameSite`: 'lax'
- `secure`: true (em produção)

### 4. Input Validation
- Validação de tipos
- Validação de formatos (UUID, email, etc.)
- Limites de tamanho

### 5. Error Handling
- Não expor stack traces em produção
- Logging de erros sem dados sensíveis
- Mensagens de erro genéricas para usuários

## Monitoramento

### Logs de Segurança
Todos os logs de segurança são registrados com:
- Timestamp
- Usuário e role
- Ação executada
- IP e User-Agent
- Status code

### Alertas Recomendados
Configure alertas para:
- Múltiplas tentativas de acesso não autorizado
- Rate limit excedido frequentemente
- Ações administrativas suspeitas
- Tentativas de acesso a recursos de outros usuários

## Checklist de Segurança

Antes do lançamento, verifique:

- [x] Todas as rotas protegidas têm autenticação
- [x] Validação de propriedade implementada
- [x] Sanitização de entrada aplicada
- [x] Rate limiting configurado
- [x] Logging de segurança ativo
- [x] Validação de UUID em rotas com IDs
- [x] Proteção especial para rotas admin
- [x] Helmet.js configurado
- [x] CORS restritivo
- [x] Cookies seguros
- [x] Error handling adequado
- [x] Proteção CSRF implementada

## Próximos Passos

1. **Monitorar logs** após lançamento
2. **Configurar alertas** para ações suspeitas
3. **Revisar logs regularmente** para identificar padrões
4. **Atualizar proteções** conforme necessário
5. **Realizar testes de penetração** periodicamente

## Notas Importantes

- Admins têm acesso total, mas todas as ações são logadas
- Rate limiting pode ser ajustado conforme necessário
- Logs não contêm dados sensíveis (senhas, tokens, etc.)
- Validação de propriedade previne acesso não autorizado
- Sanitização previne XSS e injection attacks

