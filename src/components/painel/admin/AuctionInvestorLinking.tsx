import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  state_code?: string | null;
  estimated_auction_value?: number | null;
  estimated_renovation_cost?: number | null;
  estimated_sale_value?: number | null;
  estimated_timeline?: string | null;
  status?: string | null;
  cover_image_url?: string | null;
  gallery_images?: string[] | null;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [linkingItemId, setLinkingItemId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [linkRawAmount, setLinkRawAmount] = useState(0);
  const [linkDisplayAmount, setLinkDisplayAmount] = useState("");

  // Get property IDs for items that already have properties created
  const propertyIds = items.map((item) => item.property_id).filter(Boolean) as string[];

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

  const { data: investorsWithCredits } = useQuery({
    queryKey: ["investors-with-credits-linking"],
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
    mutationFn: async ({ item, userId, amount }: {
      item: AuctionItem;
      userId: string;
      amount: number;
    }) => {
      let propertyId = item.property_id;

      // If property doesn't exist yet, create it from auction_item data
      if (!propertyId) {
        const auctionVal = Number(item.estimated_auction_value) || 0;
        const renovationVal = Number(item.estimated_renovation_cost) || 0;
        const saleVal = Number(item.estimated_sale_value) || 0;
        const totalProjeto = auctionVal + renovationVal;
        const roi = totalProjeto > 0 ? ((saleVal - totalProjeto) / totalProjeto) * 100 : 0;
        const propType = item.type === "terreno" ? "land" : "house";

        const { data: prop, error: propError } = await supabase
          .from("properties")
          .insert({
            type: propType,
            title: item.title,
            location: item.location || "",
            state_code: item.state_code || null,
            purchase_price: totalProjeto,
            estimated_auction_value: auctionVal,
            estimated_renovation_cost: renovationVal,
            estimated_return_pct: Math.min(roi, 99999.99),
            estimated_sale_value: saleVal,
            total_shares: 1,
            share_price: 0,
            available_shares: 1,
            status: item.status || "available",
            cover_image_url: item.cover_image_url || item.image_url || null,
            estimated_timeline: item.estimated_timeline || "",
            created_by: user!.id,
          })
          .select("id")
          .single();
        if (propError) throw propError;

        propertyId = prop.id;

        // Create gallery images
        const gallery = item.gallery_images ?? [];
        if (gallery.length > 0) {
          await supabase.from("property_images").insert(
            gallery.map((url, i) => ({
              property_id: propertyId!,
              image_url: url,
              sort_order: i,
            }))
          );
        }

        // Update auction_item to link to the new property
        await supabase.from("auction_items").update({ property_id: propertyId }).eq("id", item.id);
      }

      // Now link the investor via RPC
      const propType = item.type === "terreno" ? "land" : "house";
      const { error } = await supabase.rpc("admin_link_investor_to_property" as any, {
        p_property_id: propertyId,
        p_user_id: userId,
        p_amount: amount,
        p_property_type: propType,
        p_property_title: item.title,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-shares"] });
      queryClient.invalidateQueries({ queryKey: ["auction-items"] });
      queryClient.invalidateQueries({ queryKey: ["investors-with-credits-linking"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["admin-portfolio-counts"] });
      queryClient.invalidateQueries({ queryKey: ["property-investors"] });
      queryClient.invalidateQueries({ queryKey: ["user-shares-houses"] });
      queryClient.invalidateQueries({ queryKey: ["user-shares-land"] });
      queryClient.invalidateQueries({ queryKey: ["investment-kpis"] });
      toast({ title: "Investidor vinculado com sucesso!" });
      setSelectedUserId("");
      setLinkRawAmount(0);
      setLinkDisplayAmount("");
      setLinkingItemId(null);
    },
    onError: (e: Error) => toast({ title: "Erro ao vincular", description: e.message, variant: "destructive" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: async ({ propertyId, userId }: { propertyId: string; userId: string }) => {
      const { error } = await supabase.rpc("admin_unlink_investor" as any, {
        p_property_id: propertyId,
        p_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-shares"] });
      queryClient.invalidateQueries({ queryKey: ["investors-with-credits-linking"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["property-investors"] });
      queryClient.invalidateQueries({ queryKey: ["user-shares-houses"] });
      queryClient.invalidateQueries({ queryKey: ["user-shares-land"] });
      queryClient.invalidateQueries({ queryKey: ["investment-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Vínculo removido e créditos restituídos" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (items.length === 0) return null;

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
        {investors.filter((i) => i.credits > 0).length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Investidores com Saldo ({investors.filter((i) => i.credits > 0).length})
            </p>
            <div className="grid gap-2">
              {investors.filter((i) => i.credits > 0).map((inv) => (
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

        {/* Per-item linking */}
        {items.map((item) => {
          const auctionVal = Number(item.estimated_auction_value) || 0;
          const renovationVal = Number(item.estimated_renovation_cost) || 0;
          const totalProject = auctionVal + renovationVal;
          const serviceFee = getServiceFee(item.type);
          const linkedShares = item.property_id
            ? (existingShares?.filter((s) => s.property_id === item.property_id) ?? [])
            : [];
          const totalLinked = linkedShares.reduce((sum, s) => sum + Number(s.amount_paid), 0);
          const remaining = totalProject - totalLinked;
          const isFullyCovered = remaining <= 0 && totalProject > 0;
          const isLinking = linkingItemId === item.id;

          const totalFeeCharged = totalProject > 0
            ? linkedShares.reduce((sum, s) => sum + (Number(s.amount_paid) / totalProject) * serviceFee, 0)
            : 0;

          const availableInvestors = investors.filter((inv) => inv.credits > 0);

          const selectedInvestor = investors.find((inv) => inv.user_id === selectedUserId);
          const userMaxCredits = selectedInvestor?.credits ?? 0;

          const currentAmount = linkRawAmount / 100;
          const currentFeeShare = totalProject > 0 ? Math.round((currentAmount / totalProject) * serviceFee * 100) / 100 : 0;
          const currentTotalDeduction = currentAmount + currentFeeShare;

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
                  {!item.property_id && (
                    <Badge variant="outline" className="text-[10px] mt-1">Aguardando vínculo</Badge>
                  )}
                </div>
                {isFullyCovered ? (
                  <Badge className="bg-discovery-green text-primary-foreground gap-1">
                    <CheckCircle className="h-3 w-3" /> Coberto
                  </Badge>
                ) : totalProject > 0 ? (
                  <Badge variant="outline">
                    Falta ${formatUSD(remaining)}
                  </Badge>
                ) : null}
              </div>

              {/* Financial summary from auction_item data */}
              {totalProject > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-secondary/20 p-2 text-center">
                    <p className="text-muted-foreground">Est. Arremate</p>
                    <p className="font-semibold">${formatUSD(auctionVal)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/20 p-2 text-center">
                    <p className="text-muted-foreground">Est. Reforma</p>
                    <p className="font-semibold">${formatUSD(renovationVal)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/20 p-2 text-center">
                    <p className="text-muted-foreground">Est. Total</p>
                    <p className="font-semibold">${formatUSD(totalProject)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/20 p-2 text-center">
                    <p className="text-muted-foreground">Est. Venda</p>
                    <p className="font-semibold">${formatUSD(Number(item.estimated_sale_value) || 0)}</p>
                  </div>
                </div>
              )}

              {/* Service fee info */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Taxa de serviço: <span className="font-semibold text-foreground">${formatUSD(serviceFee)}</span>
                  {" "}({item.type === "terreno" || item.type === "land" ? "terreno" : "casa"})
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

                const saleVal = Number(item.estimated_sale_value) || 0;
                const roi = totalProject > 0 ? ((saleVal - totalProject) / totalProject) * 100 : 0;

                return (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Investidores vinculados:</p>
                    {[...grouped.values()].map((g) => {
                      const pct = totalProject > 0 ? ((g.totalPaid / totalProject) * 100).toFixed(1) : "0";
                      const estReturn = roi > 0 ? g.totalPaid * (roi / 100) : 0;
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
                          {!item.property_id && (
                            <p className="text-primary font-medium mt-1">
                              ℹ A propriedade será criada automaticamente ao vincular
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
                              item,
                              userId: selectedUserId,
                              amount: currentAmount,
                            });
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                          {linkMutation.isPending ? "Vinculando..." : "Vincular"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setLinkingItemId(null); setSelectedUserId(""); setLinkRawAmount(0); setLinkDisplayAmount(""); }}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full"
                      onClick={() => setLinkingItemId(item.id)}
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
