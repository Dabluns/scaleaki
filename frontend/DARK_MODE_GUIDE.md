# 🌓 Guia de Modo Escuro - SaaS Ofertas

> **Guia prático para desenvolvedores** sobre como usar o sistema de dark mode implementado.

---

## 📋 Índice

1. [Tokens Semânticos](#tokens-semânticos)
2. [Como Usar](#como-usar)
3. [Componentes Migrados](#componentes-migrados)
4. [Padrões e Boas Práticas](#padrões-e-boas-práticas)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Troubleshooting](#troubleshooting)

---

## 🎨 Tokens Semânticos

### Background

| Token | Uso | Light | Dark |
|-------|-----|-------|------|
| `bg-background` | Fundo da página | `#ffffff` | `#0a0a0a` |
| `bg-surface` | Cards, painéis | `#ffffff` | `#171717` |
| `bg-surface-hover` | Hover em superfícies | `#f9fafb` | `#262626` |
| `bg-surface-secondary` | Backgrounds alternativos | `#f3f4f6` | `#1f1f1f` |

### Texto

| Token | Uso | Light | Dark |
|-------|-----|-------|------|
| `text-text-primary` | Texto principal | `#111827` | `#fafafa` |
| `text-text-secondary` | Texto secundário | `#6b7280` | `#a3a3a3` |
| `text-text-tertiary` | Texto terciário/placeholders | `#9ca3af` | `#737373` |
| `text-text-inverse` | Texto invertido | `#ffffff` | `#0a0a0a` |

### Bordas

| Token | Uso | Light | Dark |
|-------|-----|-------|------|
| `border-border` | Bordas padrão | `#e5e7eb` | `#404040` |
| `border-border-hover` | Bordas em hover | `#d1d5db` | `#525252` |

### Cores de Status

| Token | Uso | Light | Dark |
|-------|-----|-------|------|
| `text-success` / `bg-success` | Sucesso | `#22c55e` | `#4ade80` |
| `text-warning` / `bg-warning` | Avisos | `#eab308` | `#fbbf24` |
| `text-error` / `bg-error` | Erros | `#ef4444` | `#f87171` |
| `text-info` / `bg-info` | Informações | `#3b82f6` | `#60a5fa` |

### Accent (Cor Primária)

| Token | Uso | Light | Dark |
|-------|-----|-------|------|
| `text-accent` / `bg-accent` | Ações primárias | `#10b981` | `#22c55e` |
| `bg-accent-hover` | Hover em accent | `#059669` | `#16a34a` |
| `bg-accent-light` | Accent suave | `#d1fae5` | `#14532d` |

---

## 🚀 Como Usar

### 1. Mudar Tema Programaticamente

```tsx
import { useTheme } from 'next-themes';

function MeuComponente() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme('dark')}>
      Tema Escuro
    </button>
  );
}
```

### 2. Usar Tokens em Componentes

#### ❌ EVITAR (cores hardcoded):
```tsx
<div className="bg-white text-gray-900 border-gray-200">
  <h1 className="text-black">Título</h1>
  <p className="text-gray-600">Descrição</p>
</div>
```

#### ✅ USAR (tokens semânticos):
```tsx
<div className="bg-surface text-text-primary border-border">
  <h1 className="text-text-primary">Título</h1>
  <p className="text-text-secondary">Descrição</p>
</div>
```

### 3. Badges Semânticos

Use o padrão de transparência para badges:

```tsx
// ✅ Padrão correto
<Badge className="bg-success/20 text-success border border-success/30">
  Ativo
</Badge>

<Badge className="bg-warning/20 text-warning border border-warning/30">
  Pendente
</Badge>

<Badge className="bg-error/20 text-error border border-error/30">
  Erro
</Badge>
```

### 4. Gradientes Dark-Mode Ready

```tsx
// ✅ Com variante dark
<div className="bg-gradient-to-r from-surface-secondary to-surface-hover 
                dark:from-gray-800 dark:to-gray-700">
  Conteúdo
</div>

// ✅ Overlay semântico
<div className="bg-gradient-to-br from-accent/20 to-info/20">
  Overlay
</div>
```

---

## 📦 Componentes Migrados

### ✅ Componentes UI Base
- [x] `Card.tsx` - Cards e painéis
- [x] `Button.tsx` - Botões (todos os variants)
- [x] `Badge.tsx` - Badges semânticos
- [x] `Input.tsx` - Inputs de formulário
- [x] `LoadingSpinner.tsx` - Spinner de loading
- [x] `Toast.tsx` - Notificações toast
- [x] `Modal.tsx` - Modais

### ✅ Layout
- [x] `Sidebar.tsx` - Barra lateral de navegação
- [x] `SettingsLayout.tsx` - Layout de configurações

### ✅ Features - Dashboard
- [x] `MetricasUsuario.tsx` - Métricas do usuário
- [x] `OfertasDestaque.tsx` - Ofertas em destaque
- [x] `AcoesRapidas.tsx` - Ações rápidas
- [x] `NichosPopulares.tsx` - Nichos populares

### ✅ Features - Ofertas
- [x] `OfertasList.tsx` - Lista de ofertas
- [x] `MetricasCard.tsx` - Card de métricas

### ✅ Pages
- [x] `page.tsx` (Dashboard) - Página principal
- [x] `layout.tsx` (Root) - Layout raiz com ThemeProvider

---

## 📐 Padrões e Boas Práticas

### 1. Sempre Use Tokens Semânticos

```tsx
// ❌ NÃO FAÇA
className="bg-white text-gray-900"

// ✅ FAÇA
className="bg-surface text-text-primary"
```

### 2. Adicione Transições

```tsx
// ✅ Transições suaves entre temas
className="bg-surface transition-colors duration-200"
```

### 3. Teste em Ambos os Modos

Antes de fazer commit, verifique:
- [ ] Componente visível em light mode
- [ ] Componente visível em dark mode
- [ ] Transição suave entre modos
- [ ] Contraste adequado (WCAG AA)

### 4. Estados Interativos

```tsx
// ✅ Hover, focus e active states
className="bg-surface hover:bg-surface-hover 
           focus:ring-accent transition-colors"
```

### 5. Badges e Indicadores

```tsx
// ✅ Use o padrão de transparência
bg-{color}/20 text-{color} border border-{color}/30
```

---

## 💡 Exemplos Práticos

### Card Completo

```tsx
<Card className="p-6">
  <h2 className="text-xl font-semibold text-text-primary mb-4">
    Título do Card
  </h2>
  <p className="text-text-secondary mb-4">
    Descrição do conteúdo
  </p>
  <div className="flex gap-2">
    <Badge className="bg-success/20 text-success border border-success/30">
      Ativo
    </Badge>
    <Badge className="bg-info/20 text-info border border-info/30">
      Premium
    </Badge>
  </div>
</Card>
```

### Formulário

```tsx
<form className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-text-primary mb-1">
      Nome
    </label>
    <Input 
      placeholder="Digite seu nome"
      className="w-full"
    />
  </div>
  
  <Button variant="primary" className="w-full">
    Salvar
  </Button>
</form>
```

### Lista com Estados

```tsx
<div className="space-y-2">
  {items.map(item => (
    <div 
      key={item.id}
      className="bg-surface border border-border rounded-lg p-4 
                 hover:bg-surface-hover transition-all cursor-pointer"
    >
      <h3 className="font-semibold text-text-primary">
        {item.title}
      </h3>
      <p className="text-sm text-text-secondary">
        {item.description}
      </p>
    </div>
  ))}
</div>
```

---

## 🔧 Troubleshooting

### Problema: Cores não mudam no dark mode

**Solução:** Verifique se você está usando tokens semânticos e não cores hardcoded:

```tsx
// ❌ Problema
<div className="bg-white text-gray-900">

// ✅ Solução
<div className="bg-surface text-text-primary">
```

### Problema: Flash de conteúdo ao carregar

**Solução:** O script de prevenção de FOUC já está implementado no `layout.tsx`. Certifique-se de que:
1. O `suppressHydrationWarning` está no `<html>`
2. O script inline está no `<head>`

### Problema: Componente de terceiros não adapta

**Solução:** Envolva o componente e force as cores:

```tsx
<div className="bg-surface text-text-primary [&_*]:text-text-primary">
  <ComponenteDeTerceiros />
</div>
```

### Problema: Contraste insuficiente

**Solução:** Use cores de status ou accent para maior contraste:

```tsx
// ❌ Baixo contraste
<span className="text-text-tertiary">Importante</span>

// ✅ Alto contraste
<span className="text-accent font-medium">Importante</span>
```

---

## 🎯 Checklist de Migração de Componente

Ao migrar um novo componente para dark mode:

- [ ] Substituir `bg-white` → `bg-surface`
- [ ] Substituir `bg-gray-X` → tokens apropriados
- [ ] Substituir `text-gray-X` → `text-text-X`
- [ ] Substituir `border-gray-X` → `border-border`
- [ ] Adicionar `transition-colors` onde apropriado
- [ ] Testar hover states
- [ ] Testar focus states
- [ ] Testar em light mode
- [ ] Testar em dark mode
- [ ] Verificar contraste (WCAG AA)

---

## 📚 Referências

- [Next Themes Docs](https://github.com/pacocoursey/next-themes)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [PLANO_MODO_ESCURO.md](../PLANO_MODO_ESCURO.md) - Plano completo de implementação

---

**Status:** ✅ Sistema de Dark Mode implementado e funcional  
**Última atualização:** 21/10/2025  
**Progresso:** 81% (13h de 16h)

