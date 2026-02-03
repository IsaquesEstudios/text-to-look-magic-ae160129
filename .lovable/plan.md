

# Plano de Implementação: Static Site Generation (SSG) com vite-react-ssg

## Objetivo
Implementar SSG para pré-renderizar todas as páginas do site em HTML estático no momento do build, garantindo melhor SEO e indexação pelo Google para os três idiomas (PT, EN, ES).

---

## Visão Geral da Mudança

O site atualmente renderiza tudo no cliente (CSR). Com SSG, cada página será pré-renderizada como HTML estático durante o build, incluindo:

- **18 páginas estáticas** (6 páginas × 3 idiomas)
- **9 páginas dinâmicas de blog** (3 posts × 3 idiomas)
- **Total: 27 páginas HTML estáticas**

---

## Etapas de Implementação

### 1. Instalar Dependências
Adicionar `vite-react-ssg` ao projeto para habilitar a geração estática.

### 2. Configurar vite.config.ts
Adicionar as opções de SSG:
- `script: "defer"` - Evita race condition do manifest
- `formatting: "minify"` - Minifica o HTML gerado
- `dirStyle: "directory"` - Gera pastas com index.html
- `ssr.noExternal` - Inclui dependências necessárias

### 3. Refatorar src/main.tsx
- Substituir `createRoot()` por `ViteReactSSG()`
- Exportar rotas como `RouteRecord[]`
- Configurar QueryClient para SSG com cache otimizado

### 4. Reestruturar src/App.tsx
- Separar o componente App da lógica de rotas
- Criar array de rotas compatível com vite-react-ssg
- Implementar `getStaticPaths` para rotas dinâmicas do blog

### 5. Atualizar package.json
- Alterar script de build para: `"build": "vite-react-ssg build"`

### 6. Adaptar Hook useTranslation
- Criar versão que funciona tanto no SSR quanto no cliente
- Usar `useLoaderData` para dados de idioma quando disponível

### 7. Configurar SEO com Head
- Substituir qualquer uso de react-helmet por `import { Head } from "vite-react-ssg"`
- Adicionar meta tags dinâmicas por página e idioma

### 8. Atualizar vercel.json para Fallback
- Manter regra de rewrite para navegação SPA pós-hidratação

---

## Detalhes Técnicos

### Estrutura de Rotas para SSG

```text
Rotas Estáticas (geradas automaticamente):
├── /pt                    -> dist/pt/index.html
├── /pt/terrenos           -> dist/pt/terrenos/index.html
├── /pt/casas              -> dist/pt/casas/index.html
├── /pt/sobre              -> dist/pt/sobre/index.html
├── /pt/contato            -> dist/pt/contato/index.html
├── /pt/blog               -> dist/pt/blog/index.html
├── /en                    -> dist/en/index.html
├── /en/terrenos           -> dist/en/terrenos/index.html
... (mesma estrutura para EN e ES)

Rotas Dinâmicas (requerem getStaticPaths):
├── /pt/blog/:slug         -> getStaticPaths retorna slugs de posts PT
├── /en/blog/:slug         -> getStaticPaths retorna slugs de posts EN
├── /es/blog/:slug         -> getStaticPaths retorna slugs de posts ES
```

### Implementação de getStaticPaths

Para cada rota dinâmica de blog, será necessário:
1. Buscar todos os slugs disponíveis no idioma
2. Retornar array de paths para pré-renderização

### QueryClient Otimizado para SSG

Configuração necessária:
- `staleTime: 5 minutos` - Evita refetch desnecessário
- `refetchOnMount: false` - Usa dados pré-carregados
- `refetchOnWindowFocus: false` - Previne requisições extras

### Arquivos que Serão Modificados

| Arquivo | Mudança |
|---------|---------|
| package.json | Adicionar dependência e alterar script build |
| vite.config.ts | Adicionar ssgOptions e ssr config |
| src/main.tsx | Usar ViteReactSSG com rotas |
| src/App.tsx | Reestruturar para exportar rotas |
| src/hooks/useTranslation.ts | Adaptar para SSR |
| vercel.json | Manter configuração de rewrite |

### Novos Arquivos

| Arquivo | Propósito |
|---------|-----------|
| src/routes.tsx | Definição central de rotas para SSG |

---

## Resultado Esperado

Após a implementação:
1. Build gerará pasta `dist/` com HTML estático para cada página
2. Google poderá indexar todo o conteúdo sem JavaScript
3. Navegação continua funcionando como SPA após hidratação
4. Cada idioma terá URLs próprias com conteúdo pré-renderizado

---

## Considerações para Deploy na Vercel

O `vercel.json` atual já está configurado corretamente para SPAs. Com SSG, a Vercel servirá automaticamente os arquivos estáticos gerados, e o rewrite serve como fallback para navegação dinâmica.

