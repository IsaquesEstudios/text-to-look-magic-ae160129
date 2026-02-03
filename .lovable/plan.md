

# Plano: Corrigir Erro de SSG com localStorage

## O Problema

O erro **"ReferenceError: localStorage is not defined"** acontece durante o processo de **Static Site Generation (SSG)** no servidor da Coolify. O código está sendo executado no Node.js, onde APIs do navegador como `localStorage` não existem.

### Causa Raiz

O arquivo `src/integrations/supabase/client.ts` (gerado automaticamente) contém:

```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage, // ← ERRO: não existe no Node.js
    ...
  }
});
```

## A Solução

Como o arquivo `client.ts` é auto-gerado e não pode ser editado, vou criar um **wrapper SSR-safe** que detecta se está rodando no navegador ou no servidor.

---

## Etapas de Implementação

### 1. Criar Storage SSR-Safe

Criar um novo arquivo `src/lib/ssr-storage.ts` com uma implementação de storage que funciona tanto no navegador quanto no servidor:

```typescript
// Storage que funciona no SSR (retorna memória vazia no servidor)
const createSSRSafeStorage = () => {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  // No-op storage para SSR
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  };
};
```

### 2. Criar Cliente Supabase SSR-Safe

Criar um novo arquivo `src/lib/supabase-ssr.ts` que importa o cliente original mas oferece uma versão segura para SSR:

```typescript
import { createClient } from '@supabase/supabase-js';
import { ssrSafeStorage } from './ssr-storage';

// Cliente SSR-safe para uso em toda a aplicação
export const supabaseSSR = createClient(URL, KEY, {
  auth: {
    storage: ssrSafeStorage,
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
  }
});
```

### 3. Atualizar lib/blog.ts

Modificar para usar o cliente SSR-safe em vez do original:

```typescript
import { supabaseSSR } from './supabase-ssr';
// usar supabaseSSR em vez de supabase
```

### 4. Atualizar Páginas que Usam Supabase

Garantir que todas as páginas Blog, BlogPost e BlogPostsSection usem o cliente SSR-safe.

---

## Detalhes Técnicos

### Arquivos a Criar
1. `src/lib/ssr-storage.ts` - Storage compatível com SSR
2. `src/lib/supabase-ssr.ts` - Cliente Supabase SSR-safe

### Arquivos a Modificar
1. `src/lib/blog.ts` - Usar cliente SSR-safe
2. `src/pages/Blog.tsx` - Verificar imports
3. `src/pages/BlogPost.tsx` - Verificar imports
4. `src/components/sections/BlogPostsSection.tsx` - Verificar imports

### Como Funciona

```text
┌─────────────────────────────────────────────────────────┐
│                    BUILD TIME (SSG)                      │
│                                                          │
│  Node.js Server                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ typeof window === 'undefined' ✓                    │ │
│  │                                                    │ │
│  │ → Usa memória fake (no-op storage)                 │ │
│  │ → persistSession: false                            │ │
│  │ → autoRefreshToken: false                          │ │
│  │                                                    │ │
│  │ Resultado: Build completa sem erros!               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   RUNTIME (Browser)                      │
│                                                          │
│  Browser do Usuário                                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │ typeof window !== 'undefined' ✓                    │ │
│  │                                                    │ │
│  │ → Usa localStorage real                            │ │
│  │ → persistSession: true                             │ │
│  │ → autoRefreshToken: true                           │ │
│  │                                                    │ │
│  │ Resultado: Funciona normalmente!                   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Resultado Esperado

Após a implementação:
- O build SSG na Coolify completará com sucesso
- O site funcionará normalmente no navegador
- As funcionalidades de autenticação (se usadas) continuarão funcionando
- O blog híbrido (SSG + dados dinâmicos) funcionará como esperado

