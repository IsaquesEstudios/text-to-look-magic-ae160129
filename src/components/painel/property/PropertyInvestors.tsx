import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ExternalLink, UserPlus, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  propertyId: string;
  totalProject: number;
  propertyType?: string;
  propertyTitle?: string;
}

function formatUSD(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PropertyInvestors({ propertyId, totalProject, propertyType, propertyTitle }: Props) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLinking, setIsLinking] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [linkRawAmount, setLinkRawAmount] = useState(0);
  const [linkDisplayAmount, setLinkDisplayAmount] = useState("");

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

  const userTotals = new Map<string, { total: number; shareIds: string[] }>();
  for (const s of shares ?? []) {
    const existing = userTotals.get(s.user_id);
    if (existing) {
      existing.total += Number(s.amount_paid);
      existing.shareIds.push(s.id);
    } else {
      userTotals.set(s.user_id, { total: Number(s.amount_paid), shareIds: [s.id] });
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

  const { data: investorsWithCredits } = useQuery({
    queryKey: ["investors-with-credits-property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, credits")
        .eq("status", "approved")
        .order("full_name");
      if (error) throw error;
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminIds = new Set(adminRoles?.map((r) => r.user_id) ?? []);
      return data.filter((p) => !adminIds.has(p.user_id));
    },
    enabled: isAdmin && isLinking,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const linkMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { error } = await supabase.rpc("admin_link_investor_to_property" as any, {
        p_property_id: propertyId,
        p_user_id: userId,
        p_amount: amount,
        p_property_type: propertyType ?? "house",
        p_property_title: propertyTitle ?? "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-investors", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["investors-with-credits-property"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["admin-portfolio-counts"] });
      toast({ title: "Investidor vinculado com sucesso!" });
      setSelectedUserId("");
      setLinkRawAmount(0);
      setLinkDisplayAmount("");
      setIsLinking(false);
    },
    onError: (e: Error) => toast({ title: "Erro ao vincular", description: e.message, variant: "destructive" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (shareIds: string[]) => {
      const { error } = await supabase.from("shares").delete().in("id", shareIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-investors", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      toast({ title: "Vínculo removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (!isAdmin) return null;

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);
  const totalInvested = [...userTotals.values()].reduce((a, b) => a + b.total, 0);
  const remaining = totalProject - totalInvested;
  const isFullyCovered = remaining <= 0;

  const serviceFee = (propertyType === "land" || propertyType === "terreno") ? 500 : 5000;

  const investors = [...userTotals.entries()]
    .map(([userId, { total, shareIds }]) => ({
      userId,
      name: profileMap.get(userId) || "Usuário",
      amount: total,
      shareIds,
      pct: totalProject > 0 ? (total / totalProject) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Link form calculations
  const currentAmount = linkRawAmount / 100;
  const currentFeeShare = totalProject > 0 ? Math.min(Math.round((currentAmount / totalProject) * serviceFee * 100) / 100, serviceFee) : 0;
  const currentTotalDeduction = currentAmount + currentFeeShare;
  const selectedInvestor = investorsWithCredits?.find((inv) => inv.user_id === selectedUserId);
  const userMaxCredits = Number(selectedInvestor?.credits ?? 0);
  const maxLinkableByCredits = totalProject > 0
    ? Math.floor((userMaxCredits / (1 + serviceFee / totalProject)) * 100) / 100
    : userMaxCredits;
  const maxLinkable = maxLinkableByCredits;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground/60" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
            Investidores ({investors.length})
          </p>
        </div>
        {!isFullyCovered && !isLinking && (
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setIsLinking(true)}>
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
              <Link
                to={`/painel/usuarios/${inv.userId}`}
                className="font-medium text-sm text-foreground hover:text-primary transition-colors flex items-center gap-2 group min-w-0"
              >
                <span className="truncate">{inv.name}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
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
                  onClick={() => unlinkMutation.mutate(inv.shareIds)}
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

        {investors.length === 0 && !isLinking && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum investidor vinculado</p>
        )}
      </div>

      {/* Link form */}
      {isLinking && (
        <div className="mt-4 space-y-3 p-4 border border-border/50 rounded-xl bg-card/30">
          <p className="text-sm font-medium">Vincular Investidor</p>

          {/* Service fee info */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-muted-foreground">
              Taxa de serviço: <span className="font-semibold text-foreground">${formatUSD(serviceFee)}</span>
              {" "}({propertyType === "land" || propertyType === "terreno" ? "terreno" : "casa"})
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Investidor</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione um investidor</option>
              {(investorsWithCredits ?? []).map((inv) => (
                <option key={inv.user_id} value={inv.user_id}>
                  {inv.full_name || "Usuário"} — Saldo: ${formatUSD(Number(inv.credits))}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Valor a vincular
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0.00"
                value={linkDisplayAmount}
                onChange={(e) => {
                  const input = e.target.value.replace(/[^0-9]/g, "");
                  const cents = parseInt(input || "0", 10);
                  setLinkRawAmount(cents);
                  if (cents === 0) {
                    setLinkDisplayAmount("");
                  } else {
                    setLinkDisplayAmount((cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                  }
                }}
                className="pl-7"
              />
            </div>
          </div>

          {/* Fee breakdown */}
          {currentAmount > 0 && selectedUserId && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5 text-xs">
              <p className="font-medium text-foreground">Resumo da operação:</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investimento</span>
                <span className="font-semibold">${formatUSD(currentAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Taxa proporcional ({totalProject > 0 ? Math.min((currentAmount / totalProject) * 100, 100).toFixed(1) : 0}% de ${formatUSD(serviceFee)})
                </span>
                <span className="font-semibold text-amber-500">${formatUSD(currentFeeShare)}</span>
              </div>
              <div className="border-t border-border/50 pt-1.5 flex justify-between">
                <span className="font-medium text-foreground">Total debitado</span>
                <span className="font-bold text-foreground">${formatUSD(currentTotalDeduction)}</span>
              </div>
              {currentTotalDeduction > userMaxCredits && (
                <p className="text-destructive font-medium mt-1">
                  ⚠ Saldo insuficiente (disponível: ${formatUSD(userMaxCredits)})
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-2"
              disabled={
                !selectedUserId ||
                currentAmount <= 0 ||
                currentTotalDeduction > userMaxCredits ||
                linkMutation.isPending
              }
              onClick={() => {
                if (currentAmount <= 0) return;
                linkMutation.mutate({ userId: selectedUserId, amount: currentAmount });
              }}
            >
              <UserPlus className="h-4 w-4" />
              {linkMutation.isPending ? "Vinculando..." : "Vincular"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setIsLinking(false); setSelectedUserId(""); setLinkRawAmount(0); setLinkDisplayAmount(""); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
