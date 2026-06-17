import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search } from "lucide-react";

export interface ManualFees {
  feeService: number;
  feeRenovation: number;
  feeSales: number;
  feeProfitRate: number;
}

type FeeMode = "pct" | "usd";

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
  docCommissionRate?: number;
  onLink: (userId: string, amount: number, fees: ManualFees) => void;
  isPending: boolean;
  /** For AdminPropertyForm: pass pre-reserved credits map */
  reservedCreditsMap?: Map<string, number>;
}

interface FeeFieldProps {
  label: string;
  hint: string;
  mode: FeeMode;
  value: string;
  onModeChange: (m: FeeMode) => void;
  onValueChange: (v: string) => void;
  computed: number;
  usdOnly?: boolean;
}

function FeeField({ label, hint, mode, value, onModeChange, onValueChange, computed, usdOnly }: FeeFieldProps) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">{hint}</p>
        </div>
        {usdOnly ? (
          <span className="px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-primary text-primary-foreground">$</span>
        ) : (
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => onModeChange("pct")}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "pct" ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-muted-foreground"
              }`}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => onModeChange("usd")}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "usd" ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-muted-foreground"
              }`}
            >
              $
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {mode === "usd" && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          )}
          <Input
            type="number"
            min="0"
            step={mode === "pct" ? "0.01" : "0.01"}
            placeholder="0"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className={mode === "usd" ? "pl-7 h-9" : "pr-7 h-9"}
          />
          {mode === "pct" && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap w-24 text-right">
          = ${formatUSD(computed)}
        </span>
      </div>
    </div>
  );
}

