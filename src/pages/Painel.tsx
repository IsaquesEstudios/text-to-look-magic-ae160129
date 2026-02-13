import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserDashboard } from "@/components/painel/UserDashboard";
import { PainelLayout } from "@/components/painel/PainelLayout";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, PieChart, TrendingUp } from "lucide-react";

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
