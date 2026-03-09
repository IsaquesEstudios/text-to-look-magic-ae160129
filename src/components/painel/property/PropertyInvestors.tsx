import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Users, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  propertyId: string;
  totalProject: number;
}

export function PropertyInvestors({ propertyId, totalProject }: Props) {
  const { isAdmin } = useAuth();

  const { data: shares } = useQuery({
    queryKey: ["property-investors", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("id, user_id, amount_paid")
        .eq("property_id", propertyId);
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId && isAdmin,
  });

  const userTotals = new Map<string, number>();
  for (const s of shares ?? []) {
    userTotals.set(s.user_id, (userTotals.get(s.user_id) ?? 0) + Number(s.amount_paid));
  }

  const userIds = [...userTotals.keys()];

  const { data: profiles } = useQuery({
    queryKey: ["investor-profiles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      if (error) throw error;
      return data;
    },
    enabled: userIds.length > 0,
  });

  if (!isAdmin || !shares || shares.length === 0) return null;

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);
  const totalInvested = [...userTotals.values()].reduce((a, b) => a + b, 0);
  const coveragePct = totalProject > 0 ? Math.min((totalInvested / totalProject) * 100, 100) : 0;

  const investors = [...userTotals.entries()]
    .map(([userId, amount]) => ({
      userId,
      name: profileMap.get(userId) || "Usuário",
      amount,
      pct: totalProject > 0 ? (amount / totalProject) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const initials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Investidores</p>
            <p className="text-[10px] text-muted-foreground">{investors.length} participante{investors.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Coverage bar */}
      <div>
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>Cobertura do projeto</span>
          <span className="font-medium text-foreground">{coveragePct.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${coveragePct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>${totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          <span>${totalProject.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Investor list */}
      <div className="space-y-1.5">
        {investors.map((inv) => (
          <Link
            key={inv.userId}
            to={`/painel/usuarios/${inv.userId}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors group"
          >
            {/* Avatar */}
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">{initials(inv.name)}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {inv.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {inv.pct.toFixed(1)}% de participação
              </p>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-foreground">
                ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
