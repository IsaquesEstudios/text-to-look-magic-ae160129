import { Suspense, lazy } from "react";
import discoveryLogo from "@/assets/discovery-logo.png";
import type { RouteRecord } from "vite-react-ssg";
import { AdminGuard } from "@/components/painel/AdminGuard";
import { HydrationErrorBoundary } from "@/components/ErrorBoundary";
import { translations, Language } from "@/i18n";
import { fetchAllBlogSlugs } from "@/lib/blog";
import {
  DashboardSkeleton,
  AuctionsSkeleton,
  PropertiesSkeleton,
  StatementSkeleton,
  PropertyDetailSkeleton,
  PropertySubPageSkeleton,
  AdminListSkeleton,
  AuctionDetailSkeleton,
  ReceiptsSkeleton,
  ContractsSkeleton,
  ProfileSkeleton,
  GenericPanelSkeleton,
} from "@/components/painel/PanelSkeletons";
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

// Legal pages
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/legal/TermsOfUse"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const RefundPolicy = lazy(() => import("./pages/legal/RefundPolicy"));
const RiskDisclosure = lazy(() => import("./pages/legal/RiskDisclosure"));

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
const AdminRegistrosPage = lazy(() => import("./pages/painel/AdminRegistrosPage"));
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
  <div className="min-h-screen flex flex-col items-center justify-center bg-background">
    <img src={discoveryLogo} alt="Discovery" className="h-12 mb-6" />
    <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const PS = ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => (
  <Suspense fallback={fallback}>{children}</Suspense>
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
  { index: true, element: <PS fallback={<DashboardSkeleton />}><Painel /></PS> },
  { path: "meus-projetos", element: <PS fallback={<PropertiesSkeleton />}><UserPropriedadesPage /></PS> },
  { path: "extrato", element: <PS fallback={<StatementSkeleton />}><UserExtrato /></PS> },
  { path: "imovel/:id", element: <PS fallback={<PropertyDetailSkeleton />}><PropertyDetail /></PS> },
  { path: "imovel/:id/novidades", element: <PS fallback={<PropertySubPageSkeleton />}><PropertyNovidadesPage /></PS> },
  { path: "imovel/:id/gastos", element: <PS fallback={<PropertySubPageSkeleton />}><PropertyGastosPage /></PS> },
  { path: "propriedades", element: <PS fallback={<AdminListSkeleton />}><AdminGuard><AdminImoveisPage /></AdminGuard></PS> },
  
  { path: "usuarios", element: <PS fallback={<AdminListSkeleton />}><AdminGuard><AdminUsersPage /></AdminGuard></PS> },
  { path: "registros", element: <PS fallback={<AdminListSkeleton />}><AdminGuard><AdminRegistrosPage /></AdminGuard></PS> },
  { path: "usuarios/:userId", element: <PS fallback={<ProfileSkeleton />}><AdminGuard><AdminUserProfilePage /></AdminGuard></PS> },
  { path: "atividades", element: <PS fallback={<AdminListSkeleton />}><AdminGuard><AdminAtividadesPage /></AdminGuard></PS> },
  { path: "configuracoes", element: <PS fallback={<AdminListSkeleton />}><AdminGuard><AdminConfigPage /></AdminGuard></PS> },
  { path: "leiloes", element: <PS fallback={<AuctionsSkeleton />}><AdminGuard><AdminLeiloesPage /></AdminGuard></PS> },
  { path: "leiloes-user", element: <PS fallback={<AuctionsSkeleton />}><UserLeiloesPage /></PS> },
  { path: "leilao/:id", element: <PS fallback={<AuctionDetailSkeleton />}><LeilaoDetailPage /></PS> },
  { path: "comprovantes", element: <PS fallback={<ReceiptsSkeleton />}><UserComprovantesPage /></PS> },
  { path: "contratos", element: <PS fallback={<ContractsSkeleton />}><UserContratosPage /></PS> },
  { path: "informacoes", element: <PS fallback={<ProfileSkeleton />}><UserProfilePage /></PS> },
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
      ...generateLanguageRoutes("privacidade", PrivacyPolicy),
      ...generateLanguageRoutes("termos", TermsOfUse),
      ...generateLanguageRoutes("cookies", CookiePolicy),
      ...generateLanguageRoutes("reembolso", RefundPolicy),
      ...generateLanguageRoutes("aviso-de-risco", RiskDisclosure),

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
