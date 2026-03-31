

## Detecção automática do idioma do navegador

O app passará a detectar o idioma do navegador/dispositivo do usuário e usar como idioma padrão quando não houver idioma explícito na URL.

### Como funciona hoje
- O idioma é extraído do path da URL (`/pt/`, `/en/`, `/es/`)
- Se não encontrar, usa `"pt"` como fallback fixo

### O que muda

**1. Criar função de detecção do idioma do navegador** (`src/i18n/index.ts`)
- Ler `navigator.language` ou `navigator.languages`
- Mapear para um dos idiomas suportados (`pt`, `en`, `es`): ex. `pt-BR` → `pt`, `es-AR` → `es`, `en-GB` → `en`
- Se nenhum idioma suportado for encontrado, usar `"pt"` como fallback

**2. Atualizar `defaultLanguage` e `getLanguageFromPath`** (`src/i18n/index.ts`)
- Substituir o fallback fixo `"pt"` pela função de detecção do navegador
- Quando a URL não tiver prefixo de idioma, retornar o idioma detectado do navegador

**3. Redirecionar na rota raiz** (`src/routes.tsx` ou `src/App.tsx`)
- Quando o usuário acessar `/` (sem prefixo de idioma), redirecionar para `/{idioma-detectado}/`
- Isso garante que a URL reflita o idioma correto desde o início

### Arquivos alterados
- `src/i18n/index.ts` — adicionar `detectBrowserLanguage()`, atualizar fallback
- `src/routes.tsx` — redirecionar `/` para `/{lang}/` baseado no idioma detectado

