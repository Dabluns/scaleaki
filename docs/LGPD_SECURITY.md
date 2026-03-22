# Guia LGPD & Segurança

## Inventário de Dados Pessoais

| Origem | Campos | Finalidade | Retenção sugerida |
| --- | --- | --- | --- |
| `User` | nome, e-mail, plano, IP inicial | Autenticação, cobrança | Enquanto durar a conta + 6 meses. |
| `Payment` | amounts, método, metadados Cakto | Faturamento e auditoria | 5 anos (obrigações fiscais). |
| `WebhookLog` | payloads da Cakto | Diagnóstico | 90 dias. |

> Nunca serialize senhas ou tokens em logs. Os campos `password` já são armazenados usando `bcrypt`.

## Controles Técnicos

- **Criptografia**: force HTTPS nas camadas de deploy. Gere `JWT_SECRET` ≥ 64 chars, mantenha fora do repositório.
- **Acesso**: somente administradores confiáveis recebem role `admin`. Logs de alteração já são registrados em `adminService`.
- **Rate limiting**: Redis `redisRateLimit.ts` limita login/register e chamadas sensíveis.
- **Cookies**: `auth_token` é `httpOnly + sameSite=lax`, peça para ativar `secure` em produção.
- **Monitoramento**: configure alertas para múltiplas falhas de login, mudanças de plano e webhooks inválidos.

## Procedimento de Incidente

1. Acione rollback (workflow `deploy-prod`) e invalide tokens afetados.
2. Reúna logs (`logger` + `/payments/health`) para entender escopo.
3. Notifique titulares e autoridades em até 72h conforme LGPD.
4. Documente causa raiz e plano de mitigação em ticket interno.

## Privacidade & Consentimento

- Inclua política de privacidade e termos de uso no onboarding.
- Para comunicações de marketing, utilize flags já existentes em `UserSettings` (`emailNewOffers`, `emailNewsletter`).
- Atenda direitos dos titulares com endpoints internos (download/anonimização) – recomendação: criar rota admin que exporta dados do usuário on-demand.

