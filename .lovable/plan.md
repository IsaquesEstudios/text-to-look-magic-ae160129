

# Plano: Sistema de Blog Dinâmico com Upload de Imagens

## Objetivo
Criar uma infraestrutura completa para gerenciar posts do blog dinamicamente, incluindo upload de imagens para cada artigo.

---

## Arquitetura Proposta

### Estrutura do Banco de Dados

**Tabela: `blog_posts`**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| slug | TEXT | URL amigável (único por idioma) |
| language | TEXT | Idioma (pt, en, es) |
| title | TEXT | Título do post |
| excerpt | TEXT | Resumo/descrição curta |
| content | TEXT | Conteúdo completo (HTML/Markdown) |
| category | TEXT | Categoria do post |
| image_url | TEXT | URL da imagem de capa |
| author | TEXT | Nome do autor |
| published_at | TIMESTAMP | Data de publicação |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

### Storage para Imagens

- **Bucket:** `blog-images`
- **Público:** Sim (imagens precisam ser acessíveis)
- **Estrutura:** `blog-images/{post-id}/cover.jpg`

---

## Mudanças Necessárias

### 1. Habilitar Lovable Cloud
Ativar a infraestrutura de backend gerenciada pelo Lovable para ter acesso a banco de dados e storage.

### 2. Criar Tabela e Bucket
Migração SQL para criar a tabela `blog_posts` e o bucket de imagens.

### 3. Adaptar Páginas do Blog
- **Blog.tsx:** Buscar posts do banco de dados em vez dos arquivos de tradução
- **BlogPost.tsx:** Carregar conteúdo dinâmico por slug e idioma
- **BlogPostsSection.tsx:** Buscar últimos 3 posts do banco

### 4. Adaptar SSG para Dados Dinâmicos
- **getStaticPaths:** Buscar slugs do banco de dados no momento do build
- **Loaders:** Carregar dados dos posts durante a geração estática

### 5. Criar Painel de Administração (Opcional)
Interface para criar/editar/excluir posts e fazer upload de imagens.

---

## Fluxo de Funcionamento

```text
[Build SSG]
    │
    ├── getStaticPaths busca slugs no banco de dados
    │
    ├── Para cada slug/idioma:
    │   └── Loader busca dados do post
    │       └── Gera HTML estático com conteúdo
    │
    └── Resultado: Páginas estáticas com conteúdo do banco
```

---

## Detalhes Técnicos

### Consulta de Posts por Idioma
Para listar posts na página do blog, a query filtra por idioma:
```
SELECT * FROM blog_posts 
WHERE language = 'pt' 
ORDER BY published_at DESC
```

### getStaticPaths Dinâmico
No build, buscar todos os slugs de todos os idiomas:
```
SELECT slug, language FROM blog_posts WHERE published_at IS NOT NULL
```

### Upload de Imagens
Cada imagem será armazenada no bucket com caminho único baseado no ID do post.

---

## Arquivos a Serem Modificados

| Arquivo | Mudança |
|---------|---------|
| src/pages/Blog.tsx | Usar useQuery para buscar posts do Supabase |
| src/pages/BlogPost.tsx | Carregar post por slug/idioma do banco |
| src/components/sections/BlogPostsSection.tsx | Buscar últimos posts do banco |
| src/routes.tsx | getStaticPaths busca slugs do banco no build |
| src/lib/supabase.ts | Cliente Supabase (criado automaticamente) |

### Novos Arquivos

| Arquivo | Propósito |
|---------|-----------|
| supabase/migrations/xxx_create_blog_posts.sql | Criação da tabela e bucket |
| src/lib/blog.ts | Funções para buscar/criar posts |

---

## Próximo Passo Imediato

Para começar, preciso habilitar o **Lovable Cloud** no projeto. Isso irá:
1. Criar a infraestrutura de banco de dados
2. Disponibilizar storage para imagens
3. Configurar automaticamente as variáveis de ambiente necessárias

Após aprovação, vou:
1. Habilitar Lovable Cloud
2. Criar a migração SQL para a tabela e bucket
3. Adaptar as páginas do blog para buscar dados dinâmicos
4. Atualizar o SSG para usar dados do banco

---

## Considerações sobre o SSG

Com dados dinâmicos:
- **No build:** Posts são buscados do banco e páginas são geradas
- **Novo post:** Requer novo build para aparecer na versão estática
- **Fallback SPA:** Navegação cliente-side continua funcionando com useQuery

