import { Suspense, lazy } from "react";
import type { RouteRecord } from "vite-react-ssg";
import { AdminGuard } from "@/components/painel/AdminGuard";
import { translations, Language } from "@/i18n";
import { fetchAllBlogSlugs } from "@/lib/blog";
import App from "./App";

// Lazy load pages
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

// Panel pages (client-only)
const Painel = lazy(() => import("./pages/Painel"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const PropertyNovidadesPage = lazy(() => import("./pages/painel/PropertyNovidadesPage"));
const PropertyGastosPage = lazy(() => import("./pages/painel/PropertyGastosPage"));
const UserImoveis = lazy(() => import("./pages/painel/UserImoveis"));
const UserExtrato = lazy(() => import("./pages/painel/UserExtrato"));
const AdminDashboardPage = lazy(() => import("./pages/painel/AdminDashboardPage"));
const AdminImoveisPage = lazy(() => import("./pages/painel/AdminImoveisPage"));
const AdminUsersPage = lazy(() => import("./pages/painel/AdminUsersPage"));
const AdminAtividadesPage = lazy(() => import("./pages/painel/AdminAtividadesPage"));
const AdminUserProfilePage = lazy(() => import("./pages/painel/AdminUserProfilePage"));
const AdminConfigPage = lazy(() => import("./pages/painel/AdminConfigPage"));
const AdminLeiloesPage = lazy(() => import("./pages/painel/AdminLeiloesPage"));
const UserLeiloesPage = lazy(() => import("./pages/painel/UserLeiloesPage"));
const LeilaoDetailPage = lazy(() => import("./pages/painel/LeilaoDetailPage"));

// PainelLayout is the persistent layout for all /painel/* routes
const PainelLayoutModule = lazy(() =>
  import("./components/painel/PainelLayout").then((m) => ({ default: m.PainelLayout }))
);

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Carregando...</div>
  </div>
);

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  if (typeof window === "undefined") return <PageLoader />;
  return <>{children}</>;
};

const languages: Language[] = ["pt", "en", "es"];

const generateLanguageRoutes = (
  path: string,
  Component: React.LazyExoticComponent<() => JSX.Element>
): RouteRecord[] =>
  languages.map((lang) => ({
    path: path ? `${lang}/${path}` : lang,
    element: <SuspenseWrapper><Component /></SuspenseWrapper>,
  }));

const generateBlogPostRoutes = (): RouteRecord[] =>
  languages.map((lang) => ({
    path: `${lang}/blog/:slug`,
    element: <SuspenseWrapper><BlogPost /></SuspenseWrapper>,
    getStaticPaths: async () => {
      try {
        const dbSlugs = await fetchAllBlogSlugs();
        const langSlugs = dbSlugs.filter((s) => s.language === lang).map((s) => `/${lang}/blog/${s.slug}`);
        if (langSlugs.length > 0) {
          const translationSlugs = translations[lang].blog.posts.map((post) => `/${lang}/blog/${post.slug}`);
          return [...new Set([...langSlugs, ...translationSlugs])];
        }
      } catch (e) {
        console.warn(`SSG: Failed to fetch blog slugs for ${lang}`, e);
      }
      return translations[lang].blog.posts.map((post) => `/${lang}/blog/${post.slug}`);
    },
  }));

// Panel child routes — rendered inside PainelLayout's <Outlet />
const panelChildren: RouteRecord[] = [
  { index: true, element: <SuspenseWrapper><Painel /></SuspenseWrapper> },
  { path: "meus-imoveis", element: <SuspenseWrapper><UserImoveis /></SuspenseWrapper> },
  { path: "extrato", element: <SuspenseWrapper><UserExtrato /></SuspenseWrapper> },
  { path: "imovel/:id", element: <SuspenseWrapper><PropertyDetail /></SuspenseWrapper> },
  { path: "imovel/:id/novidades", element: <SuspenseWrapper><PropertyNovidadesPage /></SuspenseWrapper> },
  { path: "imovel/:id/gastos", element: <SuspenseWrapper><PropertyGastosPage /></SuspenseWrapper> },
  { path: "imoveis", element: <SuspenseWrapper><AdminGuard><AdminImoveisPage /></AdminGuard></SuspenseWrapper> },
  { path: "usuarios", element: <SuspenseWrapper><AdminGuard><AdminUsersPage /></AdminGuard></SuspenseWrapper> },
  { path: "usuarios/:userId", element: <SuspenseWrapper><AdminGuard><AdminUserProfilePage /></AdminGuard></SuspenseWrapper> },
  { path: "atividades", element: <SuspenseWrapper><AdminGuard><AdminAtividadesPage /></AdminGuard></SuspenseWrapper> },
  { path: "configuracoes", element: <SuspenseWrapper><AdminGuard><AdminConfigPage /></AdminGuard></SuspenseWrapper> },
  { path: "leiloes", element: <SuspenseWrapper><AdminGuard><AdminLeiloesPage /></AdminGuard></SuspenseWrapper> },
  { path: "leiloes-user", element: <SuspenseWrapper><UserLeiloesPage /></SuspenseWrapper> },
  { path: "leilao/:id", element: <SuspenseWrapper><LeilaoDetailPage /></SuspenseWrapper> },
];

export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <SuspenseWrapper><Index /></SuspenseWrapper> },
      ...generateLanguageRoutes("", Index),
      ...generateLanguageRoutes("terrenos", Terrenos),
      ...generateLanguageRoutes("casas", Casas),
      ...generateLanguageRoutes("imoveis", Imoveis),
      ...generateLanguageRoutes("sobre", Sobre),
      ...generateLanguageRoutes("contato", Contato),
      ...generateLanguageRoutes("blog", Blog),
      ...generateBlogPostRoutes(),

      // Legacy routes
      { path: "terrenos", element: <SuspenseWrapper><Terrenos /></SuspenseWrapper> },
      { path: "casas", element: <SuspenseWrapper><Casas /></SuspenseWrapper> },
      { path: "sobre", element: <SuspenseWrapper><Sobre /></SuspenseWrapper> },
      { path: "contato", element: <SuspenseWrapper><Contato /></SuspenseWrapper> },
      { path: "blog", element: <SuspenseWrapper><Blog /></SuspenseWrapper> },

      // Auth
      { path: "auth", element: <ClientOnly><SuspenseWrapper><Auth /></SuspenseWrapper></ClientOnly> },

      // Panel — persistent layout with nested children
      {
        path: "painel",
        element: <ClientOnly><SuspenseWrapper><PainelLayoutModule /></SuspenseWrapper></ClientOnly>,
        children: panelChildren,
      },

      // 404
      { path: "*", element: <SuspenseWrapper><NotFound /></SuspenseWrapper> },
    ],
  },
];
