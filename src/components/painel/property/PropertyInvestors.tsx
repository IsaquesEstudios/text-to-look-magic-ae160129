import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ExternalLink } from "lucide-react";
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

  const investors = [...userTotals.entries()]
    .map(([userId, amount]) => ({
      userId,
      name: profileMap.get(userId) || "Usuário",
      amount,
      pct: totalProject > 0 ? (amount / totalProject) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-muted-foreground/60" />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
          Investidores ({investors.length})
        </p>
      </div>
      <div className="space-y-3">
        {investors.map((inv) => (
          <Card key={inv.userId} className="bg-card/50 border-border/50">
            <CardContent className="px-5 py-4 flex items-center justify-between gap-4">
              <Link
                to={`/painel/usuarios/${inv.userId}`}
                className="font-medium text-sm text-foreground hover:text-primary transition-colors flex items-center gap-2 group min-w-0"
              >
                <span className="truncate">{inv.name}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-foreground">
                  ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {inv.pct.toFixed(1)}% do projeto
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="flex justify-between px-1.5 pt-2 text-xs text-muted-foreground">
          <span>Total vinculado</span>
          <span className="font-semibold text-foreground">
            ${totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
