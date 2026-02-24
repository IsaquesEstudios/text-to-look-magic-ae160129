import { useAuth } from "@/hooks/useAuth";
import { Loader2, DollarSign, Gavel, Hammer, Wrench, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const [depositsRes, propertiesRes] = await Promise.all([
        supabase.from("auction_deposits").select("id, amount, service_fee"),
        supabase.from("properties").select("id, estimated_auction_value, estimated_renovation_cost, estimated_sale_value"),
      ]);

      const deposits = depositsRes.data ?? [];
      const properties = propertiesRes.data ?? [];

      return {
        adminFees: deposits.reduce((acc, d) => acc + Number(d.service_fee), 0),
        totalRaised: deposits.reduce((acc, d) => acc + Number(d.amount), 0),
        totalAuction: properties.reduce((acc, p) => acc + Number(p.estimated_auction_value ?? 0), 0),
        totalRenovation: properties.reduce((acc, p) => acc + Number(p.estimated_renovation_cost ?? 0), 0),
        totalSale: properties.reduce((acc, p) => acc + Number(p.estimated_sale_value ?? 0), 0),
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    { label: "Receita Discovery (Taxas)", value: `$ ${(stats?.adminFees ?? 0).toLocaleString("en-US")}`, icon: DollarSign },
    { label: "Arrecadado em Leilões", value: `$ ${(stats?.totalRaised ?? 0).toLocaleString("en-US")}`, icon: Gavel },
    { label: "Gasto com Arremates", value: `$ ${(stats?.totalAuction ?? 0).toLocaleString("en-US")}`, icon: Hammer },
    { label: "Custo de Reformas", value: `$ ${(stats?.totalRenovation ?? 0).toLocaleString("en-US")}`, icon: Wrench },
    { label: "Receita Estimada de Vendas", value: `$ ${(stats?.totalSale ?? 0).toLocaleString("en-US")}`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Card key={card.label} className="bg-card/50 border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </span>
                <card.icon className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
