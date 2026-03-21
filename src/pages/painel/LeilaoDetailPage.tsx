import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, MapPin, Home, TreePine, Pencil, Save, X, Plus, Trash2, ArrowLeft, Lock, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AuctionPropertyForm, AuctionPropertyData, emptyPropertyData } from "@/components/painel/admin/AuctionPropertyForm";
import AuctionInvestorLinking from "@/components/painel/admin/AuctionInvestorLinking";

function CountdownTimer({ targetDate, label = "Começa em", expiredLabel = "Leilão encerrado!" }: { targetDate: string; label?: string; expiredLabel?: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(expiredLabel);
        setIsStarted(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        days > 0
          ? `${days}d ${hours}h ${minutes}m ${seconds}s`
          : `${hours}h ${minutes}m ${seconds}s`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate, expiredLabel]);

  return (
    <div className={`text-center p-4 rounded-xl ${isStarted ? "bg-destructive/10 text-destructive" : "bg-primary/5 text-primary"}`}>
      <p className="text-xs text-muted-foreground mb-1">
        {isStarted ? "Status" : label}
      </p>
      <p className="text-2xl font-bold font-mono tracking-wider">{timeLeft}</p>
    </div>
  );
}

export default function LeilaoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", scheduled_start: "" });
  const [newPropertyForms, setNewPropertyForms] = useState<AuctionPropertyData[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemForm, setEditItemForm] = useState<AuctionPropertyData>({ ...emptyPropertyData });
  const [showAddProperty, setShowAddProperty] = useState(false);

  const { data: auction } = useQuery({
    queryKey: ["auction", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("auctions").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: items } = useQuery({
    queryKey: ["auction-items", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("auction_items").select("*").eq("auction_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateAuctionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("auctions")
        .update({
          title: editForm.title,
          description: editForm.description || null,
          scheduled_start: new Date(editForm.scheduled_start).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      queryClient.invalidateQueries({ queryKey: ["user-auctions"] });
      toast({ title: "Leilão atualizado!" });
      setEditing(false);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async () => {
      if (!auction) return;
      const newVis = auction.visibility === "public" ? "private" : "public";
      const { error } = await supabase.from("auctions").update({ visibility: newVis, updated_at: new Date().toISOString() }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      queryClient.invalidateQueries({ queryKey: ["user-auctions"] });
      toast({ title: "Visibilidade atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const startEditing = () => {
    if (!auction) return;
    setEditForm({
      title: auction.title,
      description: auction.description || "",
      scheduled_start: auction.scheduled_start.slice(0, 16),
    });
    setEditing(true);
  };

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("auction_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-items", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      toast({ title: "Imóvel removido do leilão" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateItemMutation = useMutation({
    mutationFn: async () => {
      if (!editingItemId) return;
      const item = items?.find((i) => i.id === editingItemId);
      const resolvedTitle =
        editItemForm.title.trim() ||
        (editItemForm.type === "house" ? "Imóvel do leilão" : "Terreno do leilão");
      const resolvedLocation = `${editItemForm.location.trim()}${editItemForm.state_code ? `, ${editItemForm.state_code}` : ""}`;
      const updatedData = {
        title: resolvedTitle,
        type: editItemForm.type === "house" ? "casa" : "terreno",
        location: resolvedLocation,
        state_code: editItemForm.state_code || null,
        estimated_auction_value: parseFloat(editItemForm.estimated_auction_value) || 0,
        estimated_renovation_cost: parseFloat(editItemForm.estimated_renovation_cost) || 0,
        estimated_sale_value: parseFloat(editItemForm.estimated_sale_value) || 0,
        estimated_timeline: editItemForm.estimated_timeline.trim(),
        status: editItemForm.status,
        cover_image_url: editItemForm.coverImage,
        image_url: editItemForm.coverImage,
        gallery_images: editItemForm.galleryImages,
        description: editItemForm.estimated_timeline.trim() || null,
      };
      const { error } = await supabase.from("auction_items").update(updatedData).eq("id", editingItemId);
      if (error) throw error;

      if (item?.property_id) {
        const auctionVal = parseFloat(editItemForm.estimated_auction_value) || 0;
        const renovationVal = parseFloat(editItemForm.estimated_renovation_cost) || 0;
        const saleVal = parseFloat(editItemForm.estimated_sale_value) || 0;
        const totalProjeto = auctionVal + renovationVal;
        const roi = totalProjeto > 0 ? ((saleVal - totalProjeto) / totalProjeto) * 100 : 0;

        const { error: propError } = await supabase.from("properties").update({
          title: resolvedTitle,
          type: editItemForm.type === "house" ? "house" : "land",
          location: resolvedLocation,
          state_code: editItemForm.state_code || null,
          estimated_auction_value: auctionVal,
          estimated_renovation_cost: renovationVal,
          estimated_sale_value: saleVal,
          estimated_return_pct: Math.min(roi, 99999.99),
          estimated_timeline: editItemForm.estimated_timeline.trim(),
          status: editItemForm.status,
          cover_image_url: editItemForm.coverImage,
        }).eq("id", item.property_id);
        if (propError) throw propError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-items", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["user-properties"] });
      toast({ title: "Imóvel atualizado!" });
      setEditingItemId(null);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const startEditingItem = (item: any) => {
    const loc = item.location || "";
    const city = item.state_code ? loc.replace(`, ${item.state_code}`, "").trim() : loc;
    const fallbackTitle = item.title?.trim() || (item.type === "terreno" ? "Terreno do leilão" : "Imóvel do leilão");
    setEditItemForm({
      type: item.type === "terreno" ? "land" : "house",
      title: fallbackTitle,
      location: city,
      state_code: item.state_code || "",
      estimated_auction_value: String(item.estimated_auction_value || ""),
      estimated_renovation_cost: String(item.estimated_renovation_cost || ""),
      estimated_return_pct: "",
      estimated_sale_value: String(item.estimated_sale_value || ""),
      estimated_timeline: item.estimated_timeline || "",
      total_shares: "1",
      share_price: "",
      status: item.status || "available",
      coverImage: item.cover_image_url || item.image_url || null,
      galleryImages: item.gallery_images || [],
    });
    setEditingItemId(item.id);
  };

  const addPropertyMutation = useMutation({
    mutationFn: async () => {
      for (const pForm of newPropertyForms) {
        const { error: itemError } = await supabase.from("auction_items").insert({
          auction_id: id!,
          title: pForm.title.trim(),
          type: pForm.type === "house" ? "casa" : "terreno",
          location: `${pForm.location.trim()}${pForm.state_code ? `, ${pForm.state_code}` : ""}`,
          description: pForm.estimated_timeline.trim() || null,
          image_url: pForm.coverImage,
          state_code: pForm.state_code || null,
          estimated_auction_value: parseFloat(pForm.estimated_auction_value) || 0,
          estimated_renovation_cost: parseFloat(pForm.estimated_renovation_cost) || 0,
          estimated_sale_value: parseFloat(pForm.estimated_sale_value) || 0,
          estimated_timeline: pForm.estimated_timeline.trim(),
          status: pForm.status,
          cover_image_url: pForm.coverImage,
          gallery_images: pForm.galleryImages,
        } as any);
        if (itemError) throw itemError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-items", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      toast({ title: "Imóveis adicionados com sucesso!" });
      setNewPropertyForms([]);
      setShowAddProperty(false);
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (!auction) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {editing ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div>
              <Label>Data e Hora do Leilão *</Label>
              <Input type="datetime-local" value={editForm.scheduled_start} onChange={(e) => setEditForm({ ...editForm, scheduled_start: e.target.value })} />
              {editForm.scheduled_start && (
                <p className="text-xs text-muted-foreground mt-1">
                  Prazo máximo para investimento: {format(new Date(new Date(editForm.scheduled_start).getTime() - 2 * 24 * 60 * 60 * 1000), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })} (2 dias antes)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => updateAuctionMutation.mutate()} disabled={!editForm.title || !editForm.scheduled_start || updateAuctionMutation.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {updateAuctionMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)} className="gap-2">
                <X className="h-4 w-4" /> Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">{auction.title}</h1>
            {auction.status === "finished" ? (
              <Badge variant="secondary">Encerrado</Badge>
            ) : (
              <Badge className="bg-discovery-green text-primary-foreground">Publicado</Badge>
            )}
            {isAdmin && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={startEditing}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          {auction.description && <p className="text-sm text-muted-foreground">{auction.description}</p>}
        </div>
      )}

      {/* Dates */}
      {auction.status !== "finished" && (() => {
        const auctionDate = new Date(auction.scheduled_start);
        const paymentDeadline = new Date(auctionDate.getTime() - 2 * 24 * 60 * 60 * 1000);
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Prazo Máximo para Investimento</p>
              <CountdownTimer targetDate={paymentDeadline.toISOString()} label="Prazo para investir" expiredLabel="Prazo para depósito encerrado!" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {format(paymentDeadline, "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Data do Leilão</p>
              <CountdownTimer targetDate={auction.scheduled_start} label="Leilão começa em" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {format(auctionDate, "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Auction items */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Imóveis / Terrenos</CardTitle>
          {isAdmin && !showAddProperty && auction.status !== "finished" && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddProperty(true)}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {(!items || items.length === 0) && !showAddProperty && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum imóvel vinculado</p>
          )}
          {items && items.length > 0 && (
            <div className="grid gap-3">
              {items.map((item) => editingItemId === item.id ? (
                <div key={item.id} className="space-y-4">
                  <AuctionPropertyForm
                    index={0}
                    data={editItemForm}
                    onChange={setEditItemForm}
                    onRemove={() => setEditingItemId(null)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => updateItemMutation.mutate()}
                      disabled={!editItemForm.title.trim() || updateItemMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                      {updateItemMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingItemId(null)} className="gap-2">
                      <X className="h-4 w-4" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-3 rounded-xl bg-secondary/30 ${item.property_id ? "cursor-pointer hover:bg-secondary/50 transition-colors" : ""}`}
                  onClick={() => {
                    if (isAdmin && item.property_id) navigate(`/painel/imovel/${item.property_id}`);
                  }}
                >
                  {item.image_url ? (
                    <div className="h-16 w-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-16 w-24 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {item.type === "terreno" ? <TreePine className="h-6 w-6 text-primary" /> : <Home className="h-6 w-6 text-primary" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{item.title}</p>
                    {item.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {item.location}
                      </p>
                    )}
                    {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); startEditingItem(item); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {auction.status !== "finished" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeItemMutation.mutate(item.id); }}
                          disabled={removeItemMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add property forms */}
          {showAddProperty && (
            <div className="space-y-4 mt-4 pt-4 border-t border-border/50">
              {newPropertyForms.map((pData, idx) => (
                <AuctionPropertyForm
                  key={idx}
                  index={idx}
                  data={pData}
                  onChange={(updated) => {
                    const copy = [...newPropertyForms];
                    copy[idx] = updated;
                    setNewPropertyForms(copy);
                  }}
                  onRemove={() => setNewPropertyForms((prev) => prev.filter((_, i) => i !== idx))}
                />
              ))}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setNewPropertyForms((prev) => [...prev, { ...emptyPropertyData }])}
                >
                  <Plus className="h-4 w-4" /> Novo Imóvel
                </Button>

                {newPropertyForms.length > 0 && (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => addPropertyMutation.mutate()}
                    disabled={addPropertyMutation.isPending}
                  >
                    <Save className="h-4 w-4" />
                    {addPropertyMutation.isPending ? "Salvando..." : `Salvar ${newPropertyForms.length} imóvel(is)`}
                  </Button>
                )}

                <Button variant="ghost" size="sm" onClick={() => { setShowAddProperty(false); setNewPropertyForms([]); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investor linking (admin, only after auction is finished) */}
      {isAdmin && auction.status === "finished" && items && (
        <AuctionInvestorLinking
          auctionId={auction.id}
          items={items}
        />
      )}
    </div>
  );
}
