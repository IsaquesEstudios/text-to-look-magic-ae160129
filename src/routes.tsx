import { lazy, Suspense } from "react";
import type { RouteRecord } from "vite-react-ssg";
import { translations, Language } from "@/i18n";
import App from "./App";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Terrenos = lazy(() => import("./pages/Terrenos"));
const Casas = lazy(() => import("./pages/Casas"));
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

      // Portuguese routes
      {
        path: "pt",
        element: (
          <SuspenseWrapper>
            <Index />
          </SuspenseWrapper>
        ),
      },
      {
        path: "pt/terrenos",
        element: (
          <SuspenseWrapper>
            <Terrenos />
          </SuspenseWrapper>
        ),
      },
      {
        path: "pt/casas",
        element: (
          <SuspenseWrapper>
            <Casas />
          </SuspenseWrapper>
        ),
      },
      {
        path: "pt/sobre",
        element: (
          <SuspenseWrapper>
            <Sobre />
          </SuspenseWrapper>
        ),
      },
      {
        path: "pt/contato",
        element: (
          <SuspenseWrapper>
            <Contato />
          </SuspenseWrapper>
        ),
      },
      {
        path: "pt/blog",
        element: (
          <SuspenseWrapper>
            <Blog />
          </SuspenseWrapper>
        ),
      },
      {
        path: "pt/blog/:slug",
        element: (
          <SuspenseWrapper>
            <BlogPost />
          </SuspenseWrapper>
        ),
        getStaticPaths: () =>
          translations.pt.blog.posts.map((post) => `/pt/blog/${post.slug}`),
      },

      // English routes
      {
        path: "en",
        element: (
          <SuspenseWrapper>
            <Index />
          </SuspenseWrapper>
        ),
      },
      {
        path: "en/terrenos",
        element: (
          <SuspenseWrapper>
            <Terrenos />
          </SuspenseWrapper>
        ),
      },
      {
        path: "en/casas",
        element: (
          <SuspenseWrapper>
            <Casas />
          </SuspenseWrapper>
        ),
      },
      {
        path: "en/sobre",
        element: (
          <SuspenseWrapper>
            <Sobre />
          </SuspenseWrapper>
        ),
      },
      {
        path: "en/contato",
        element: (
          <SuspenseWrapper>
            <Contato />
          </SuspenseWrapper>
        ),
      },
      {
        path: "en/blog",
        element: (
          <SuspenseWrapper>
            <Blog />
          </SuspenseWrapper>
        ),
      },
      {
        path: "en/blog/:slug",
        element: (
          <SuspenseWrapper>
            <BlogPost />
          </SuspenseWrapper>
        ),
        getStaticPaths: () =>
          translations.en.blog.posts.map((post) => `/en/blog/${post.slug}`),
      },

      // Spanish routes
      {
        path: "es",
        element: (
          <SuspenseWrapper>
            <Index />
          </SuspenseWrapper>
        ),
      },
      {
        path: "es/terrenos",
        element: (
          <SuspenseWrapper>
            <Terrenos />
          </SuspenseWrapper>
        ),
      },
      {
        path: "es/casas",
        element: (
          <SuspenseWrapper>
            <Casas />
          </SuspenseWrapper>
        ),
      },
      {
        path: "es/sobre",
        element: (
          <SuspenseWrapper>
            <Sobre />
          </SuspenseWrapper>
        ),
      },
      {
        path: "es/contato",
        element: (
          <SuspenseWrapper>
            <Contato />
          </SuspenseWrapper>
        ),
      },
      {
        path: "es/blog",
        element: (
          <SuspenseWrapper>
            <Blog />
          </SuspenseWrapper>
        ),
      },
      {
        path: "es/blog/:slug",
        element: (
          <SuspenseWrapper>
            <BlogPost />
          </SuspenseWrapper>
        ),
        getStaticPaths: () =>
          translations.es.blog.posts.map((post) => `/es/blog/${post.slug}`),
      },

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
