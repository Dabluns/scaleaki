# Scaleaki — Roadmap Mestre de Features (2026-06-22)

> Decomposição das 13 features pedidas em projetos independentes. Cada grupo = ciclo próprio spec → plano → build.
> Skill base: superpowers:brainstorming (decompor antes de construir).

## Status das features pedidas

| # | Feature | Grupo | Estado |
|---|---|---|---|
| 1 | Garantir acesso + email/senha | — | ✅ FEITO (commit c8d8254) |
| 2 | Freemium da extensão Chrome | D | A construir 1º |
| 3 | Crossell esteira Geek (todos produtos) | D | A construir 1º |
| 4 | Aba Dropshipping escalado | A | scraper |
| 5 | Aba Mercado Livre escalado | A | scraper |
| 6 | Aba AliExpress promoções | A | scraper |
| 7 | Aba Shopee promoções | A | scraper |
| 8 | Aba Shein promoções | A | scraper |
| 9 | Anúncios escalados YouTube Ads | B | ad spy |
| 10 | Anúncios escalados TikTok Ads | B | ad spy |
| 11 | Análise de tráfego (SimilarWeb-like) | C | dado externo |
| 12 | Extrator de funil (URL → funil) | C | dado externo |
| 13 | "IA aprova qualquer anúncio FB" | E | ⚠️ REDESENHADO |

## Item 13 — decisão de sócio
Construir ferramenta pra burlar moderação Meta = ban garantido de BM/contas/pixel + viola política. **Não construo.**
**Substituto:** "Pré-aprovador de Criativo" — IA lê o anúncio ANTES de subir, aponta violações de política Meta, reescreve copy de risco, sinaliza claims que derrubam conta. Mantém a operação viva. Mais valioso que o pedido original.

## Ordem de execução (impacto × esforço)

### Grupo D — Monetização (PRIMEIRO — mexe direto no faturamento)
Mora no código que já existe. Semanas, não meses.
- **Freemium extensão:** free vê limitado, plano pago libera tudo. Fundação pronta: `UserPlan{free,mensal,trimestral,anual}` no Prisma.
- **Crossell esteira Geek:** ofertas dos produtos Geek dentro do app/extensão nos pontos de fricção.

### Grupo A — Scrapers de marketplace (5 abas)
Reusa engine Puppeteer R$0 (`scraper-auto.js` já roda diário, GitHub Actions). Cada marketplace = 1 scraper + 1 tabela + 1 aba. Mesmo molde da `AnuncioFacebook`/`descubraki`.
- Risco: cada site muda layout → manutenção de seletores. Mitigar com scraper resiliente + alerta quando quebra.

### Grupo B — Ad Spy (YouTube + TikTok)
2 abas estilo ad library. TikTok tem Creative Center (semi-público). YouTube via ad transparency. Reusa molde da aba de anúncios FB.

### Grupo E — Pré-aprovador de Criativo
IA (já temos stack OpenAI no projeto) lê criativo + checa contra checklist de política Meta. Output: risco + reescrita.

### Grupo C — Inteligência de tráfego (ÚLTIMO — maior risco)
"SimilarWeb-like" e "Extrator de funil" dependem de dado de terceiro (caro/limitado). NÃO é scraping trivial.
- Caminho realista: integrar API paga (ex: provedores de traffic estimation) OU MVP que extrai só o que é público (tecnologias do site via wappalyzer-like, redirects de funil seguindo a URL). Prometer paridade com SimilarWeb hoje = enganação. MVP honesto primeiro, validar demanda, depois investir em dado pago.

## Regra por grupo
Cada grupo entra no fluxo: spec dedicada → plano de implementação → build → deploy → teste. Não misturar grupos num build só.
