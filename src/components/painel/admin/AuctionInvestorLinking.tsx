import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Home, TreePine, MapPin, CheckCircle, AlertTriangle } from "lucide-react";

interface AuctionItem {
  id: string;
  property_id: string | null;
  title: string;
  type: string;
  location: string | null;
  image_url: string | null;
}

interface Props {
  auctionId: string;
  items: AuctionItem[];
}

function formatUSD(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getServiceFee(type: string): number {
  return type === "terreno" || type === "land" ? 500 : 5000;
}

export default function AuctionInvestorLinking({ auctionId, items }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [linkingPropertyId, setLinkingPropertyId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [linkRawAmount, setLinkRawAmount] = useState(0);
  const [linkDisplayAmount, setLinkDisplayAmount] = useState("");

  const propertyItems = items.filter((item) => item.property_id);
  const propertyIds = propertyItems.map((item) => item.property_id!);

  const { data: existingShares } = useQuery({
    queryKey: ["auction-shares", propertyIds],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      const { data, error } = await supabase
        .from("shares")
        .select("*")
        .in("property_id", propertyIds);
      if (error) throw error;
      return data;
    },
    enabled: propertyIds.length > 0,
  });

  const { data: properties } = useQuery({
    queryKey: ["auction-properties-detail", propertyIds],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      const { data, error } = await supabase
        .from("properties")
        .select("id, estimated_auction_value, estimated_renovation_cost, estimated_return_pct, title, type")
        .in("id", propertyIds);
      if (error) throw error;
      return data;
    },
    enabled: propertyIds.length > 0,
  });

  const { data: investorsWithCredits } = useQuery({
    queryKey: ["investors-with-credits-linking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, credits")
        .gt("credits", 0)
        .order("credits", { ascending: false });
      if (error) throw error;
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminIds = new Set(adminRoles?.map((r) => r.user_id) ?? []);
      return data.filter((p) => !adminIds.has(p.user_id));
    },
  });

  const shareUserIds = [...new Set(existingShares?.map((s) => s.user_id) ?? [])];
  const { data: shareProfiles } = useQuery({
    queryKey: ["share-profiles", shareUserIds],
    queryFn: async () => {
      if (shareUserIds.length === 0) return [];
      const { data, error } = await supabase.from("profiles").select("user_id, full_name").in("user_id", shareUserIds);
      if (error) throw error;
      return data;
    },
    enabled: shareUserIds.length > 0,
  });

  const profileMap = new Map([
    ...(shareProfiles?.map((p) => [p.user_id, p.full_name] as [string, string | null]) ?? []),
    ...(investorsWithCredits?.map((p) => [p.user_id, p.full_name] as [string, string | null]) ?? []),
  ]);

  const userLinkedTotals = new Map<string, number>();
  for (const share of existingShares ?? []) {
    userLinkedTotals.set(share.user_id, (userLinkedTotals.get(share.user_id) ?? 0) + Number(share.amount_paid));
  }

  const investors = (investorsWithCredits ?? []).map((inv) => ({
    user_id: inv.user_id,
    name: inv.full_name || "Usuário",
    credits: Number(inv.credits),
    totalLinked: userLinkedTotals.get(inv.user_id) ?? 0,
  }));

  const linkMutation = useMutation({
    mutationFn: async ({ propertyId, userId, amount, propertyType, propertyTitle }: {
      propertyId: string;
      userId: string;
      amount: number;
      propertyType: string;
      propertyTitle: string;
    }) => {
      const { error } = await supabase.rpc("admin_link_investor_to_property" as any, {
        p_property_id: propertyId,
        p_user_id: userId,
        p_amount: amount,
        p_property_type: propertyType,
        p_property_title: propertyTitle,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-shares", propertyIds] });
      queryClient.invalidateQueries({ queryKey: ["investors-with-credits-linking"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      toast({ title: "Investidor vinculado com sucesso!" });
      setSelectedUserId("");
      setLinkRawAmount(0);
      setLinkDisplayAmount("");
      setLinkingPropertyId(null);
    },
    onError: (e: Error) => toast({ title: "Erro ao vincular", description: e.message, variant: "destructive" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (shareIds: string[]) => {
      const { error } = await supabase.from("shares").delete().in("id", shareIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-shares", propertyIds] });
      queryClient.invalidateQueries({ queryKey: ["investors-with-credits-linking"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["property-investors"] });
      toast({ title: "Vínculo removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (propertyItems.length === 0) return null;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Vincular Investidores aos Imóveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Investors with available credits */}
        {investors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Investidores com Saldo ({investors.length})
            </p>
            <div className="grid gap-2">
              {investors.map((inv) => (
                <div key={inv.user_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/30 text-sm">
                  <span className="font-medium">{inv.name}</span>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="font-semibold text-discovery-green">
                        ${formatUSD(inv.credits)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Disponível</p>
                    </div>
                    {inv.totalLinked > 0 && (
                      <div>
                        <p className="font-semibold text-primary">
                          ${formatUSD(inv.totalLinked)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Vinculado</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-property linking */}
        {propertyItems.map((item) => {
          const propDetail = properties?.find((p) => p.id === item.property_id);
          const totalProject = (propDetail?.estimated_auction_value ?? 0) + (propDetail?.estimated_renovation_cost ?? 0);
          const propertyType = propDetail?.type ?? item.type;
          const serviceFee = getServiceFee(propertyType);
          const linkedShares = existingShares?.filter((s) => s.property_id === item.property_id) ?? [];
          const totalLinked = linkedShares.reduce((sum, s) => sum + Number(s.amount_paid), 0);
          const remaining = totalProject - totalLinked;
          const isFullyCovered = remaining <= 0;
          const isLinking = linkingPropertyId === item.property_id;

          // Calculate total fees already charged (proportional)
          const totalFeeCharged = totalProject > 0
            ? linkedShares.reduce((sum, s) => sum + (Number(s.amount_paid) / totalProject) * serviceFee, 0)
            : 0;

          const availableInvestors = investors.filter((inv) => inv.credits > 0);

          const selectedInvestor = investors.find((inv) => inv.user_id === selectedUserId);
          const userMaxCredits = selectedInvestor?.credits ?? 0;

          // Current link amount
          const currentAmount = linkRawAmount / 100;
          const currentFeeShare = totalProject > 0 ? Math.round((currentAmount / totalProject) * serviceFee * 100) / 100 : 0;
          const currentTotalDeduction = currentAmount + currentFeeShare;

          // Max linkable considering fee
          const maxLinkableByRemaining = remaining;
          const maxLinkableByCredits = totalProject > 0
            ? Math.floor((userMaxCredits / (1 + serviceFee / totalProject)) * 100) / 100
            : userMaxCredits;
          const maxLinkable = Math.min(maxLinkableByRemaining, maxLinkableByCredits);

          return (
            <div key={item.id} className="border border-border rounded-xl p-4 space-y-3">
              {/* Property header */}
              <div className="flex items-center gap-3">
                {item.image_url ? (
                  <div className="h-12 w-18 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-12 w-18 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {item.type === "terreno" ? <TreePine className="h-5 w-5 text-primary" /> : <Home className="h-5 w-5 text-primary" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{item.title}</p>
                  {item.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {item.location}
                    </p>
                  )}
                </div>
                {isFullyCovered ? (
                  <Badge className="bg-discovery-green text-primary-foreground gap-1">
                    <CheckCircle className="h-3 w-3" /> Coberto
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Falta ${formatUSD(remaining)}
                  </Badge>
                )}
              </div>

              {/* Service fee info */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Taxa de serviço: <span className="font-semibold text-foreground">${formatUSD(serviceFee)}</span>
                  {" "}({propertyType === "land" || propertyType === "terreno" ? "terreno" : "casa"})
                  {totalFeeCharged > 0 && (
                    <> — Cobrado até agora: <span className="font-semibold text-foreground">${formatUSD(totalFeeCharged)}</span></>
                  )}
                </span>
              </div>

              {/* Progress bar */}
              {totalProject > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Vinculado: ${formatUSD(totalLinked)}</span>
                    <span>Total: ${formatUSD(totalProject)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-discovery-green rounded-full transition-all"
                      style={{ width: `${Math.min((totalLinked / totalProject) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Linked investors */}
              {linkedShares.length > 0 && (() => {
                // Group shares by user
                const grouped = new Map<string, { userId: string; totalPaid: number; shareIds: string[] }>();
                for (const share of linkedShares) {
                  const existing = grouped.get(share.user_id);
                  if (existing) {
                    existing.totalPaid += Number(share.amount_paid);
                    existing.shareIds.push(share.id);
                  } else {
                    grouped.set(share.user_id, {
                      userId: share.user_id,
                      totalPaid: Number(share.amount_paid),
                      shareIds: [share.id],
                    });
                  }
                }

                return (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Investidores vinculados:</p>
                    {[...grouped.values()].map((g) => {
                      const pct = totalProject > 0 ? ((g.totalPaid / totalProject) * 100).toFixed(1) : "0";
                      const estReturn = propDetail?.estimated_return_pct
                        ? g.totalPaid * (propDetail.estimated_return_pct / 100)
                        : 0;
                      const shareFee = totalProject > 0
                        ? Math.round((g.totalPaid / totalProject) * serviceFee * 100) / 100
                        : 0;

                      return (
                        <div key={g.userId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/20 text-sm">
                          <div>
                            <span className="font-medium">{profileMap.get(g.userId) || "Usuário"}</span>
                            <span className="text-muted-foreground ml-2">({pct}%)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-semibold">${formatUSD(g.totalPaid)}</p>
                              <p className="text-[10px] text-amber-500">
                                Taxa: ${formatUSD(shareFee)}
                              </p>
                              {estReturn > 0 && (
                                <p className="text-[10px] text-discovery-green">
                                  Lucro est.: ${formatUSD(estReturn)}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => unlinkMutation.mutate(g.shareIds)}
                              disabled={unlinkMutation.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Link form */}
              {!isFullyCovered && (
                <>
                  {isLinking ? (
                    <div className="space-y-3 pt-2 border-t border-border/50">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Investidor</label>
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Selecione um investidor</option>
                          {availableInvestors.map((inv) => (
                            <option key={inv.user_id} value={inv.user_id}>
                              {inv.name} — Saldo: ${formatUSD(inv.credits)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Valor a vincular (máx: ${formatUSD(Math.max(maxLinkable, 0))})
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

                      {/* Fee breakdown preview */}
                      {currentAmount > 0 && selectedUserId && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5 text-xs">
                          <p className="font-medium text-foreground">Resumo da operação:</p>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Investimento</span>
                            <span className="font-semibold">${formatUSD(currentAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Taxa proporcional ({totalProject > 0 ? ((currentAmount / totalProject) * 100).toFixed(1) : 0}% de ${formatUSD(serviceFee)})
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
                            currentAmount > remaining ||
                            currentTotalDeduction > userMaxCredits ||
                            linkMutation.isPending
                          }
                          onClick={() => {
                            if (currentAmount <= 0) return;
                            linkMutation.mutate({
                              propertyId: item.property_id!,
                              userId: selectedUserId,
                              amount: currentAmount,
                              propertyType: propertyType,
                              propertyTitle: propDetail?.title ?? item.title,
                            });
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                          {linkMutation.isPending ? "Vinculando..." : "Vincular"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setLinkingPropertyId(null); setSelectedUserId(""); setLinkRawAmount(0); setLinkDisplayAmount(""); }}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full"
                      onClick={() => setLinkingPropertyId(item.property_id)}
                    >
                      <UserPlus className="h-4 w-4" /> Vincular Investidor
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
