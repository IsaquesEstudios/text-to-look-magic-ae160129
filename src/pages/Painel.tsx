import { useAuth } from "@/hooks/useAuth";
import { UserDashboard } from "@/components/painel/UserDashboard";
import { Link } from "react-router-dom";
import { Loader2, DollarSign, Building2, MapPin, TrendingUp, Users, UserPlus, ShoppingCart, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type ActivityItem = {
  id: string;
  type: "share_purchase" | "user_registration";
  description: string;
  timestamp: string;
  icon: typeof ShoppingCart;
};

function AdminDashboardContent() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async () => {
      const [depositsRes, sharesRes, propertiesRes, profilesCountRes] = await Promise.all([
        supabase.from("auction_deposits").select("amount, service_fee"),
        supabase.from("shares").select("property_id, amount_paid, investment_plan"),
        supabase
          .from("properties")
          .select("id, type, status, estimated_auction_value, estimated_renovation_cost, estimated_sale_value, doc_commission_rate"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      const deposits = depositsRes.data ?? [];
      const shares = sharesRes.data ?? [];
      const properties = propertiesRes.data ?? [];
      const propertyMap = new Map(properties.map(p => [p.id, p]));

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
              discoveryShare = investorProfit * (30 / 70); // Discovery gets 30% of the 70/30 split
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
        totalUsers: profilesCountRes.count ?? 0,
      };
    },
  });

  const { data: activities } = useQuery({
    queryKey: ["admin-activity-recent"],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async () => {
      const [sharesRes, profilesRes] = await Promise.all([
        supabase
          .from("shares")
          .select("id, quantity, amount_paid, purchased_at, property_id, user_id")
          .order("purchased_at", { ascending: false })
          .limit(5),
        supabase
          .from("profiles")
          .select("id, user_id, full_name, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const allProfiles = profilesRes.data ?? [];
      const nameMap = new Map(allProfiles.map((p) => [p.user_id, p.full_name || "Usuário"]));

      const shareUserIds = (sharesRes.data ?? []).map((s) => s.user_id).filter((id) => !nameMap.has(id));
      if (shareUserIds.length > 0) {
        const { data: extraProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", shareUserIds);
        (extraProfiles ?? []).forEach((p) => nameMap.set(p.user_id, p.full_name || "Usuário"));
      }

      const shareActivities: ActivityItem[] = (sharesRes.data ?? []).map((s) => ({
        id: `share-${s.id}`,
        type: "share_purchase" as const,
        description: `${nameMap.get(s.user_id) || "Usuário"} vinculado a imóvel — $ ${Number(s.amount_paid).toLocaleString("en-US")}`,
        timestamp: s.purchased_at,
        icon: ShoppingCart,
      }));

      const profileActivities: ActivityItem[] = allProfiles.map((p) => ({
        id: `profile-${p.id}`,
        type: "user_registration" as const,
        description: `${p.full_name || "Novo usuário"} se registrou`,
        timestamp: p.created_at,
        icon: UserPlus,
      }));

      return [...shareActivities, ...profileActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    },
  });

  const { data: recentClients } = useQuery({
    queryKey: ["admin-recent-clients"],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, created_at, avatar_url")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    { label: "Valor Discovery Atual", value: `$ ${(stats?.adminFees ?? 0).toLocaleString("en-US")}`, icon: DollarSign },
    { label: "Valor Discovery Projetado", value: `$ ${(stats?.projectedRevenue ?? 0).toLocaleString("en-US")}`, icon: TrendingUp },
    { label: "Usuários", value: String(stats?.totalUsers ?? 0), icon: Users },
    { label: "Imóveis Ativos", value: String(stats?.casas ?? 0), icon: Building2 },
    { label: "Terrenos Ativos", value: String(stats?.terrenos ?? 0), icon: MapPin },
    { label: "Total Investido", value: `$ ${(stats?.totalInvested ?? 0).toLocaleString("en-US")}`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-4 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do sistema</p>
      </div>

      {/* Mobile: 2-col layout | Desktop: 6 cols */}
      <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-6">
        {kpis.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card/40 p-3 sm:p-5 overflow-hidden"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <card.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground truncate">{card.label}</p>
              <p className="text-sm sm:text-lg font-bold text-foreground truncate">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
              </div>
              <Link to="/painel/atividades" className="text-xs text-primary hover:underline">
                Ver tudo
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!activities || activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atividade recente</p>
            ) : (
              <div className="space-y-1">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <activity.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Últimos Clientes</CardTitle>
              </div>
              <Link to="/painel/usuarios" className="text-xs text-primary hover:underline">
                Ver todos
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!recentClients || recentClients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum cliente cadastrado</p>
            ) : (
              <div className="space-y-1">
                {recentClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                      {(client.full_name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{client.full_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(client.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Painel() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboardContent /> : <UserDashboard />;
}
