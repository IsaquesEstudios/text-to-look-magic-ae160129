// i18n is imported in main.tsx before this file
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { LanguageWrapper } from "@/components/LanguageWrapper";
import Index from "./pages/Index";
import Terrenos from "./pages/Terrenos";
import Casas from "./pages/Casas";
import Sobre from "./pages/Sobre";
import Contato from "./pages/Contato";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to detected language */}
            <Route path="/" element={<LanguageWrapper />} />

            {/* Language-prefixed routes */}
            <Route path="/:lang" element={<LanguageWrapper />}>
              <Route index element={<Index />} />
              <Route path="terrenos" element={<Terrenos />} />
              <Route path="casas" element={<Casas />} />
              <Route path="sobre" element={<Sobre />} />
              <Route path="contato" element={<Contato />} />
            </Route>

            {/* Catch-all for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </I18nextProvider>
);

export default App;
