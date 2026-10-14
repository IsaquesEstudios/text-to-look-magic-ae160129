import { useState } from "react";
import { AdminPropertiesList } from "@/components/painel/admin/AdminPropertiesList";
import { AdminPropertyForm } from "@/components/painel/admin/AdminPropertyForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, TrendingUp, Loader2 } from "lucide-react";
import { formatCurrencySmart } from "@/lib/utils";

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
    refetchOnMount: "always",
    staleTime: 0,
    refetchOnWindowFocus: true,
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
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {cards.map((card, i) => {
        const dark = i === 0;
        return (
          <div key={card.label} className={`rounded-lg border px-2 py-1.5 sm:px-4 sm:py-3 min-w-0 ${dark ? "bg-deep text-background border-deep" : "bg-card border-primary/40 text-foreground"}`}>
            <p className={`text-[10px] leading-tight sm:text-sm whitespace-nowrap ${dark ? "text-background/80" : "text-muted-foreground"}`}>{card.label}</p>
            <p className="text-[13px] sm:text-xl font-bold whitespace-nowrap font-heading tabular-nums">
              $ {card.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        );
      })}
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-normal">Terrenos</h1>
        <p className="text-sm text-muted-foreground mt-1">Terrenos com investidores vinculados</p>
      </div>
      <TerrenosKPIs />
      <AdminPropertiesList onEdit={handleEdit} filterType="land" />
    </div>
  );
}
