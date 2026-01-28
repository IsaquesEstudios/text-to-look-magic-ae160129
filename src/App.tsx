import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Terrenos from "./pages/Terrenos";
import Casas from "./pages/Casas";
import Sobre from "./pages/Sobre";
import Contato from "./pages/Contato";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Redirect root to default language */}
          <Route path="/" element={<Navigate to="/pt" replace />} />
          
          {/* Portuguese routes */}
          <Route path="/pt" element={<Index />} />
          <Route path="/pt/terrenos" element={<Terrenos />} />
          <Route path="/pt/casas" element={<Casas />} />
          <Route path="/pt/sobre" element={<Sobre />} />
          <Route path="/pt/contato" element={<Contato />} />
          <Route path="/pt/blog" element={<Blog />} />
          <Route path="/pt/blog/:slug" element={<BlogPost />} />
          
          {/* English routes */}
          <Route path="/en" element={<Index />} />
          <Route path="/en/terrenos" element={<Terrenos />} />
          <Route path="/en/casas" element={<Casas />} />
          <Route path="/en/sobre" element={<Sobre />} />
          <Route path="/en/contato" element={<Contato />} />
          <Route path="/en/blog" element={<Blog />} />
          <Route path="/en/blog/:slug" element={<BlogPost />} />
          
          {/* Spanish routes */}
          <Route path="/es" element={<Index />} />
          <Route path="/es/terrenos" element={<Terrenos />} />
          <Route path="/es/casas" element={<Casas />} />
          <Route path="/es/sobre" element={<Sobre />} />
          <Route path="/es/contato" element={<Contato />} />
          <Route path="/es/blog" element={<Blog />} />
          <Route path="/es/blog/:slug" element={<BlogPost />} />
          
          {/* Legacy routes redirect to Portuguese */}
          <Route path="/terrenos" element={<Navigate to="/pt/terrenos" replace />} />
          <Route path="/casas" element={<Navigate to="/pt/casas" replace />} />
          <Route path="/sobre" element={<Navigate to="/pt/sobre" replace />} />
          <Route path="/contato" element={<Navigate to="/pt/contato" replace />} />
          <Route path="/blog" element={<Navigate to="/pt/blog" replace />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
