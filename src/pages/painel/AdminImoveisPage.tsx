import { useState } from "react";
import { AdminPropertiesList } from "@/components/painel/admin/AdminPropertiesList";
import { AdminPropertyForm } from "@/components/painel/admin/AdminPropertyForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gavel, Wrench, TrendingUp, Loader2, Receipt, Building2, MapPin } from "lucide-react";

function KPICards({ filterType }: { filterType: "house" | "land" }) {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ["admin-properties-kpis", filterType],
    queryFn: async () => {
      const { data: shareRows } = await supabase.from("shares").select("property_id");
      const linkedIds = [...new Set((shareRows ?? []).map((s) => s.property_id))];
      if (linkedIds.length === 0) return { arremate: 0, reforma: 0, gastos: 0, venda: 0 };

      const { data: properties } = await supabase
        .from("properties")
        .select("estimated_auction_value, estimated_renovation_cost, estimated_sale_value")
        .in("id", linkedIds)
        .eq("type", filterType);

      const props = properties ?? [];
      return {
        arremate: props.reduce((s, p) => s + Number(p.estimated_auction_value || 0), 0),
        reforma: props.reduce((s, p) => s + Number(p.estimated_renovation_cost || 0), 0),
        gastos: props.reduce(
          (s, p) => s + Number(p.estimated_auction_value || 0) + Number(p.estimated_renovation_cost || 0),
          0
        ),
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

  const cards =
    filterType === "house"
      ? [
          { label: "Total em Arremate", value: kpis?.arremate ?? 0, icon: Gavel },
          { label: "Total em Reformas", value: kpis?.reforma ?? 0, icon: Wrench },
          { label: "Total em Gastos", value: kpis?.gastos ?? 0, icon: Receipt },
          { label: "Estimativa de Vendas", value: kpis?.venda ?? 0, icon: TrendingUp },
        ]
      : [
          { label: "Total em Arremate", value: kpis?.arremate ?? 0, icon: Gavel },
          { label: "Estimativa de Vendas", value: kpis?.venda ?? 0, icon: TrendingUp },
        ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${filterType === "house" ? "lg:grid-cols-4" : ""} gap-4`}>
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

export default function AdminImoveisPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("house");

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
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Portfólio</h1>
        <p className="text-sm text-muted-foreground mt-1">Imóveis e terrenos com investidores vinculados</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 border-0 p-1 rounded-xl h-auto">
          <TabsTrigger
            value="house"
            className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2 text-sm"
          >
            <Building2 className="h-4 w-4" />
            Imóveis
          </TabsTrigger>
          <TabsTrigger
            value="land"
            className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2 text-sm"
          >
            <MapPin className="h-4 w-4" />
            Terrenos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="house" className="mt-6 space-y-6">
          <KPICards filterType="house" />
          <AdminPropertiesList onEdit={handleEdit} filterType="house" />
        </TabsContent>

        <TabsContent value="land" className="mt-6 space-y-6">
          <KPICards filterType="land" />
          <AdminPropertiesList onEdit={handleEdit} filterType="land" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
