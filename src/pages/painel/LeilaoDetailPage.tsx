import { useState, useEffect } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, DollarSign, MapPin, Home, TreePine, Pencil, Save, X, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AuctionPropertyForm, AuctionPropertyData, emptyPropertyData } from "@/components/painel/admin/AuctionPropertyForm";
import AuctionInvestorLinking from "@/components/painel/admin/AuctionInvestorLinking";

function CountdownTimer({ targetDate, onFinished }: { targetDate: string; onFinished?: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Leilão encerrado!");
        setIsStarted(true);
        onFinished?.();
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
  }, [targetDate, onFinished]);

  return (
    <div className={`text-center p-4 rounded-xl ${isStarted ? "bg-destructive/10 text-destructive" : "bg-primary/5 text-primary"}`}>
      <p className="text-xs text-muted-foreground mb-1">
        {isStarted ? "Status" : "Começa em"}
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
  const [depositAmount, setDepositAmount] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", scheduled_start: "" });
  const [newPropertyForms, setNewPropertyForms] = useState<AuctionPropertyData[]>([]);
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

  const { data: deposits } = useQuery({
    queryKey: ["auction-deposits", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("auction_deposits").select("*").eq("auction_id", id!).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Admin: fetch profiles for deposit users
  const depositUserIds = [...new Set(deposits?.map((d) => d.user_id) ?? [])];
  const { data: depositProfiles } = useQuery({
    queryKey: ["deposit-profiles", depositUserIds],
    queryFn: async () => {
      if (depositUserIds.length === 0) return [];
      const { data, error } = await supabase.from("profiles").select("user_id, full_name").in("user_id", depositUserIds);
      if (error) throw error;
      return data;
    },
    enabled: isAdmin && depositUserIds.length > 0,
  });

  const depositMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Valor inválido");
      if (profile && amount > profile.credits) throw new Error("Créditos insuficientes");

      const { error } = await supabase.from("auction_deposits").insert({
        auction_id: id!,
        user_id: user!.id,
        amount,
      });
      if (error) throw error;

      // Deduct credits
      const { error: creditError } = await supabase
        .from("profiles")
        .update({ credits: (profile?.credits ?? 0) - amount })
        .eq("user_id", user!.id);
      if (creditError) throw creditError;

      // Log the transaction
      await supabase.from("credit_transactions").insert({
        user_id: user!.id,
        amount: -amount,
        type: "deposit",
        description: `Depósito no leilão: ${auction?.title}`,
        created_by: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-deposits", id] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast({ title: "Depósito realizado com sucesso!" });
      setDepositAmount("");
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const profileMap = new Map(depositProfiles?.map((p) => [p.user_id, p.full_name]) ?? []);
  const totalDeposited = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) ?? 0;
  const myDeposits = deposits?.filter((d) => d.user_id === user?.id) ?? [];
  const myTotal = myDeposits.reduce((sum, d) => sum + Number(d.amount), 0);

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
      toast({ title: "Leilão atualizado!" });
      setEditing(false);
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
      toast({ title: "Imóvel removido do leilão" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const addPropertyMutation = useMutation({
    mutationFn: async () => {
      for (const pForm of newPropertyForms) {
        const totalProjeto = (parseFloat(pForm.estimated_auction_value) || 0) + (parseFloat(pForm.estimated_renovation_cost) || 0);

        const { data: prop, error: propError } = await supabase
          .from("properties")
          .insert({
            type: pForm.type,
            title: pForm.title.trim(),
            location: pForm.location.trim(),
            state_code: pForm.state_code || null,
            purchase_price: totalProjeto,
            estimated_auction_value: parseFloat(pForm.estimated_auction_value) || 0,
            estimated_renovation_cost: parseFloat(pForm.estimated_renovation_cost) || 0,
            estimated_return_pct: parseFloat(pForm.estimated_return_pct) || 0,
            estimated_sale_value: parseFloat(pForm.estimated_sale_value) || 0,
            total_shares: parseInt(pForm.total_shares) || 1,
            share_price: parseFloat(pForm.share_price) || 0,
            available_shares: parseInt(pForm.total_shares) || 1,
            status: pForm.status,
            cover_image_url: pForm.coverImage,
            estimated_timeline: pForm.estimated_timeline.trim(),
            created_by: user!.id,
          })
          .select("id")
          .single();
        if (propError) throw propError;

        if (pForm.galleryImages.length > 0) {
          await supabase.from("property_images").insert(
            pForm.galleryImages.map((url, i) => ({
              property_id: prop.id,
              image_url: url,
              sort_order: i,
            }))
          );
        }

        const { error: itemError } = await supabase.from("auction_items").insert({
          auction_id: id!,
          property_id: prop.id,
          title: pForm.title.trim(),
          type: pForm.type === "house" ? "casa" : "terreno",
          location: `${pForm.location.trim()}${pForm.state_code ? `, ${pForm.state_code}` : ""}`,
          description: pForm.estimated_timeline.trim() || null,
          image_url: pForm.coverImage,
        });
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

  const isFinished = auction?.status === "finished" || (auction && new Date(auction.scheduled_start) <= new Date());
  const isActive = !isFinished && (auction?.status === "active" || (auction?.status === "upcoming" && new Date(auction.scheduled_start) <= new Date()));
  const canDeposit = !isAdmin && !isFinished;

  const handleAutoFinish = async () => {
    if (!auction || auction.status === "finished") return;
    await supabase.from("auctions").update({ status: "finished", updated_at: new Date().toISOString() }).eq("id", auction.id);
    queryClient.invalidateQueries({ queryKey: ["auction", id] });
  };

  if (!auction) {
    return <div className="animate-pulse text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {editing ? (
        <Card>
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
              <Label>Data e Hora de Início *</Label>
              <Input type="datetime-local" value={editForm.scheduled_start} onChange={(e) => setEditForm({ ...editForm, scheduled_start: e.target.value })} />
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
            ) : isActive ? (
              <Badge className="bg-discovery-green text-primary-foreground">Ativo</Badge>
            ) : (
              <Badge variant="outline">Publicado</Badge>
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

      {/* Countdown */}
      {auction.status !== "finished" && (
        <CountdownTimer targetDate={auction.scheduled_start} onFinished={handleAutoFinish} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Depositado</p>
            <p className="text-xl font-bold text-foreground">${totalDeposited.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Depósitos</p>
            <p className="text-xl font-bold text-foreground">{deposits?.length ?? 0}</p>
          </CardContent>
        </Card>
        {!isAdmin && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Meu Total</p>
              <p className="text-xl font-bold text-primary">${myTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Deposit form (users only, when active) */}
      {canDeposit && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-discovery-green" />
              Depositar no Leilão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Saldo disponível: <span className="font-semibold text-foreground">${(profile?.credits ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </p>
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="Valor em USD"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="0"
                step="0.01"
              />
              <Button
                onClick={() => depositMutation.mutate()}
                disabled={!depositAmount || depositMutation.isPending}
                className="bg-discovery-green hover:bg-discovery-green/90 text-primary-foreground flex-shrink-0"
              >
                {depositMutation.isPending ? "..." : "Depositar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auction items */}
      <Card>
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
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30">
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
                  {isAdmin && auction.status !== "finished" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive flex-shrink-0"
                      onClick={() => removeItemMutation.mutate(item.id)}
                      disabled={removeItemMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

      {/* Investor linking (admin, finished auctions) */}
      {isAdmin && auction.status === "finished" && items && deposits && deposits.length > 0 && (
        <AuctionInvestorLinking
          auctionId={auction.id}
          items={items}
          deposits={deposits}
          profileMap={profileMap}
        />
      )}

      {/* Deposits list */}
      {deposits && deposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Depósitos ({deposits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  {isAdmin && <TableHead>Investidor</TableHead>}
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.map((dep, idx) => (
                  <TableRow key={dep.id}>
                    <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                    {isAdmin && (
                      <TableCell className="font-medium">{profileMap.get(dep.user_id) || "Usuário"}</TableCell>
                    )}
                    <TableCell className="font-semibold">${Number(dep.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(dep.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
