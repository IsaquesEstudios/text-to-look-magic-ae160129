import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Building2, Gavel, Receipt, FileImage, FileText, UserCircle, LayoutDashboard, Settings, History, Shield, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePanelTranslation } from "@/hooks/usePanelTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function PanelSearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { p } = usePanelTranslation();

  const { data: properties } = useQuery({
    queryKey: ["search-properties", user?.id],
    queryFn: async () => {
      if (isAdmin) {
        const { data } = await supabase.from("properties").select("id, title, type, location");
        return data ?? [];
      }
      const { data: shares } = await supabase
        .from("shares")
        .select("property_id, properties(id, title, type, location)")
        .eq("user_id", user!.id);
      const map = new Map<string, any>();
      shares?.forEach(s => {
        const prop = s.properties as any;
        if (prop && !map.has(prop.id)) map.set(prop.id, prop);
      });
      return Array.from(map.values());
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const pages = useMemo(() => {
    const base = isAdmin
      ? [
          { label: "Dashboard", icon: LayoutDashboard, path: "/painel" },
          { label: p.auctions, icon: Gavel, path: "/painel/leiloes" },
          { label: p.properties, icon: Building2, path: "/painel/propriedades" },
          { label: p.users, icon: Shield, path: "/painel/usuarios" },
          { label: p.activities, icon: History, path: "/painel/atividades" },
          { label: p.settings, icon: Settings, path: "/painel/configuracoes" },
        ]
      : [
          { label: "Dashboard", icon: LayoutDashboard, path: "/painel" },
          { label: p.auctions, icon: Gavel, path: "/painel/leiloes-user" },
          { label: p.myProjects, icon: Building2, path: "/painel/meus-projetos" },
          { label: p.statement, icon: Receipt, path: "/painel/extrato" },
          { label: p.receipts, icon: FileImage, path: "/painel/comprovantes" },
          { label: "Contratos", icon: FileText, path: "/painel/contratos" },
          { label: p.profile, icon: UserCircle, path: "/painel/informacoes" },
        ];
    return base;
  }, [isAdmin, p]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matched: { label: string; sublabel?: string; icon: any; path: string; type: "page" | "property" }[] = [];

    pages.forEach(pg => {
      if (pg.label.toLowerCase().includes(q)) {
        matched.push({ label: pg.label, icon: pg.icon, path: pg.path, type: "page" });
      }
    });

    properties?.forEach(prop => {
      if (prop.title.toLowerCase().includes(q) || prop.location?.toLowerCase().includes(q)) {
        matched.push({
          label: prop.title,
          sublabel: prop.location,
          icon: Building2,
          path: isAdmin ? `/painel/propriedades` : `/painel/imovel/${prop.id}/novidades`,
          type: "property",
        });
      }
    });

    return matched.slice(0, 8);
  }, [query, pages, properties, isAdmin]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query && setOpen(true)}
          placeholder="Buscar imóveis, páginas..."
          className="w-full h-9 pl-9 pr-8 rounded-xl border border-border/30 bg-secondary/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} className="absolute right-2.5 text-muted-foreground/50 hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border/30 rounded-xl shadow-xl overflow-hidden z-50 max-h-[320px] overflow-y-auto">
          {results.map((item, i) => (
            <button
              key={`${item.path}-${i}`}
              onClick={() => handleSelect(item.path)}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                {item.sublabel && <p className="text-[11px] text-muted-foreground truncate">{item.sublabel}</p>}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 flex-shrink-0">
                {item.type === "page" ? "Página" : "Imóvel"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
