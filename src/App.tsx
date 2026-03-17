import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Suspense, useEffect, useState } from "react";
import { Loader2, WifiOff } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import discoveryLogo from "@/assets/discovery-logo.png";
import { AuthContext, useAuthInternal } from "@/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { InstallPWABanner } from "@/components/InstallPWABanner";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

// Optimized QueryClient for SSG
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background">
    <img src={discoveryLogo} alt="Discovery" className="h-12 mb-6" />
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

// Offline screen component
const OfflineScreen = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#141414] text-white px-8"
    style={{ paddingTop: 'env(safe-area-inset-top, 2rem)', paddingBottom: 'env(safe-area-inset-bottom, 2rem)' }}>
    <WifiOff className="h-12 w-12 mb-5 opacity-35 text-gray-400" />
    <h1 className="text-lg font-semibold mb-1">Sem conexão</h1>
    <p className="text-sm text-gray-500 text-center mb-8">Verifique sua internet e tente novamente.</p>
    <button
      onClick={onRetry}
      className="bg-primary text-white border-none px-10 py-3 rounded-xl text-sm font-semibold"
    >
      Reconectar
    </button>
  </div>
);

// Root redirect handler
const RootRedirect = () => {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const target = mounted && Capacitor.isNativePlatform() ? "/auth" : "/pt";

  useEffect(() => {
    if (mounted && location.pathname === "/") {
      window.location.replace(target);
    }
  }, [mounted, location.pathname, target]);

  if (location.pathname !== "/") {
    return null;
  }

  if (!mounted) {
    return <PageLoader />;
  }

  return <Navigate to={target} replace />;
};

const App = () => {
  const location = useLocation();
  const { isOnline, checkConnection } = useOnlineStatus();
  const auth = useAuthInternal();

  if (!isOnline) {
    return <OfflineScreen onRetry={checkConnection} />;
  }
  
  // Handle root redirect
  if (location.pathname === "/") {
    return <RootRedirect />;
  }
  
  // Handle legacy routes redirect
  const legacyRoutes = ["/terrenos", "/casas", "/sobre", "/contato", "/blog"];
  if (legacyRoutes.includes(location.pathname)) {
    return <Navigate to={`/pt${location.pathname}`} replace />;
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <div suppressHydrationWarning>
              <Outlet />
            </div>
          </Suspense>
          <CookieConsentBanner />
          <InstallPWABanner />
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
