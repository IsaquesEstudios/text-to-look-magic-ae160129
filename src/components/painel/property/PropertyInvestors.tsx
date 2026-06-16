import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ExternalLink, UserPlus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LinkInvestorDialog, type ManualFees } from "@/components/painel/admin/LinkInvestorDialog";

interface Props {
  propertyId: string;
  totalProject: number;
  renovationCost: number;
  estimatedSaleValue?: number;
  docCommissionRate?: number;
  propertyType?: string;
  propertyTitle?: string;
}

function formatUSD(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PropertyInvestors({ propertyId, totalProject, renovationCost, estimatedSaleValue, docCommissionRate, propertyType, propertyTitle }: Props) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: shares } = useQuery({
    queryKey: ["property-investors", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("id, user_id, amount_paid, fee_service, fee_renovation, fee_sales")
        .eq("property_id", propertyId);
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId && isAdmin,
  });

  const userTotals = new Map<string, { total: number; shareIds: string[]; fees: number }>();
  for (const s of shares ?? []) {
    const shareFees = Number((s as any).fee_service ?? 0) + Number((s as any).fee_renovation ?? 0) + Number((s as any).fee_sales ?? 0);
    const existing = userTotals.get(s.user_id);
    if (existing) {
      existing.total += Number(s.amount_paid);
      existing.shareIds.push(s.id);
      existing.fees += shareFees;
    } else {
      userTotals.set(s.user_id, { total: Number(s.amount_paid), shareIds: [s.id], fees: shareFees });
    }
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

  const linkMutation = useMutation({
    mutationFn: async ({ userId, amount, plan }: { userId: string; amount: number; plan: InvestmentPlan }) => {
      const { error } = await supabase.rpc("admin_link_investor_to_property" as any, {
        p_property_id: propertyId,
        p_user_id: userId,
        p_amount: amount,
        p_property_type: propertyType ?? "house",
        p_property_title: propertyTitle ?? "",
        p_investment_plan: plan,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-investors", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["investors-with-credits-dialog"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["admin-portfolio-counts"] });
      toast({ title: "Investidor vinculado com sucesso!" });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Erro ao vincular", description: e.message, variant: "destructive" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_unlink_investor" as any, {
        p_property_id: propertyId,
        p_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-investors", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["admin-portfolio-counts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Vínculo removido e créditos restituídos" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (!isAdmin) return null;

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);
  const totalInvested = [...userTotals.values()].reduce((a, b) => a + b.total, 0);
  const remaining = totalProject - totalInvested;
  const isFullyCovered = remaining <= 0;

  const investors = [...userTotals.entries()]
    .map(([userId, { total, shareIds, plan }]) => ({
      userId,
      name: profileMap.get(userId) || "Usuário",
      amount: total,
      shareIds,
      plan: plan as InvestmentPlan,
      pct: totalProject > 0 ? (total / totalProject) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground/60" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
            Investidores ({investors.length})
          </p>
        </div>
        {!isFullyCovered && (
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Vincular Investidor
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {totalProject > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Vinculado: ${formatUSD(totalInvested)}</span>
            <span>Total: ${formatUSD(totalProject)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min((totalInvested / totalProject) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {investors.map((inv) => (
          <Card key={inv.userId} className="bg-card/50 border-border/50">
            <CardContent className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex flex-col gap-1">
                <Link
                  to={`/painel/usuarios/${inv.userId}`}
                  className="font-medium text-sm text-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="truncate">{inv.name}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
                <Badge variant="outline" className={`text-[10px] w-fit ${PLAN_BADGE_COLORS[inv.plan]}`}>
                  {PLAN_LABELS[inv.plan]}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-foreground">
                    ${formatUSD(inv.amount)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {inv.pct.toFixed(1)}% do projeto
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => unlinkMutation.mutate(inv.userId)}
                  disabled={unlinkMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {investors.length > 0 && (
          <div className="flex justify-between px-1.5 pt-2 text-xs text-muted-foreground">
            <span>Total vinculado</span>
            <span className="font-semibold text-foreground">
              ${formatUSD(totalInvested)}
            </span>
          </div>
        )}

        {investors.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum investidor vinculado</p>
        )}
      </div>

      <LinkInvestorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyType={propertyType ?? "house"}
        totalProject={totalProject}
        renovationCost={renovationCost}
        estimatedSaleValue={estimatedSaleValue}
        docCommissionRate={docCommissionRate}
        remaining={remaining}
        onLink={(userId, amount, plan) => linkMutation.mutate({ userId, amount, plan })}
        isPending={linkMutation.isPending}
      />
    </div>
  );
}
