import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Suspense, useEffect } from "react";
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
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Carregando...</div>
  </div>
);

// Root redirect handler
const RootRedirect = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Only redirect on client-side for the root path
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
