import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, AlertTriangle, CheckCircle } from "lucide-react";

export type InvestmentPlan = "standard" | "equal_split" | "fixed_12" | "fixed_15";

export const PLAN_LABELS: Record<InvestmentPlan, string> = {
  standard: "Padrão",
  equal_split: "50/50",
  fixed_12: "12% Fixo",
  fixed_15: "15% Fixo",
};

export const PLAN_BADGE_COLORS: Record<InvestmentPlan, string> = {
  standard: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  equal_split: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  fixed_12: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  fixed_15: "bg-purple-500/10 text-purple-600 border-purple-500/30",
};

const PLAN_DESCRIPTIONS: Record<InvestmentPlan, string> = {
  standard: "Taxa arremate + 10% reforma · Lucros 70/30",
  equal_split: "Zero taxas · Lucros 50/50",
  fixed_12: "Zero taxas · 12% fixo ao investidor",
  fixed_15: "Zero taxas · 15% fixo ao investidor",
};

function formatUSD(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyType: string;
  totalProject: number;
  renovationCost: number;
  remaining: number;
  estimatedSaleValue?: number;
  onLink: (userId: string, amount: number, plan: InvestmentPlan) => void;
  isPending: boolean;
  /** For AdminPropertyForm: pass pre-reserved credits map */
  reservedCreditsMap?: Map<string, number>;
}

