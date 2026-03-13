import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Suspense, useEffect, useState } from "react";
import { Loader2, WifiOff } from "lucide-react";
import discoveryLogo from "@/assets/discovery-logo.png";
import { AuthContext, useAuthInternal } from "@/hooks/useAuth";

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
    <img src={discoveryLogo} alt="Discovery" className="h-10 mb-10 opacity-90" />
    <WifiOff className="h-12 w-12 mb-5 opacity-35 text-gray-400" />
    <h1 className="text-lg font-semibold mb-1">Sem conexão</h1>
    <p className="text-sm text-gray-500 text-center mb-8">Verifique sua internet e tente novamente.</p>
    <button
      onClick={onRetry}
      className="bg-primary text-white border-none px-10 py-3 rounded-xl text-sm font-semibold"
    >
      Reconectar
    </button>
    <p className="text-xs text-gray-600 mt-4">O app será reconectado automaticamente quando a internet voltar.</p>
  </div>
);

// Root redirect handler
const RootRedirect = () => {
  const location = useLocation();
  
  useEffect(() => {
    if (location.pathname === "/") {
      window.location.replace("/pt");
    }
  }, [location.pathname]);
  
  if (location.pathname === "/") {
    return <Navigate to="/pt" replace />;
  }
  
  return null;
};

const App = () => {
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => { setIsOffline(false); window.location.reload(); };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);

  if (isOffline) {
    return <OfflineScreen onRetry={() => window.location.reload()} />;
  }

  const auth = useAuthInternal();
  
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
            <Outlet />
          </Suspense>
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
