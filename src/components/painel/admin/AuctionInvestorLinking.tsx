import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, DollarSign, Trash2, Home, TreePine, MapPin, CheckCircle } from "lucide-react";

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

interface AuctionItem {
  id: string;
  property_id: string | null;
  title: string;
  type: string;
  location: string | null;
  image_url: string | null;
}

interface ParticipantSummary {
  user_id: string;
  name: string;
  totalInvested: number;
  highestDepositDate: string;
}

interface Props {
  auctionId: string;
  items: AuctionItem[];
  deposits: Deposit[];
  profileMap: Map<string, string | null>;
}

export default function AuctionInvestorLinking({ auctionId, items, deposits, profileMap }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [linkingPropertyId, setLinkingPropertyId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [linkAmount, setLinkAmount] = useState("");

  // Get properties with property_id from auction items
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

  // Fetch share user profiles
  const shareUserIds = [...new Set(existingShares?.map((s) => s.user_id) ?? [])];
  const allUserIds = [...new Set([...shareUserIds, ...deposits.map((d) => d.user_id)])];
  const { data: shareProfiles } = useQuery({
    queryKey: ["share-profiles", allUserIds],
    queryFn: async () => {
      if (allUserIds.length === 0) return [];
      const { data, error } = await supabase.from("profiles").select("user_id, full_name").in("user_id", allUserIds);
      if (error) throw error;
      return data;
    },
    enabled: allUserIds.length > 0,
  });

  const allProfileMap = new Map([
    ...profileMap.entries(),
    ...(shareProfiles?.map((p) => [p.user_id, p.full_name] as [string, string | null]) ?? []),
  ]);

  // Build participant summaries: group deposits by user, sort by highest deposit date
  const participants: ParticipantSummary[] = (() => {
    const map = new Map<string, { total: number; highestAmount: number; highestDate: string }>();
    for (const dep of deposits) {
      const existing = map.get(dep.user_id);
      const amt = Number(dep.amount);
      if (!existing) {
        map.set(dep.user_id, { total: amt, highestAmount: amt, highestDate: dep.created_at });
      } else {
        existing.total += amt;
        if (amt > existing.highestAmount) {
          existing.highestAmount = amt;
          existing.highestDate = dep.created_at;
        }
      }
    }
    return Array.from(map.entries())
      .map(([user_id, info]) => ({
        user_id,
        name: allProfileMap.get(user_id) || "Usuário",
        totalInvested: info.total,
        highestDepositDate: info.highestDate,
      }))
      .sort((a, b) => new Date(a.highestDepositDate).getTime() - new Date(b.highestDepositDate).getTime());
  })();

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
      toast({ title: "Vínculo removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (propertyItems.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Vincular Investidores aos Imóveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Participants summary */}
        {participants.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Participantes do Leilão ({participants.length})
            </p>
            <div className="grid gap-2">
              {participants.map((p) => (
                <div key={p.user_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/30 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="font-semibold text-foreground">
                    ${p.totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
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

          // Users already linked to this property
          const linkedUserIds = new Set(linkedShares.map((s) => s.user_id));
          // Available participants (not yet linked to this property)
          const availableParticipants = participants.filter((p) => !linkedUserIds.has(p.user_id));

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
                          <span className="font-medium">{allProfileMap.get(share.user_id) || "Usuário"}</span>
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
                          <option value="">Selecione um participante</option>
                          {availableParticipants.map((p) => (
                            <option key={p.user_id} value={p.user_id}>
                              {p.name} — Total: ${p.totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Valor a vincular (máx: ${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })})
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
                              // Format with commas while typing, preserve decimal input
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
