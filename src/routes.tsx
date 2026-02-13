import { ComponentType, Suspense, lazy } from "react";
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
const Auth = lazy(() => import("./pages/Auth"));
const Painel = lazy(() => import("./pages/Painel"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const UserCotas = lazy(() => import("./pages/painel/UserCotas"));
const UserOportunidades = lazy(() => import("./pages/painel/UserOportunidades"));
const UserExtrato = lazy(() => import("./pages/painel/UserExtrato"));

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

// Client-only wrapper - renders nothing during SSG build, renders normally on client
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  if (typeof window === "undefined") {
    return <PageLoader />;
  }
  return <>{children}</>;
};

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
const generateBlogPostRoutes = (): RouteRecord[] => {
  return languages.map((lang) => ({
    path: `${lang}/blog/:slug`,
    element: (
      <SuspenseWrapper>
        <BlogPost />
      </SuspenseWrapper>
    ),
    getStaticPaths: async () => {
      try {
        const dbSlugs = await fetchAllBlogSlugs();
        const langSlugs = dbSlugs
          .filter((s) => s.language === lang)
          .map((s) => `/${lang}/blog/${s.slug}`);

        if (langSlugs.length > 0) {
          const translationSlugs = translations[lang].blog.posts.map(
            (post) => `/${lang}/blog/${post.slug}`
          );
          const allSlugs = [...new Set([...langSlugs, ...translationSlugs])];
          return allSlugs;
        }
      } catch (e) {
        console.warn(`SSG: Failed to fetch blog slugs from DB for ${lang}, using translations`, e);
      }
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

      // Auth & Dashboard - Client-only (no SSG)
      {
        path: "auth",
        element: (
          <ClientOnly>
            <SuspenseWrapper><Auth /></SuspenseWrapper>
          </ClientOnly>
        ),
      },
      {
        path: "painel",
        element: (
          <ClientOnly>
            <SuspenseWrapper><Painel /></SuspenseWrapper>
          </ClientOnly>
        ),
      },
      {
        path: "painel/cotas",
        element: (
          <ClientOnly>
            <SuspenseWrapper><UserCotas /></SuspenseWrapper>
          </ClientOnly>
        ),
      },
      {
        path: "painel/oportunidades",
        element: (
          <ClientOnly>
            <SuspenseWrapper><UserOportunidades /></SuspenseWrapper>
          </ClientOnly>
        ),
      },
      {
        path: "painel/extrato",
        element: (
          <ClientOnly>
            <SuspenseWrapper><UserExtrato /></SuspenseWrapper>
          </ClientOnly>
        ),
      },
      {
        path: "painel/imovel/:id",
        element: (
          <ClientOnly>
            <SuspenseWrapper><PropertyDetail /></SuspenseWrapper>
          </ClientOnly>
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
