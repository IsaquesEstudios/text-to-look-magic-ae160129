import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, MapPin, Home, TreePine, Loader2, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const statusLabels: Record<string, { label: string; color: string }> = {
  available: { label: "Disponível", color: "bg-primary/20 text-primary" },
  purchased: { label: "Comprado", color: "bg-blue-500/20 text-blue-400" },
  renovating: { label: "Em Reforma", color: "bg-yellow-500/20 text-yellow-400" },
  selling: { label: "Vendendo", color: "bg-purple-500/20 text-purple-400" },
  sold: { label: "Vendido", color: "bg-muted text-muted-foreground" },
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
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!properties?.length) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mb-4 opacity-50" />
          <p>Nenhum imóvel cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => {
        const status = statusLabels[property.status] || statusLabels.available;
        return (
          <Card
            key={property.id}
            className="bg-card/50 border-border/50 overflow-hidden hover:border-primary/30 transition-colors"
          >
            <div className="aspect-video relative bg-muted">
              {property.cover_image_url ? (
                <img
                  src={property.cover_image_url}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {property.type === "house" ? (
                    <Home className="h-12 w-12 text-muted-foreground/30" />
                  ) : (
                    <TreePine className="h-12 w-12 text-muted-foreground/30" />
                  )}
                </div>
              )}
              <Badge className={`absolute top-2 right-2 ${status.color} border-0`}>
                {status.label}
              </Badge>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{property.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {property.location}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onEdit(property.id)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Preço</p>
                  <p className="font-medium text-foreground">
                    ${Number(property.purchase_price).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Retorno Est.</p>
                  <p className="font-medium text-primary">
                    {Number(property.estimated_return_pct)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cotas</p>
                  <p className="font-medium text-foreground">
                    {property.available_shares}/{property.total_shares}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Preço/Cota</p>
                  <p className="font-medium text-foreground">
                    ${Number(property.share_price).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              <Link
                to={`/painel/imovel/${property.id}`}
                className="block text-center text-sm text-primary hover:underline mt-2"
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

