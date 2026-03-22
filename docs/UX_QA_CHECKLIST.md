# Checklist UX / QA

## Responsividade
- [ ] Autenticação (`/auth`) funciona em mobile (≤ 375px) e desktop (≥ 1440px).
- [ ] Dashboard e seção Descubraki mantêm FPS estável mesmo com animações ativas.
- [ ] Admin › Usuários tabela se adapta para mobile (scroll horizontal).

## Acessibilidade
- [ ] Todos os botões possuem `aria-label` ou texto explícito.
- [ ] Inputs possuem `label` associado (`htmlFor`).
- [ ] Contraste mínimo 4.5:1 tanto no modo claro quanto escuro.

## Fluxos Críticos
- [ ] Cadastro → e-mail de confirmação → login.
- [ ] Upgrade/downgrade de plano via `/payments/subscription`.
- [ ] Visualização de VSL na aba Descubraki (preload + swipe).

## Regressões Visuais
- [ ] Dark mode: validação manual executando `document.documentElement.classList.add('dark')`.
- [ ] Componentes shadcn/Tailwind com estados `hover`, `active`, `disabled`.
- [ ] Toasts e banners não sobrepõem CTA principais.

## Dados de Staging
- [ ] Executar `npm run seed:staging` a cada refresh do ambiente.
- [ ] Rodar `npm run test:e2e` apontando `PLAYWRIGHT_BASE_URL` para staging após cada deploy.

