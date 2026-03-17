import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRoutes } from "react-router-dom";
import { Suspense } from "react";
import { Loader2, WifiOff } from "lucide-react";
import discoveryLogo from "@/assets/discovery-logo.png";
import { AuthContext, useAuthInternal } from "@/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { routes } from "./routes";

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
    <img src={discoveryLogo} alt="Discovery" className="h-12 mb-6" />
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const OfflineScreen = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-8"
    style={{ paddingTop: 'env(safe-area-inset-top, 2rem)', paddingBottom: 'env(safe-area-inset-bottom, 2rem)' }}>
    <WifiOff className="h-12 w-12 mb-5 opacity-35 text-muted-foreground" />
    <h1 className="text-lg font-semibold mb-1">Sem conexão</h1>
    <p className="text-sm text-muted-foreground text-center mb-8">Verifique sua internet e tente novamente.</p>
    <button
      onClick={onRetry}
      className="bg-primary text-primary-foreground border-none px-10 py-3 rounded-xl text-sm font-semibold"
    >
      Reconectar
    </button>
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
