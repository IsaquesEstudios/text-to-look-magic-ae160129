import { Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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
const UserPropriedadesPage = lazy(() => import("./pages/painel/UserPropriedadesPage"));
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

const UserComprovantesPage = lazy(() => import("./pages/painel/UserComprovantesPage"));
const UserContratosPage = lazy(() => import("./pages/painel/UserContratosPage"));
const UserProfilePage = lazy(() => import("./pages/painel/UserProfilePage"));

// PainelLayout is the persistent layout for all /painel/* routes
const PainelLayoutModule = lazy(() =>
  import("./components/painel/PainelLayout").then((m) => ({ default: m.PainelLayout }))
);

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Carregando...</div>
  </div>
);

const PanelPageLoader = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-7 w-48 rounded-lg" />
      <Skeleton className="h-4 w-32 rounded-md" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
    <Skeleton className="h-40 w-full rounded-2xl" />
    <Skeleton className="h-32 w-full rounded-2xl" />
  </div>
);

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const PanelSuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PanelPageLoader />}>{children}</Suspense>
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
  { index: true, element: <PanelSuspenseWrapper><Painel /></PanelSuspenseWrapper> },
  { path: "meus-projetos", element: <PanelSuspenseWrapper><UserPropriedadesPage /></PanelSuspenseWrapper> },
  { path: "extrato", element: <PanelSuspenseWrapper><UserExtrato /></PanelSuspenseWrapper> },
  { path: "imovel/:id", element: <PanelSuspenseWrapper><PropertyDetail /></PanelSuspenseWrapper> },
  { path: "imovel/:id/novidades", element: <PanelSuspenseWrapper><PropertyNovidadesPage /></PanelSuspenseWrapper> },
  { path: "imovel/:id/gastos", element: <PanelSuspenseWrapper><PropertyGastosPage /></PanelSuspenseWrapper> },
  { path: "propriedades", element: <PanelSuspenseWrapper><AdminGuard><AdminImoveisPage /></AdminGuard></PanelSuspenseWrapper> },
  
  { path: "usuarios", element: <PanelSuspenseWrapper><AdminGuard><AdminUsersPage /></AdminGuard></PanelSuspenseWrapper> },
  { path: "usuarios/:userId", element: <PanelSuspenseWrapper><AdminGuard><AdminUserProfilePage /></AdminGuard></PanelSuspenseWrapper> },
  { path: "atividades", element: <PanelSuspenseWrapper><AdminGuard><AdminAtividadesPage /></AdminGuard></PanelSuspenseWrapper> },
  { path: "configuracoes", element: <PanelSuspenseWrapper><AdminGuard><AdminConfigPage /></AdminGuard></PanelSuspenseWrapper> },
  { path: "leiloes", element: <PanelSuspenseWrapper><AdminGuard><AdminLeiloesPage /></AdminGuard></PanelSuspenseWrapper> },
  { path: "leiloes-user", element: <PanelSuspenseWrapper><UserLeiloesPage /></PanelSuspenseWrapper> },
  { path: "leilao/:id", element: <PanelSuspenseWrapper><LeilaoDetailPage /></PanelSuspenseWrapper> },
  { path: "comprovantes", element: <PanelSuspenseWrapper><UserComprovantesPage /></PanelSuspenseWrapper> },
  { path: "contratos", element: <PanelSuspenseWrapper><UserContratosPage /></PanelSuspenseWrapper> },
  { path: "informacoes", element: <PanelSuspenseWrapper><UserProfilePage /></PanelSuspenseWrapper> },
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
