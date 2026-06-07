# 🟢 Scaleaki - Plataforma Premium de Mineração e Inteligência de Ofertas

O **Scaleaki** é um ecossistema completo de SaaS (Software as a Service) focado em **Mineração de Anúncios e Engenharia Reversa de Funis** para o mercado digital (Dropshipping, Infoprodutos e PLR). 

Com uma arquitetura robusta e um design *Dark/Emerald Premium*, o Scaleaki varre a Biblioteca de Anúncios do Facebook, identifica produtos/ofertas que já estão escalados e entrega de bandeja para o assinante analisar a cópia, a página de destino, a tecnologia de checkout e os criativos validados.

---

## 🏗️ Arquitetura do Projeto

O projeto é dividido em 4 camadas principais:

1. **Frontend (SaaS/Dashboard)**
   - Construído em **Next.js (React)** com estilização em **TailwindCSS**.
   - Design System exclusivo focado na estética *Hacker/Mining* (vidro fosco, tons verdes de terminal, neon, dark mode profundo).
   - Interface de alta performance para exibição de milhares de ofertas.

2. **Backend (API e Banco de Dados)**
   - Desenvolvido em **Node.js** utilizando o framework **Express**.
   - Banco de Dados gerenciado via **Prisma ORM**.
   - Sistema de autenticação via JWT, gerenciamento de planos de assinatura e rotas de ingestão de dados de bots e extensões.

3. **Scaleaki Toolkit (Extensão do Chrome)**
   - Extensão baseada em **Manifest V3** que transforma o navegador do usuário em uma máquina de garimpo.
   - Atua de forma ativa (injetando botões e modais) e passiva (ocultando anúncios lixo na Biblioteca do Facebook).

4. **Landing / Página de Venda** (`landing/`)
   - Página de venda estática (HTML + CSS puro, zero build) com estética *Dark/Emerald Premium*.
   - Seções: hero, problema, como funciona, benefícios, comparativo, preço (mensal/trimestral/anual), prova social, FAQ e CTA.
   - Deploy independente em host estático (Vercel). Detalhes e placeholders pendentes em [`landing/README.md`](landing/README.md).

---

## 🛠️ Ferramentas e Seções Principais

### 1. Aba "Explorar" (O Coração do SaaS)
A seção de exploração é o feed principal onde os assinantes encontram as joias do mercado. 
- **Lógica de Escala:** O sistema possui um algoritmo nativo (`calcEscala`) que define se um anúncio é vencedor. A regra primária é: *Se o anúncio tem 2 ou mais duplicatas (versões) OU está rodando há 4 ou mais dias ininterruptamente, ele é considerado "Escalado".*
- **Análise de Funil:** Cada card de oferta permite abrir os detalhes e visualizar a página de destino em um *iframe* seguro, além de revelar qual plataforma o concorrente está usando (ex: Kiwify, Shopify, Yampi, etc) e a Data de Lançamento.
- **Preview de Criativos:** Visualização nativa dos vídeos e imagens dos concorrentes, salvos no banco de dados.

### 2. O Scaleaki Toolkit (Extensão do Chrome)
Uma extensão premium entregue aos clientes para eles mesmos minerarem enquanto navegam.
- **Auto-Filtro de Escalados:** Enquanto o usuário rola o Facebook Ads Library, a extensão lê silenciosamente os dados dos cards. Se o anúncio for amador ou lixo (não escalado), ela oculta o card da tela magicamente. O usuário só vê anúncios validados.
- **Botão "Analisar e Salvar":** Injetado direto no Facebook. Ao clicar, um modal elegante escurece a tela e permite que o cliente salve a oferta diretamente na sua conta Scaleaki para analisar o funil depois.
- **Downloader de Criativos Bypass:** Ferramenta nativa que burla limitações de bloqueio do Facebook (CORS), permitindo baixar o vídeo original ou a imagem do anúncio em 1 clique ("Baixar Principal", "Baixar Todos" ou escolher manualmente na grade).

### 3. Painel Administrativo (MazyOS / Admin)
Seção oculta do SaaS onde os donos do Scaleaki gerenciam a base.
- **Gestão de Usuários e Planos:** Controle de acesso dos assinantes.
- **Pipeline de Dados:** Gerencia a ingestão dos dados que vêm dos scripts autônomos (`minerador.js`).

### 4. Bot de Mineração (Web Scrapers)
Scripts autônomos (`minerador.js`, `check_ads.js`) responsáveis por varrer bibliotecas e sites de forma massiva, usando inteligência artificial e automação de navegadores para catalogar anúncios globais 24 horas por dia e alimentar a base de dados central.

---

## 💻 Stack Tecnológica
- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Framer Motion (Micro-interações), Lucide Icons.
- **Backend:** Node.js, TypeScript, Express, JWT, Bcrypt.
- **Database:** Prisma ORM, MySQL/PostgreSQL.
- **Extensão:** JavaScript Vanilla, Manifest V3, Chrome Downloads API, MutationObserver (Injeção de DOM dinâmica).

---

## 🎯 Objetivo e Visão
O Scaleaki não é apenas um "spy tool" comum. A premissa de seu desenvolvimento foi construir uma **Interface Premium e Hacker**, elevando o nível de ferramentas de espionagem do Brasil para se parecer com um terminal avançado de operações de tráfego. Ele foca na agilidade (download rápido e filtros automatizados) para que o gestor de tráfego ache a sua "oferta de 7 dígitos" no menor tempo possível.
