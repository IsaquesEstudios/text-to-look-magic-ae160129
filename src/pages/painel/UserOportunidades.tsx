import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, MapPin } from "lucide-react";
import { PainelLayout } from "@/components/painel/PainelLayout";

export default function UserOportunidades() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: properties, isLoading } = useQuery({
    queryKey: ["available-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .gt("available_shares", 0)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <PainelLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </PainelLayout>
    );
  }

  if (!user) return null;

  return (
    <PainelLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Oportunidades</h1>
          <p className="text-sm text-muted-foreground mt-1">Imóveis com cotas disponíveis para investir</p>
        </div>

        {!properties?.length ? (
          <div className="rounded-2xl border border-dashed border-border/40 flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Building2 className="h-9 w-9 mb-3 opacity-25" />
            <p className="text-sm">Nenhum imóvel disponível no momento</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Link
                key={property.id}
                to={`/painel/imovel/${property.id}`}
                className="group rounded-2xl border border-border/30 bg-card/40 overflow-hidden hover:bg-card/70 hover:border-primary/20 transition-all duration-300"
              >
                <div className="aspect-[16/10] relative bg-secondary/50 overflow-hidden">
                  {property.cover_image_url ? (
                    <img
                      src={property.cover_image_url}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}
                  <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground border-0 text-[10px] font-medium shadow-sm">
                    {property.available_shares} cota{property.available_shares > 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{property.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {property.location}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Por cota</p>
                      <p className="font-bold text-foreground text-sm">
                        ${Number(property.share_price).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Retorno</p>
                      <p className="font-bold text-primary text-sm">
                        {Number(property.estimated_return_pct)}%
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PainelLayout>
  );
}
