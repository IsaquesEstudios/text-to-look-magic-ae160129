import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Home, TreePine, MapPin, CheckCircle } from "lucide-react";

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

export default function AuctionInvestorLinking({ auctionId, items }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [linkingPropertyId, setLinkingPropertyId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [linkAmount, setLinkAmount] = useState("");

  const propertyItems = items.filter((item) => item.property_id);
  const propertyIds = propertyItems.map((item) => item.property_id!);

  // Fetch existing shares for these properties
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

  // Fetch property details (for total cost)
  const { data: properties } = useQuery({
    queryKey: ["auction-properties-detail", propertyIds],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      const { data, error } = await supabase
        .from("properties")
        .select("id, estimated_auction_value, estimated_renovation_cost, estimated_return_pct, title")
        .in("id", propertyIds);
      if (error) throw error;
      return data;
    },
    enabled: propertyIds.length > 0,
  });

  // Fetch all non-admin users with credits > 0
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

  // Fetch share user profiles for display
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

  // Calculate total linked per user across all auction properties
  const userLinkedTotals = new Map<string, number>();
  for (const share of existingShares ?? []) {
    userLinkedTotals.set(share.user_id, (userLinkedTotals.get(share.user_id) ?? 0) + Number(share.amount_paid));
  }

  // Build investor list from users with credits
  const investors = (investorsWithCredits ?? []).map((inv) => ({
    user_id: inv.user_id,
    name: inv.full_name || "Usuário",
    credits: Number(inv.credits),
    totalLinked: userLinkedTotals.get(inv.user_id) ?? 0,
  }));

  const linkMutation = useMutation({
    mutationFn: async ({ propertyId, userId, amount }: { propertyId: string; userId: string; amount: number }) => {
      const { error } = await supabase.from("shares").insert({
        property_id: propertyId,
        user_id: userId,
        quantity: 1,
        amount_paid: amount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-shares", propertyIds] });
      queryClient.invalidateQueries({ queryKey: ["investors-with-credits-linking"] });
      toast({ title: "Investidor vinculado com sucesso!" });
      setSelectedUserId("");
      setLinkAmount("");
      setLinkingPropertyId(null);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase.from("shares").delete().eq("id", shareId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-shares", propertyIds] });
      queryClient.invalidateQueries({ queryKey: ["investors-with-credits-linking"] });
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
                        ${inv.credits.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Disponível</p>
                    </div>
                    {inv.totalLinked > 0 && (
                      <div>
                        <p className="font-semibold text-primary">
                          ${inv.totalLinked.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
          const linkedShares = existingShares?.filter((s) => s.property_id === item.property_id) ?? [];
          const totalLinked = linkedShares.reduce((sum, s) => sum + Number(s.amount_paid), 0);
          const remaining = totalProject - totalLinked;
          const isFullyCovered = remaining <= 0;
          const isLinking = linkingPropertyId === item.property_id;

          const linkedUserIds = new Set(linkedShares.map((s) => s.user_id));
          const availableInvestors = investors.filter((inv) => !linkedUserIds.has(inv.user_id) && inv.credits > 0);

          const selectedInvestor = investors.find((inv) => inv.user_id === selectedUserId);
          const userMaxAvailable = selectedInvestor?.credits ?? 0;
          const maxLinkable = Math.min(remaining, userMaxAvailable);

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
                    Falta ${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </Badge>
                )}
              </div>

              {/* Progress bar */}
              {totalProject > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Vinculado: ${totalLinked.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    <span>Total: ${totalProject.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
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
              {linkedShares.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Investidores vinculados:</p>
                  {linkedShares.map((share) => {
                    const pct = totalProject > 0 ? ((Number(share.amount_paid) / totalProject) * 100).toFixed(1) : "0";
                    const estReturn = propDetail?.estimated_return_pct
                      ? Number(share.amount_paid) * (propDetail.estimated_return_pct / 100)
                      : 0;

                    return (
                      <div key={share.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/20 text-sm">
                        <div>
                          <span className="font-medium">{profileMap.get(share.user_id) || "Usuário"}</span>
                          <span className="text-muted-foreground ml-2">({pct}%)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">${Number(share.amount_paid).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                            {estReturn > 0 && (
                              <p className="text-[10px] text-discovery-green">
                                Lucro est.: ${estReturn.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => unlinkMutation.mutate(share.id)}
                            disabled={unlinkMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

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
                              {inv.name} — Saldo: ${inv.credits.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Valor a vincular (máx: ${maxLinkable.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                        </label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="$0.00"
                          value={linkAmount}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.]/g, "");
                            const parts = raw.split(".");
                            const cleaned = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : raw;
                            if (cleaned === "" || cleaned === ".") {
                              setLinkAmount("");
                              return;
                            }
                            const num = parseFloat(cleaned);
                            if (!isNaN(num)) {
                              const hasDecimal = cleaned.includes(".");
                              const decimalPart = hasDecimal ? cleaned.split(".")[1] : "";
                              const intPart = Math.floor(num).toLocaleString("en-US");
                              setLinkAmount(hasDecimal ? `$${intPart}.${decimalPart}` : `$${intPart}`);
                            }
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-2"
                          disabled={!selectedUserId || !linkAmount || linkMutation.isPending}
                          onClick={() => {
                            const amount = parseFloat(linkAmount.replace(/[^0-9.]/g, ""));
                            if (isNaN(amount) || amount <= 0) return;
                            if (amount > maxLinkable) {
                              toast({ title: "Valor excede o máximo permitido", description: `Máximo: $${maxLinkable.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, variant: "destructive" });
                              return;
                            }
                            linkMutation.mutate({
                              propertyId: item.property_id!,
                              userId: selectedUserId,
                              amount,
                            });
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                          {linkMutation.isPending ? "Vinculando..." : "Vincular"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setLinkingPropertyId(null); setSelectedUserId(""); setLinkAmount(""); }}>
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
