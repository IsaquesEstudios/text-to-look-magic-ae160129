import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, MapPin, Home, TreePine, Loader2, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  available: { label: "Disponível", variant: "default" },
  purchased: { label: "Comprado", variant: "secondary" },
  renovating: { label: "Em Reforma", variant: "outline" },
  selling: { label: "Vendendo", variant: "secondary" },
  sold: { label: "Vendido", variant: "outline" },
};

interface Props {
  onEdit: (id: string) => void;
}

export function AdminPropertiesList({ onEdit }: Props) {
  const { data: properties, isLoading } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!properties?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Building2 className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">Nenhum imóvel cadastrado</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {properties.map((property) => {
        const status = statusLabels[property.status] || statusLabels.available;
        return (
          <Card
            key={property.id}
            className="group border-border/30 bg-card/40 overflow-hidden hover:bg-card/70 transition-all duration-300"
          >
            <div className="aspect-[16/10] relative bg-secondary/50">
              {property.cover_image_url ? (
                <img
                  src={property.cover_image_url}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {property.type === "house" ? (
                    <Home className="h-10 w-10 text-muted-foreground/20" />
                  ) : (
                    <TreePine className="h-10 w-10 text-muted-foreground/20" />
                  )}
                </div>
              )}
              <div className="absolute top-3 right-3">
                <Badge variant={status.variant} className="text-xs font-medium shadow-sm">
                  {status.label}
                </Badge>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{property.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{property.location}</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary flex-shrink-0"
                  onClick={() => onEdit(property.id)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-1">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Preço</p>
                  <p className="font-semibold text-foreground">
                    ${Number(property.purchase_price).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Retorno</p>
                  <p className="font-semibold text-primary">
                    {Number(property.estimated_return_pct)}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Cotas</p>
                  <p className="font-semibold text-foreground">
                    {property.available_shares}/{property.total_shares}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Preço/Cota</p>
                  <p className="font-semibold text-foreground">
                    ${Number(property.share_price).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              <Link
                to={`/painel/imovel/${property.id}`}
                className="block text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-1"
              >
                Ver detalhes →
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
