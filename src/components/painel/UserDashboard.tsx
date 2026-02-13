import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, TrendingUp, PieChart, Building2, Loader2, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function UserDashboard() {
  const { user, profile } = useAuth();

  const { data: shares, isLoading } = useQuery({
    queryKey: ["user-shares", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("*, properties(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: availableProperties } = useQuery({
    queryKey: ["available-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .gt("available_shares", 0)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const credits = profile?.credits ?? 0;
  const totalInvested = shares?.reduce((sum, s) => sum + Number(s.amount_paid), 0) ?? 0;
  const estimatedReturn = shares?.reduce((sum, s) => {
    const prop = s.properties as any;
    if (!prop) return sum;
    const returnPct = Number(prop.estimated_return_pct) / 100;
    return sum + Number(s.amount_paid) * (1 + returnPct);
  }, 0) ?? 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalShares = shares?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;
  const totalProperties = new Set(shares?.map(s => (s.properties as any)?.id).filter(Boolean)).size;

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Olá, {profile?.full_name?.split(" ")[0] || "Investidor"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumo dos seus investimentos
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Créditos</p>
            <p className="text-lg font-bold text-foreground">${credits.toLocaleString("pt-BR")}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-5">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <PieChart className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Investido</p>
            <p className="text-lg font-bold text-foreground">${totalInvested.toLocaleString("pt-BR")}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Retorno Est.</p>
            <p className="text-lg font-bold text-primary">
              ${estimatedReturn.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-5">
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Cotas</p>
            <p className="text-lg font-bold text-foreground">
              {totalShares} <span className="text-sm font-normal text-muted-foreground">em {totalProperties} imóve{totalProperties === 1 ? "l" : "is"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/painel/cotas"
          className="group flex items-center justify-between rounded-2xl border border-border/30 bg-card/40 p-5 hover:bg-card/70 hover:border-primary/20 transition-all duration-300"
        >
          <div>
            <h3 className="font-semibold text-foreground text-sm">Minhas Cotas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalShares > 0 ? `${totalShares} cotas ativas` : "Nenhuma cota ainda"}
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </Link>

        <Link
          to="/painel/oportunidades"
          className="group flex items-center justify-between rounded-2xl border border-border/30 bg-card/40 p-5 hover:bg-card/70 hover:border-primary/20 transition-all duration-300"
        >
          <div>
            <h3 className="font-semibold text-foreground text-sm">Oportunidades</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {availableProperties?.length ?? 0} imóve{(availableProperties?.length ?? 0) === 1 ? "l" : "is"} disponíve{(availableProperties?.length ?? 0) === 1 ? "l" : "is"}
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </Link>

        <Link
          to="/painel/extrato"
          className="group flex items-center justify-between rounded-2xl border border-border/30 bg-card/40 p-5 hover:bg-card/70 hover:border-primary/20 transition-all duration-300"
        >
          <div>
            <h3 className="font-semibold text-foreground text-sm">Extrato</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Histórico de movimentações</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  );
}