export function LinkInvestorDialog({
  open,
  onOpenChange,
  propertyType,
  totalProject,
  renovationCost,
  remaining,
  estimatedSaleValue = 0,
  docCommissionRate = 10,
  onLink,
  isPending,
  reservedCreditsMap,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [linkRawAmount, setLinkRawAmount] = useState(0);
  const [linkDisplayAmount, setLinkDisplayAmount] = useState("");

  // Fee state: each fee has a mode (% or $) and a raw string value
  const [serviceMode, setServiceMode] = useState<FeeMode>("usd");
  const [serviceValue, setServiceValue] = useState("");
  const [renoMode, setRenoMode] = useState<FeeMode>("pct");
  const [renoValue, setRenoValue] = useState("");
  const [salesMode, setSalesMode] = useState<FeeMode>("pct");
  const [salesValue, setSalesValue] = useState("");
  const [profitMode, setProfitMode] = useState<FeeMode>("pct");
  const [profitValue, setProfitValue] = useState("");

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

  const num = (s: string) => {
    const n = parseFloat(s);
    return isNaN(n) || n < 0 ? 0 : n;
  };

  // The aporte typed = the amount invested to BUY the property. It is the
  // investment itself and is NOT reduced by service fees. Fees are charged
  // ON TOP of the aporte (added to the total debited from credits).
  const grossAporte = linkRawAmount / 100;

  // The full aporte counts as the investment / participation.
  const netInvestment = grossAporte;
  const participation = totalProject > 0 ? netInvestment / totalProject : 0;

  // Service is always a fixed USD value.
  const feeService = num(serviceValue);

  // Percentage-mode entry fees incide sobre o aporte (valor de compra).
  // Ex.: reforma 10% sobre aporte de $10.000 = $1.000 (cobrado à parte).
  const feeRenovation =
    renoMode === "pct" ? (grossAporte * num(renoValue)) / 100 : num(renoValue);
  const feeSales =
    salesMode === "pct" ? (grossAporte * num(salesValue)) / 100 : num(salesValue);

  // Investor gross estimated profit.
  // Documentação é sempre calculada sobre o valor de VENDA.
  const docComm = estimatedSaleValue * (docCommissionRate / 100);
  const totalProfit = estimatedSaleValue - totalProject - docComm;
  const grossProfit = totalProfit > 0 ? totalProfit * participation : 0;

  const feeProfitUsd = profitMode === "pct" ? (grossProfit * num(profitValue)) / 100 : num(profitValue);
  const feeProfitRate = profitMode === "pct" ? num(profitValue) : grossProfit > 0 ? (feeProfitUsd / grossProfit) * 100 : 0;

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const entryFees = round2(feeService + feeRenovation + feeSales);
  // Total debited = aporte (compra) + taxas cobradas à parte.
  const totalDeduction = round2(grossAporte + entryFees);
  const estimatedReturn = Math.max(grossProfit - feeProfitUsd, 0);
  const returnPct = netInvestment > 0 ? (estimatedReturn / netInvestment) * 100 : 0;

  // No longer applicable: fees never consume the aporte.
  const feesExceedAporte = false;

  // Required property values to link an investor.
  // Terrenos (land) não têm Reforma — exigem apenas Arremate e Venda.
  const isLand = propertyType === "land";
  const auctionValue = round2(totalProject - renovationCost);
  const missingPropertyValues = isLand
    ? auctionValue <= 0 || estimatedSaleValue <= 0
    : auctionValue <= 0 || renovationCost <= 0 || estimatedSaleValue <= 0;

  const maxLinkableByRemaining = Math.max(remaining, 0);


  const resetForm = () => {
    setSearch("");
    setSelectedUserId("");
    setLinkRawAmount(0);
    setLinkDisplayAmount("");
    setServiceMode("usd"); setServiceValue("");
    setRenoMode("pct"); setRenoValue("");
    setSalesMode("pct"); setSalesValue("");
    setProfitMode("pct"); setProfitValue("");
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleLink = () => {
    if (netInvestment <= 0 || !selectedUserId || missingPropertyValues || feesExceedAporte) return;
    onLink(selectedUserId, netInvestment, {
      feeService: round2(feeService),
      feeRenovation: round2(feeRenovation),
      feeSales: round2(feeSales),
      feeProfitRate: round2(feeProfitRate),
    });
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
            Selecione o investidor, defina o aporte e as taxas de serviço.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Property summary */}
          <div className="rounded-lg border border-border bg-secondary/20 p-3 grid grid-cols-2 gap-2 text-xs items-start">
            <div>
              <p className="text-muted-foreground">Total Projeto</p>
              <p className="font-semibold text-foreground">${formatUSD(totalProject)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Venda (Est.)</p>
              <p className="font-semibold text-foreground">${formatUSD(estimatedSaleValue)}</p>
              {docCommissionRate > 0 && estimatedSaleValue > 0 && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Líquido ${formatUSD(Math.max(estimatedSaleValue * (1 - docCommissionRate / 100), 0))} (-{docCommissionRate}% doc)
                </p>
              )}
            </div>
            {!isLand && (
              <div>
                <p className="text-muted-foreground">Reforma (Est.)</p>
                <p className="font-semibold text-foreground">${formatUSD(renovationCost)}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Disponível</p>
              <p className="font-semibold text-emerald-500">${formatUSD(Math.max(remaining, 0))}</p>
            </div>
          </div>

          {missingPropertyValues && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive font-medium">
              ⚠ Para vincular um investidor, preencha os valores de {isLand ? "Arremate e Venda do terreno" : "Arremate, Reforma e Venda do imóvel"}.
            </div>
          )}

          {!missingPropertyValues && (
          <>
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

          {/* Step 2: Amount */}
          {selectedUserId && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                2. Valor do aporte (investimento na compra)
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

          {/* Step 3: Manual fees */}
          {selectedUserId && grossAporte > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">3. Taxas de serviço (Discovery)</label>
              <div className="space-y-2">
                <FeeField
                  label="Serviço"
                  hint="Valor fixo cobrado pela Discovery"
                  mode={serviceMode}
                  value={serviceValue}
                  onModeChange={setServiceMode}
                  onValueChange={setServiceValue}
                  computed={round2(feeService)}
                  usdOnly
                />
                {!isLand && (
                  <FeeField
                    label="Reforma"
                    hint="% sobre o aporte ou valor fixo"
                    mode={renoMode}
                    value={renoValue}
                    onModeChange={setRenoMode}
                    onValueChange={setRenoValue}
                    computed={round2(feeRenovation)}
                  />
                )}
                <FeeField
                  label="Vendas"
                  hint="% sobre o aporte ou valor fixo"
                  mode={salesMode}
                  value={salesValue}
                  onModeChange={setSalesMode}
                  onValueChange={setSalesValue}
                  computed={round2(feeSales)}
                />
                <FeeField
                  label="Lucro"
                  hint="% do lucro do investidor (seu corte, descontado no retorno)"
                  mode={profitMode}
                  value={profitValue}
                  onModeChange={setProfitMode}
                  onValueChange={setProfitValue}
                  computed={round2(feeProfitUsd)}
                />
              </div>
            </div>
          )}

          {/* Summary */}
          {grossAporte > 0 && selectedUserId && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5 text-xs">
              <p className="font-medium text-foreground">Resumo da operação:</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aporte (debitado)</span>
                <span className="font-semibold text-foreground">${formatUSD(grossAporte)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investimento líquido</span>
                <span className="font-semibold text-foreground">${formatUSD(netInvestment)}</span>
              </div>
              {feeService > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de serviço</span>
                  <span className="font-semibold text-amber-500">${formatUSD(round2(feeService))}</span>
                </div>
              )}
              {feeRenovation > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de reforma</span>
                  <span className="font-semibold text-amber-500">${formatUSD(round2(feeRenovation))}</span>
                </div>
              )}
              {feeSales > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de vendas</span>
                  <span className="font-semibold text-amber-500">${formatUSD(round2(feeSales))}</span>
                </div>
              )}
              <div className="border-t border-border/50 pt-1.5 flex justify-between">
                <span className="font-medium text-foreground">Total debitado</span>
                <span className="font-bold text-foreground">${formatUSD(totalDeduction)}</span>
              </div>
              {feeProfitUsd > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxa de lucro ({feeProfitRate.toFixed(1)}% do lucro)</span>
                  <span className="font-semibold text-amber-500">${formatUSD(round2(feeProfitUsd))}</span>
                </div>
              )}
              {estimatedSaleValue > 0 && totalProject > 0 && (
                <>
                  <div className="text-[10px] text-muted-foreground px-1 space-y-0.5">
                    {docCommissionRate > 0 && (
                      <span className="block">
                        Venda líquida: ${formatUSD(estimatedSaleValue)} - {docCommissionRate}% doc = ${formatUSD(Math.max(estimatedSaleValue * (1 - docCommissionRate / 100), 0))}
                      </span>
                    )}
                    <span className="block">
                      Lucro do projeto: ${formatUSD(Math.max(estimatedSaleValue * (1 - docCommissionRate / 100), 0))} - ${formatUSD(totalProject)} (custo) = ${formatUSD(Math.max(totalProfit, 0))}
                    </span>
                    <span className="block opacity-75">
                      O retorno do investidor é a sua parte do lucro ({(participation * 100).toFixed(1)}% de participação).
                    </span>
                  </div>
                  <div className="border-t border-border/50 pt-1.5 flex justify-between">
                    <span className="font-medium text-foreground">Retorno Est. Investidor</span>
                    <span className="font-bold text-emerald-500">
                      ${formatUSD(estimatedReturn)} ({returnPct.toFixed(1)}%)
                    </span>
                  </div>
                </>
              )}
              {netInvestment > maxLinkableByRemaining && (
                <p className="text-destructive font-medium mt-1">
                  ⚠ Aporte excede o restante do projeto (disponível: ${formatUSD(maxLinkableByRemaining)})
                </p>
              )}
              {feesExceedAporte && (
                <p className="text-destructive font-medium mt-1">
                  ⚠ As taxas consomem todo o aporte. Aumente o valor do aporte ou reduza as taxas.
                </p>
              )}
              {netInvestment <= maxLinkableByRemaining && totalDeduction > userMaxCredits && (
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
                netInvestment <= 0 ||
                netInvestment > maxLinkableByRemaining ||
                totalDeduction > userMaxCredits ||
                feesExceedAporte ||
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
          </>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
