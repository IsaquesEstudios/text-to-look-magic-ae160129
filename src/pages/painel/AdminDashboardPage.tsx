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
      const [feesRes, depositsRes, sharesRes, propertiesRes, profilesRes] = await Promise.all([
        supabase.from("credit_transactions").select("amount").ilike("description", "%Taxa de serviço%"),
        supabase.from("auction_deposits").select("amount, service_fee"),
        supabase.from("shares").select("property_id, amount_paid"),
        supabase.from("properties").select("id, type, status"),
        supabase.from("profiles").select("id"),
      ]);

      const fees = feesRes.data ?? [];
      const deposits = depositsRes.data ?? [];
      const shares = sharesRes.data ?? [];
      const properties = propertiesRes.data ?? [];
      const profiles = profilesRes.data ?? [];
      const linkedPropertyIds = new Set(shares.map((s) => s.property_id));
      const linkedProperties = properties.filter((p) => linkedPropertyIds.has(p.id));
      const activePropertyIds = new Set(
        properties
          .filter((p) => (p.status ?? "").toLowerCase() !== "sold")
          .map((p) => p.id)
      );
      const feesFromTransactions = fees.reduce((acc, f) => acc + Math.abs(Number(f.amount)), 0);
      const feesFromDeposits = deposits.reduce((acc, d) => acc + Number(d.service_fee), 0);
      const activePropertiesInvested = shares.reduce(
        (acc, s) => acc + (activePropertyIds.has(s.property_id) ? Number(s.amount_paid) : 0),
        0
      );
      const auctionInvested = deposits.reduce((acc, d) => acc + Number(d.amount), 0);

      return {
        adminFees: feesFromTransactions + feesFromDeposits,
        totalInvested: activePropertiesInvested + auctionInvested,
        casas: linkedProperties.filter(p => p.type === "house").length,
        terrenos: linkedProperties.filter(p => p.type === "land").length,
        totalUsers: profiles.length,
      };
    },
  });

  const cards = [
    { label: "Valor Discovery", value: `$ ${(stats?.adminFees ?? 0).toLocaleString("en-US")}`, icon: DollarSign },
    { label: "Imóveis Ativos", value: String(stats?.casas ?? 0), icon: Building2 },
    { label: "Terrenos Ativos", value: String(stats?.terrenos ?? 0), icon: MapPin },
    { label: "Usuários", value: String(stats?.totalUsers ?? 0), icon: Users },
    { label: "Total Investido", value: `$ ${(stats?.totalInvested ?? 0).toLocaleString("en-US")}`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
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
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
