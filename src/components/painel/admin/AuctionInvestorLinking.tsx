import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Home, TreePine, MapPin, CheckCircle } from "lucide-react";
import { LinkInvestorDialog, type ManualFees } from "@/components/painel/admin/LinkInvestorDialog";

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

export default function AuctionInvestorLinking({ auctionId, items }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [linkingItem, setLinkingItem] = useState<AuctionItem | null>(null);

  const propertyIds = items.map((item) => item.property_id).filter(Boolean) as string[];

  const { data: existingShares } = useQuery({
    queryKey: ["auction-shares", propertyIds],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      const { data, error } = await supabase
        .from("shares")
        .select("*, investment_plan")
        .in("property_id", propertyIds);
      if (error) throw error;
      return data;
    },
    enabled: propertyIds.length > 0,
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

  const profileMap = new Map(shareProfiles?.map((p) => [p.user_id, p.full_name] as [string, string | null]) ?? []);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["auction-shares"] });
    queryClient.invalidateQueries({ queryKey: ["auction-items"] });
    queryClient.invalidateQueries({ queryKey: ["investors-with-credits-dialog"] });
    queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
    queryClient.invalidateQueries({ queryKey: ["admin-properties-kpis"] });
    queryClient.invalidateQueries({ queryKey: ["admin-portfolio-counts"] });
    queryClient.invalidateQueries({ queryKey: ["property-investors"] });
    queryClient.invalidateQueries({ queryKey: ["user-shares-houses"] });
    queryClient.invalidateQueries({ queryKey: ["user-shares-land"] });
    queryClient.invalidateQueries({ queryKey: ["investment-kpis"] });
  };

  const linkMutation = useMutation({
    mutationFn: async ({ item, userId, amount, plan }: {
      item: AuctionItem;
      userId: string;
      amount: number;
      plan: InvestmentPlan;
    }) => {
      let propertyId = item.property_id;

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

        await supabase.from("auction_items").update({ property_id: propertyId }).eq("id", item.id);
      }

      const propType = item.type === "terreno" ? "land" : "house";
      const { error } = await supabase.rpc("admin_link_investor_to_property" as any, {
        p_property_id: propertyId,
        p_user_id: userId,
        p_amount: amount,
        p_property_type: propType,
        p_property_title: item.title,
        p_investment_plan: plan,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Investidor vinculado com sucesso!" });
      setLinkingItem(null);
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
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Vínculo removido e créditos restituídos" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (items.length === 0) return null;

  // Compute linking item data for dialog
  const linkingAuctionVal = linkingItem ? Number(linkingItem.estimated_auction_value) || 0 : 0;
  const linkingRenovationVal = linkingItem ? Number(linkingItem.estimated_renovation_cost) || 0 : 0;
  const linkingTotalProject = linkingAuctionVal + linkingRenovationVal;
  const linkingLinkedShares = linkingItem?.property_id
    ? (existingShares?.filter((s) => s.property_id === linkingItem.property_id) ?? [])
    : [];
  const linkingTotalLinked = linkingLinkedShares.reduce((sum, s) => sum + Number(s.amount_paid), 0);
  const linkingRemaining = linkingTotalProject - linkingTotalLinked;

  return (
    <>
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Vincular Investidores aos Imóveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {items.map((item) => {
            const auctionVal = Number(item.estimated_auction_value) || 0;
            const renovationVal = Number(item.estimated_renovation_cost) || 0;
            const totalProject = auctionVal + renovationVal;
            const linkedShares = item.property_id
              ? (existingShares?.filter((s) => s.property_id === item.property_id) ?? [])
              : [];
            const totalLinked = linkedShares.reduce((sum, s) => sum + Number(s.amount_paid), 0);
            const remaining = totalProject - totalLinked;
            const isFullyCovered = remaining <= 0 && totalProject > 0;

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
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                      <CheckCircle className="h-3 w-3" /> Coberto
                    </Badge>
                  ) : totalProject > 0 ? (
                    <Badge variant="outline">
                      Falta ${formatUSD(remaining)}
                    </Badge>
                  ) : null}
                </div>

                {/* Financial summary */}
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

                {/* Progress bar */}
                {totalProject > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Vinculado: ${formatUSD(totalLinked)}</span>
                      <span>Total: ${formatUSD(totalProject)}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((totalLinked / totalProject) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Linked investors */}
                {linkedShares.length > 0 && (() => {
                  const grouped = new Map<string, { userId: string; totalPaid: number; plan: string }>();
                  for (const share of linkedShares) {
                    const existing = grouped.get(share.user_id);
                    if (existing) {
                      existing.totalPaid += Number(share.amount_paid);
                    } else {
                      grouped.set(share.user_id, {
                        userId: share.user_id,
                        totalPaid: Number(share.amount_paid),
                        plan: (share as any).investment_plan ?? "standard",
                      });
                    }
                  }

                  return (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Investidores vinculados:</p>
                      {[...grouped.values()].map((g) => {
                        const pct = totalProject > 0 ? ((g.totalPaid / totalProject) * 100).toFixed(1) : "0";
                        const planKey = g.plan as InvestmentPlan;

                        return (
                          <div key={g.userId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/20 text-sm">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{profileMap.get(g.userId) || "Usuário"}</span>
                              <Badge variant="outline" className={`text-[10px] w-fit ${PLAN_BADGE_COLORS[planKey]}`}>
                                {PLAN_LABELS[planKey]}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-semibold">${formatUSD(g.totalPaid)}</p>
                                <p className="text-[10px] text-muted-foreground">({pct}%)</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => unlinkMutation.mutate({ propertyId: item.property_id!, userId: g.userId })}
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

                {/* Link button */}
                {!isFullyCovered && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 w-full"
                    onClick={() => setLinkingItem(item)}
                  >
                    <UserPlus className="h-4 w-4" /> Vincular Investidor
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {linkingItem && (
        <LinkInvestorDialog
          open={!!linkingItem}
          onOpenChange={(v) => { if (!v) setLinkingItem(null); }}
          propertyType={linkingItem.type === "terreno" ? "land" : "house"}
          totalProject={linkingTotalProject}
          renovationCost={linkingRenovationVal}
          estimatedSaleValue={linkingItem ? Number(linkingItem.estimated_sale_value) || 0 : 0}
          remaining={linkingRemaining}
          onLink={(userId, amount, plan) => linkMutation.mutate({ item: linkingItem, userId, amount, plan })}
          isPending={linkMutation.isPending}
        />
      )}
    </>
  );
}
