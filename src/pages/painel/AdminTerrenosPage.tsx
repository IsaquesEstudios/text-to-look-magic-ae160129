import { useState } from "react";
import { AdminPropertiesList } from "@/components/painel/admin/AdminPropertiesList";
import { AdminPropertyForm } from "@/components/painel/admin/AdminPropertyForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, TrendingUp, Loader2 } from "lucide-react";

function TerrenosKPIs() {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ["admin-terrenos-kpis"],
    queryFn: async () => {
      const { data: shareRows } = await supabase.from("shares").select("property_id");
      const linkedIds = [...new Set((shareRows ?? []).map((s) => s.property_id))];
      if (linkedIds.length === 0) return { arremate: 0, venda: 0 };

      const { data: properties } = await supabase
        .from("properties")
        .select("estimated_auction_value, estimated_sale_value")
        .in("id", linkedIds)
        .eq("type", "land");

      const props = properties ?? [];
      return {
        arremate: props.reduce((s, p) => s + Number(p.estimated_auction_value || 0), 0),
        venda: props.reduce((s, p) => s + Number(p.estimated_sale_value || 0), 0),
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    { label: "Total em Arremate", value: kpis?.arremate ?? 0, icon: Gavel },
    { label: "Estimativa de Vendas", value: kpis?.venda ?? 0, icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="bg-card/50 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.label}
              </span>
              <card.icon className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              $ {card.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminTerrenosPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingPropertyId(id);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPropertyId(null);
  };

  if (showForm) {
    return <AdminPropertyForm propertyId={editingPropertyId} onClose={handleFormClose} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Terrenos</h1>
        <p className="text-sm text-muted-foreground mt-1">Terrenos com investidores vinculados</p>
      </div>
      <TerrenosKPIs />
      <AdminPropertiesList onEdit={handleEdit} filterType="land" />
    </div>
  );
}
