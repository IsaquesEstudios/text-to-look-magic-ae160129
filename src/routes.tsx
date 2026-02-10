import { lazy, Suspense } from "react";
import type { RouteRecord } from "vite-react-ssg";
import { translations, Language } from "@/i18n";
import { fetchAllBlogSlugs } from "@/lib/blog";
import App from "./App";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Terrenos = lazy(() => import("./pages/Terrenos"));
const Casas = lazy(() => import("./pages/Casas"));
const Imoveis = lazy(() => import("./pages/Imoveis"));
const Sobre = lazy(() => import("./pages/Sobre"));
const Contato = lazy(() => import("./pages/Contato"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Carregando...</div>
  </div>
);

// Wrapper component to handle Suspense for lazy loaded pages
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

// Languages for iteration
const languages: Language[] = ["pt", "en", "es"];

// Helper to generate static routes for a given page
const generateLanguageRoutes = (
  path: string,
  Component: React.LazyExoticComponent<() => JSX.Element>
): RouteRecord[] => {
  return languages.map((lang) => ({
    path: path ? `${lang}/${path}` : lang,
    element: (
      <SuspenseWrapper>
        <Component />
      </SuspenseWrapper>
    ),
  }));
};

// Generate blog post routes with getStaticPaths
// Uses translation files as source of truth for SSG build
// During runtime, posts are fetched from database with fallback to translations
const generateBlogPostRoutes = (): RouteRecord[] => {
  return languages.map((lang) => ({
    path: `${lang}/blog/:slug`,
    element: (
      <SuspenseWrapper>
        <BlogPost />
      </SuspenseWrapper>
    ),
    // Fetch slugs from database during build for full SSG coverage
    // Falls back to translation files if DB is unavailable
    getStaticPaths: async () => {
      try {
        const dbSlugs = await fetchAllBlogSlugs();
        const langSlugs = dbSlugs
          .filter((s) => s.language === lang)
          .map((s) => `/${lang}/blog/${s.slug}`);

        if (langSlugs.length > 0) {
          // Merge with translation slugs to ensure all are covered
          const translationSlugs = translations[lang].blog.posts.map(
            (post) => `/${lang}/blog/${post.slug}`
          );
          const allSlugs = [...new Set([...langSlugs, ...translationSlugs])];
          return allSlugs;
        }
      } catch (e) {
        console.warn(`SSG: Failed to fetch blog slugs from DB for ${lang}, using translations`, e);
      }
      // Fallback to translation files
      return translations[lang].blog.posts.map((post) => `/${lang}/blog/${post.slug}`);
    },
  }));
};

// Define all routes with App as the layout
export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <App />,
    children: [
      // Root redirect page
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <Index />
          </SuspenseWrapper>
        ),
      },

      // Language-specific routes
      ...generateLanguageRoutes("", Index),
      ...generateLanguageRoutes("terrenos", Terrenos),
      ...generateLanguageRoutes("casas", Casas),
      ...generateLanguageRoutes("imoveis", Imoveis),
      ...generateLanguageRoutes("sobre", Sobre),
      ...generateLanguageRoutes("contato", Contato),
      ...generateLanguageRoutes("blog", Blog),

      // Blog post routes with dynamic slugs
      ...generateBlogPostRoutes(),

      // Legacy routes (will redirect client-side)
      {
        path: "terrenos",
        element: (
          <SuspenseWrapper>
            <Terrenos />
          </SuspenseWrapper>
        ),
      },
      {
        path: "casas",
        element: (
          <SuspenseWrapper>
            <Casas />
          </SuspenseWrapper>
        ),
      },
      {
        path: "sobre",
        element: (
          <SuspenseWrapper>
            <Sobre />
          </SuspenseWrapper>
        ),
      },
      {
        path: "contato",
        element: (
          <SuspenseWrapper>
            <Contato />
          </SuspenseWrapper>
        ),
      },
      {
        path: "blog",
        element: (
          <SuspenseWrapper>
            <Blog />
          </SuspenseWrapper>
        ),
      },

      // 404
      {
        path: "*",
        element: (
          <SuspenseWrapper>
            <NotFound />
          </SuspenseWrapper>
        ),
      },
    ],
  },
];
