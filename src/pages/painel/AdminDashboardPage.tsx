import { useAuth } from "@/hooks/useAuth";
import { Loader2, DollarSign, Building2, MapPin, Users, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const [depositsRes, propertiesRes, profilesRes] = await Promise.all([
        supabase.from("auction_deposits").select("id, amount, service_fee"),
        supabase.from("properties").select("id, type"),
        supabase.from("profiles").select("id"),
      ]);

      const deposits = depositsRes.data ?? [];
      const properties = propertiesRes.data ?? [];
      const profiles = profilesRes.data ?? [];

      const casas = properties.filter(p => p.type === "casa").length;
      const terrenos = properties.filter(p => p.type === "terreno").length;

      return {
        adminFees: deposits.reduce((acc, d) => acc + Number(d.service_fee), 0),
        totalInvested: deposits.reduce((acc, d) => acc + Number(d.amount), 0),
        casas,
        terrenos,
        totalUsers: profiles.length,
      };
    },
  });

  const cards = [
    { label: "Valor Discovery", value: `$ ${(stats?.adminFees ?? 0).toLocaleString("en-US")}`, icon: DollarSign },
    { label: "Imóveis em Trabalho", value: String(stats?.casas ?? 0), icon: Building2 },
    { label: "Terrenos", value: String(stats?.terrenos ?? 0), icon: MapPin },
    { label: "Usuários", value: String(stats?.totalUsers ?? 0), icon: Users },
    { label: "Total Investido", value: `$ ${(stats?.totalInvested ?? 0).toLocaleString("en-US")}`, icon: TrendingUp },
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
