import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRoutes } from "react-router-dom";
import { Suspense } from "react";
import { WifiOff } from "lucide-react";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { AuthContext, useAuthInternal } from "@/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { routes } from "./routes";
import { initializeDiscoveryPresentation } from "@/lib/discoveryPresentation";
import { Button } from "@/components/ui/button";

initializeDiscoveryPresentation();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background">
    <AnimatedLogo size={96} />
  </div>
);

const OfflineScreen = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-8"
    style={{ paddingTop: 'env(safe-area-inset-top, 2rem)', paddingBottom: 'env(safe-area-inset-bottom, 2rem)' }}>
    <WifiOff className="h-12 w-12 mb-5 opacity-35 text-muted-foreground" />
    <h1 className="text-lg font-semibold mb-1">Sem conexão</h1>
    <p className="text-sm text-muted-foreground text-center mb-8">Verifique sua internet e tente novamente.</p>
    <Button
      onClick={onRetry}
      className="px-10"
    >
      Reconectar
    </Button>
  </div>
);

const App = () => {
  const { isOnline, checkConnection } = useOnlineStatus();
  const auth = useAuthInternal();
  const routeElement = useRoutes(routes);

  if (!isOnline) {
    return <OfflineScreen onRetry={checkConnection} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<PageLoader />}>
            {routeElement}
          </Suspense>
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
