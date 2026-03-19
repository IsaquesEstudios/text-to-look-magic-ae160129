import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, MapPin, Home, TreePine, Loader2, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  available: { label: "Disponível", variant: "default" },
  auctioned: { label: "Arrematado", variant: "secondary" },
  waiting_permit: { label: "Aguardando Alvará", variant: "outline" },
  renovation_in_progress: { label: "Reforma em Andamento", variant: "outline" },
  for_sale: { label: "À Venda", variant: "default" },
  under_contract: { label: "Sob Contrato", variant: "secondary" },
  sold: { label: "Vendido", variant: "outline" },
};

interface Props {
  onEdit: (id: string) => void;
  filterType?: "house" | "land";
}

export function AdminPropertiesList({ onEdit, filterType }: Props) {
  const { data: properties, isLoading } = useQuery({
    queryKey: ["admin-properties", filterType ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select("*");
      if (filterType) {
        query = query.eq("type", filterType);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
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
        const auction = Number(property.estimated_auction_value || 0);
        const renovation = Number(property.estimated_renovation_cost || 0);
        const serviceFee = property.type === "house" ? 5000 : 500;
        const totalProject = auction + serviceFee + renovation + renovation * 0.12;
        const sale = Number(property.estimated_sale_value || 0);
        const roi = totalProject > 0 ? ((sale - totalProject) / totalProject) * 100 : 0;
        return (
          <Card
...
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-1">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Arremate</p>
...
                    ${totalProject.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Retorno</p>
                  <p className={`font-semibold ${roi > 0 ? "text-primary" : roi < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {roi.toFixed(1)}%
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
