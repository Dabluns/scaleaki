# Scaleaki — Landing / Página de Venda

Página de venda estática do Scaleaki. HTML + CSS puro, zero build, deploy direto no Vercel/qualquer host estático.

Origem: repo [`Geeknosnegocios/scaleaki03`](https://github.com/Geeknosnegocios/scaleaki03), integrado ao monorepo em `landing/`.

## Estrutura

```
landing/
├── index.html      # página completa single-file (~48 KB)
├── style.css       # estilos Dark/Emerald Premium (~48 KB)
├── assets/         # imagens, mockups, logos, favicon
└── .gitignore      # ignora .vercel
```

### Assets

| Arquivo | Uso |
|---|---|
| `favicon.svg` | favicon (lupa + $ emerald gradient) |
| `logo-header.png` / `scaleaki-horizontal.png` | logo do header |
| `logo-scaleaki.png` | logo vertical |
| `lupa-icon.png` | ícone lupa |
| `dashboard-mockup.png` | **mockup do painel** exibido no hero (feed de ofertas, gerado via HTML+screenshot) |
| `scaleaki-mockup.png` | logo quadrado (não é dashboard) |
| `scaleaki-verde.png` | arte verde |
| `networking.png` / `ocultos.png` | ilustrações de seções (sem uso atual) |

## Seções da página

Hero → trust bar → ticker de ofertas → problema → como funciona → benefícios → diferenciais (cloaker, monitoring, multilingual) → comparativo → economia → preço (mensal / trimestral / anual) → prova social → FAQ → CTA final.

## Planos e checkouts (Cakto — LIVE)

| Plano | id | Preço/mês | Checkout |
|---|---|---|---|
| Mensal | `cta-monthly` | R$84 | `https://pay.cakto.com.br/xh83thw_917445` |
| Trimestral | `cta-quarterly` | R$75 | `https://pay.cakto.com.br/8cbgatw` |
| Anual | `cta-annual` | R$67 | `https://pay.cakto.com.br/yhu2jvy` |
| **Desconto 15% (popup saída)** | `exitCta` | R$71 | `https://pay.cakto.com.br/t3nf6rm` |

CTAs genéricos (`cta-header`, `cta-hero-primary`, `cta-final-btn`) ancoram em `#preco`.

## Popup de saída (exit-intent)

- Dispara: mouse sai pelo topo (desktop) / scroll-up rápido perto do topo (mobile). 1× por sessão (`sessionStorage`).
- Oferta: **15% OFF** em destaque, R$84 → R$71/mês.
- Botão CTA → checkout desconto `t3nf6rm`.
- **X (fechar) → redireciona pro checkout desconto** `t3nf6rm` (não só fecha).
- "Não, prefiro pagar preço cheio" + backdrop + Esc → fecham normalmente.

## WhatsApp

- Número: `+55 21 95947-6313` em `nav-whatsapp` + `whatsapp-float`.
- Link: `https://api.whatsapp.com/send/?phone=5521959476313&text&type=phone_number&app_absent=0`

## Deploy

Host estático (Vercel recomendado — `.gitignore` já cobre `.vercel`):

```bash
cd landing
vercel --prod
```

Ou subir os 3 itens (`index.html`, `style.css`, `assets/`) em qualquer hosting estático.

## Dependência externa

Ícones via CDN Lucide: `https://unpkg.com/lucide@latest`.
