import { useAuth } from "@/hooks/useAuth";
import { Loader2, DollarSign, Building2, MapPin, Users, TrendingUp } from "lucide-react";
import { formatCurrencySmart } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useDocCommissionRate } from "@/hooks/useDocCommissionRate";
export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const [depositsRes, sharesRes, propertiesRes, profilesRes] = await Promise.all([
        supabase.from("auction_deposits").select("amount, service_fee"),
        supabase.from("shares").select("property_id, amount_paid, investment_plan"),
        supabase
          .from("properties")
          .select("id, type, status, estimated_auction_value, estimated_renovation_cost"),
        supabase.from("profiles").select("id"),
      ]);

      const deposits = depositsRes.data ?? [];
      const shares = sharesRes.data ?? [];
      const properties = propertiesRes.data ?? [];
      const profiles = profilesRes.data ?? [];

      // Build a map of property data for fee calculations
      const propertyMap = new Map(properties.map((p) => [p.id, p]));

      // Calculate Discovery revenue from shares based on each share's plan
      let discoveryFromShares = 0;
      for (const share of shares) {
        const plan = (share as any).investment_plan ?? "standard";
        if (plan !== "standard") continue; // Only standard plan generates fees

        const prop = propertyMap.get(share.property_id);
        if (!prop) continue;

        const normalizedType = (prop.type ?? "").toLowerCase();
        const serviceFee = normalizedType === "land" || normalizedType === "terreno" ? 500 : 5000;
        const totalProject = Number(prop.estimated_auction_value ?? 0) + Number(prop.estimated_renovation_cost ?? 0);
        const renovationCost = Number(prop.estimated_renovation_cost ?? 0);

        if (totalProject > 0) {
          const proportion = Number(share.amount_paid) / totalProject;
          // Arremate fee (proportional)
          discoveryFromShares += Math.round(proportion * serviceFee * 100) / 100;
          // Renovation fee 10% (proportional)
          discoveryFromShares += Math.round(proportion * (renovationCost * 0.10) * 100) / 100;
        }
      }

      const discoveryFromDeposits = deposits.reduce((acc, d) => acc + Number(d.service_fee), 0);
      const linkedPropertyIds = new Set(shares.map((s) => s.property_id));
      const linkedProperties = properties.filter((p) => linkedPropertyIds.has(p.id));
      const totalPropertiesInvested = properties.reduce(
        (acc, p) => acc + Number(p.estimated_auction_value ?? 0) + Number(p.estimated_renovation_cost ?? 0),
        0
      );
      const auctionInvested = deposits.reduce((acc, d) => acc + Number(d.amount), 0);

      return {
        adminFees: discoveryFromShares + discoveryFromDeposits,
        totalInvested: totalPropertiesInvested + auctionInvested,
        casas: linkedProperties.filter(p => p.type === "house").length,
        terrenos: linkedProperties.filter(p => p.type === "land").length,
        totalUsers: profiles.length,
      };
    },
  });

  const fmtVal = (v: number) => {
    const { compact, full } = formatCurrencySmart(v);
    return compact !== full
      ? <><span className="sm:hidden">{compact}</span><span className="hidden sm:inline">{full}</span></>
      : full;
  };

  const cards = [
    { label: "Valor Discovery", value: fmtVal(stats?.adminFees ?? 0), icon: DollarSign },
    { label: "Imóveis Ativos", value: String(stats?.casas ?? 0), icon: Building2 },
    { label: "Terrenos Ativos", value: String(stats?.terrenos ?? 0), icon: MapPin },
    { label: "Usuários", value: String(stats?.totalUsers ?? 0), icon: Users },
    { label: "Total Investido", value: fmtVal(stats?.totalInvested ?? 0), icon: TrendingUp },
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
