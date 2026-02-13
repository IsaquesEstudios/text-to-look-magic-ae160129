import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserDashboard } from "@/components/painel/UserDashboard";
import { PainelLayout } from "@/components/painel/PainelLayout";
import { Loader2, Building2, Users, PieChart, TrendingUp, UserPlus, ShoppingCart, Clock } from "lucide-react";
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
    queryFn: async () => {
      const [propertiesRes, profilesRes, sharesRes] = await Promise.all([
        supabase.from("properties").select("id, status, purchase_price, total_shares, available_shares"),
        supabase.from("profiles").select("id"),
        supabase.from("shares").select("id, quantity, amount_paid"),
      ]);
      const properties = propertiesRes.data ?? [];
      const profiles = profilesRes.data ?? [];
      const shares = sharesRes.data ?? [];
      return {
        totalProperties: properties.length,
        totalUsers: profiles.length,
        totalSharesSold: shares.reduce((acc, s) => acc + s.quantity, 0),
        totalRevenue: shares.reduce((acc, s) => acc + Number(s.amount_paid), 0),
      };
    },
  });

  const { data: activities } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const [sharesRes, profilesRes] = await Promise.all([
        supabase
          .from("shares")
          .select("id, quantity, amount_paid, purchased_at, property_id, user_id")
          .order("purchased_at", { ascending: false })
          .limit(10),
        supabase
          .from("profiles")
          .select("id, user_id, full_name, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      // Build a name map from profiles
      const allProfiles = profilesRes.data ?? [];
      const nameMap = new Map(allProfiles.map((p) => [p.user_id, p.full_name || "Usuário"]));

      // For share user_ids not in the recent profiles, fetch their names
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
        description: `${nameMap.get(s.user_id) || "Usuário"} adquiriu uma cota — R$ ${Number(s.amount_paid).toLocaleString("pt-BR")}`,
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
        .slice(0, 15);
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
    { label: "Imóveis", value: stats?.totalProperties ?? 0, icon: Building2 },
    { label: "Usuários", value: stats?.totalUsers ?? 0, icon: Users },
    { label: "Cotas Vendidas", value: stats?.totalSharesSold ?? 0, icon: PieChart },
    {
      label: "Receita Total",
      value: `R$ ${(stats?.totalRevenue ?? 0).toLocaleString("pt-BR")}`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do sistema</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="max-h-[350px] overflow-y-auto">
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
    </div>
  );
}

export default function Painel() {
  const { user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <PainelLayout>
      {isAdmin ? <AdminDashboardContent /> : <UserDashboard />}
    </PainelLayout>
  );
}
