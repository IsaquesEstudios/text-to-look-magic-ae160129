import { useAuth } from "@/hooks/useAuth";
import { Loader2, DollarSign, Building2, MapPin, Users, TrendingUp } from "lucide-react";
import { formatCurrencySmart } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

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
          .select("id, type, status, estimated_auction_value, estimated_renovation_cost, estimated_sale_value, doc_commission_rate"),
        supabase.from("profiles").select("id"),
      ]);

      const deposits = depositsRes.data ?? [];
      const shares = sharesRes.data ?? [];
      const properties = propertiesRes.data ?? [];
      const profiles = profilesRes.data ?? [];

      // Build a map of property data for fee calculations
      const propertyMap = new Map(properties.map((p) => [p.id, p]));

      let discoveryFromShares = 0;
      let projectedRevenue = 0;
      for (const share of shares) {
        const plan = (share as any).investment_plan ?? "standard";
        const prop = propertyMap.get(share.property_id);
        if (!prop) continue;

        const normalizedType = (prop.type ?? "").toLowerCase();
        const serviceFee = normalizedType === "land" || normalizedType === "terreno" ? 500 : 5000;
        const totalProject = Number(prop.estimated_auction_value ?? 0) + Number(prop.estimated_renovation_cost ?? 0);
        const renovationCost = Number(prop.estimated_renovation_cost ?? 0);
        const saleValue = Number(prop.estimated_sale_value ?? 0);
        const docRate = Number(prop.doc_commission_rate ?? 10) / 100;

        if (totalProject > 0) {
          const proportion = Number(share.amount_paid) / totalProject;

          // Upfront fees (only Standard plan)
          if (plan === "standard") {
            discoveryFromShares += Math.round(proportion * serviceFee * 100) / 100;
            discoveryFromShares += Math.round(proportion * (renovationCost * 0.10) * 100) / 100;
          }

          // Projected profit-based revenue
          const netProfit = saleValue - totalProject - (saleValue * docRate);
          if (netProfit > 0) {
            const investorProfit = proportion * netProfit;
            let discoveryShare = 0;
            if (plan === "standard") {
              discoveryShare = investorProfit * (30 / 70);
            } else if (plan === "equal_split") {
              discoveryShare = proportion * netProfit * 0.50;
            } else if (plan === "fixed_12") {
              discoveryShare = proportion * netProfit - Number(share.amount_paid) * 0.12;
            } else if (plan === "fixed_15") {
              discoveryShare = proportion * netProfit - Number(share.amount_paid) * 0.15;
            }
            if (discoveryShare > 0) projectedRevenue += Math.round(discoveryShare * 100) / 100;
          }
        }
      }

      const discoveryFromDeposits = deposits.reduce((acc, d) => acc + Number(d.service_fee), 0);
      const totalSharesInvested = shares.reduce((acc, s) => acc + Number(s.amount_paid), 0);
      const auctionInvested = deposits.reduce((acc, d) => acc + Number(d.amount), 0);

      return {
        adminFees: discoveryFromShares + discoveryFromDeposits,
        projectedRevenue,
        totalInvested: totalSharesInvested + auctionInvested,
        casas: properties.filter(p => p.type === "house" && p.status !== "available").length,
        terrenos: properties.filter(p => p.type === "land" && p.status !== "available").length,
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
    { label: "Valor Discovery Atual", value: fmtVal(stats?.adminFees ?? 0), icon: DollarSign },
    { label: "Receita Projetada", value: fmtVal(stats?.projectedRevenue ?? 0), icon: TrendingUp },
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