export function LinkInvestorDialog({
  open,
  onOpenChange,
  propertyType,
  totalProject,
  renovationCost,
  remaining,
  onLink,
  isPending,
  reservedCreditsMap,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [plan, setPlan] = useState<InvestmentPlan>("standard");
  const [linkRawAmount, setLinkRawAmount] = useState(0);
  const [linkDisplayAmount, setLinkDisplayAmount] = useState("");

  const { data: investorsWithCredits } = useQuery({
    queryKey: ["investors-with-credits-dialog"],
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
    enabled: open,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const getAvailableCredits = (userId: string) => {
    const inv = investorsWithCredits?.find((i) => i.user_id === userId);
    if (!inv) return 0;
    return Number(inv.credits) - (reservedCreditsMap?.get(userId) ?? 0);
  };

  const filtered = useMemo(() => {
    if (!investorsWithCredits) return [];
    const q = search.toLowerCase().trim();
    return investorsWithCredits.filter((inv) => {
      if (q && !(inv.full_name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [investorsWithCredits, search]);

  const selectedInvestor = investorsWithCredits?.find((i) => i.user_id === selectedUserId);
  const userMaxCredits = getAvailableCredits(selectedUserId);

  // Fee calculations
  const serviceFee = propertyType === "land" || propertyType === "terreno" ? 500 : 5000;
  const currentAmount = linkRawAmount / 100;

  const arremmateFeeShare = plan === "standard" && totalProject > 0
    ? Math.round((currentAmount / totalProject) * serviceFee * 100) / 100
    : 0;
  const renoFeeShare = plan === "standard" && totalProject > 0
    ? Math.round((currentAmount / totalProject) * (renovationCost * 0.10) * 100) / 100
    : 0;
  const totalFees = arremmateFeeShare + renoFeeShare;
  const currentTotalDeduction = currentAmount + totalFees;

  // Max linkable
  const totalFeeRate = plan === "standard" && totalProject > 0
    ? (serviceFee + renovationCost * 0.10) / totalProject
    : 0;
  const maxLinkableByCredits = totalFeeRate > 0
    ? Math.floor((userMaxCredits / (1 + totalFeeRate)) * 100) / 100
    : userMaxCredits;
  const maxLinkableByRemaining = Math.max(remaining, 0);
  const maxLinkable = Math.min(maxLinkableByCredits, maxLinkableByRemaining);

  const resetForm = () => {
    setSearch("");
    setSelectedUserId("");
    setPlan("standard");
    setLinkRawAmount(0);
    setLinkDisplayAmount("");
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleLink = () => {
    if (currentAmount <= 0 || !selectedUserId) return;
    onLink(selectedUserId, currentAmount, plan);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Vincular Investidor
          </DialogTitle>
          <DialogDescription>
            Selecione o investidor, plano de taxação e valor a vincular.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Property summary */}
          <div className="rounded-lg border border-border bg-secondary/20 p-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Total Projeto</p>
              <p className="font-semibold text-foreground">${formatUSD(totalProject)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Reforma (Est.)</p>
              <p className="font-semibold text-foreground">${formatUSD(renovationCost)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Disponível</p>
              <p className="font-semibold text-emerald-500">${formatUSD(Math.max(remaining, 0))}</p>
            </div>
          </div>

          {/* Step 1: Search investor */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">1. Investidor</label>
            {!selectedUserId ? (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border p-1">
                  {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-3">Nenhum investidor encontrado</p>
                  )}
                  {filtered.map((inv) => {
                    const avail = getAvailableCredits(inv.user_id);
                    return (
                      <button
                        key={inv.user_id}
                        type="button"
                        onClick={() => { setSelectedUserId(inv.user_id); setSearch(""); }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-secondary/50 text-sm text-left transition-colors"
                      >
                        <span className="font-medium truncate">{inv.full_name || "Usuário"}</span>
                        <span className="text-muted-foreground flex-shrink-0 ml-2">
                          ${formatUSD(avail)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/30">
                <div>
                  <p className="font-medium text-sm">{selectedInvestor?.full_name || "Usuário"}</p>
                  <p className="text-xs text-muted-foreground">Saldo: ${formatUSD(userMaxCredits)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedUserId(""); setLinkRawAmount(0); setLinkDisplayAmount(""); }}>
                  Alterar
                </Button>
              </div>
            )}
          </div>

          {/* Step 2: Plan selection */}
          {selectedUserId && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">2. Plano de Taxação</label>
              <div className="grid grid-cols-2 gap-2">
                {(["standard", "equal_split", "fixed_12", "fixed_15"] as InvestmentPlan[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlan(p)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      plan === p
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <p className="text-sm font-semibold">{PLAN_LABELS[p]}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{PLAN_DESCRIPTIONS[p]}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Amount */}
          {selectedUserId && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                3. Valor a vincular
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
          )}

          {/* Summary */}
          {currentAmount > 0 && selectedUserId && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5 text-xs">
              <p className="font-medium text-foreground">Resumo da operação:</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investimento</span>
                <span className="font-semibold">${formatUSD(currentAmount)}</span>
              </div>
              {plan === "standard" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Taxa arremate ({totalProject > 0 ? ((currentAmount / totalProject) * 100).toFixed(1) : 0}% de ${formatUSD(serviceFee)})
                    </span>
                    <span className="font-semibold text-amber-500">${formatUSD(arremmateFeeShare)}</span>
                  </div>
                  {renovationCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Taxa reforma 10% ({totalProject > 0 ? ((currentAmount / totalProject) * 100).toFixed(1) : 0}% de ${formatUSD(renovationCost * 0.10)})
                      </span>
                      <span className="font-semibold text-amber-500">${formatUSD(renoFeeShare)}</span>
                    </div>
                  )}
                </>
              )}
              {plan !== "standard" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxas</span>
                  <span className="font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> $0.00
                  </span>
                </div>
              )}
              <div className="border-t border-border/50 pt-1.5 flex justify-between">
                <span className="font-medium text-foreground">Total debitado</span>
                <span className="font-bold text-foreground">${formatUSD(currentTotalDeduction)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Plano</span>
                <Badge variant="outline" className={`text-[10px] ${PLAN_BADGE_COLORS[plan]}`}>
                  {PLAN_LABELS[plan]}
                </Badge>
              </div>
              {currentAmount > maxLinkableByRemaining && maxLinkableByRemaining >= 0 && (
                <p className="text-destructive font-medium mt-1">
                  ⚠ Valor excede o restante do projeto (disponível: ${formatUSD(maxLinkableByRemaining)})
                </p>
              )}
              {currentAmount <= maxLinkableByRemaining && currentTotalDeduction > userMaxCredits && (
                <p className="text-destructive font-medium mt-1">
                  ⚠ Saldo insuficiente (disponível: ${formatUSD(userMaxCredits)})
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 gap-2"
              disabled={
                !selectedUserId ||
                currentAmount <= 0 ||
                currentAmount > maxLinkableByRemaining ||
                currentTotalDeduction > userMaxCredits ||
                isPending
              }
              onClick={handleLink}
            >
              <UserPlus className="h-4 w-4" />
              {isPending ? "Vinculando..." : "Vincular"}
            </Button>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
