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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, DollarSign, MapPin, Home, TreePine, Pencil, Save, X, Plus, Trash2, ArrowLeft, ChevronDown, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AuctionPropertyForm, AuctionPropertyData, emptyPropertyData } from "@/components/painel/admin/AuctionPropertyForm";
import AuctionInvestorLinking from "@/components/painel/admin/AuctionInvestorLinking";

function CountdownTimer({ targetDate }: { targetDate: string }) {
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
  }, [targetDate]);

  return (
    <div className={`text-center p-4 rounded-xl ${isStarted ? "bg-destructive/10 text-destructive" : "bg-primary/5 text-primary"}`}>
      <p className="text-xs text-muted-foreground mb-1">
        {isStarted ? "Status" : "Começa em"}
      </p>
      <p className="text-2xl font-bold font-mono tracking-wider">{timeLeft}</p>
    </div>
  );
}

function DepositsAccordion({
  deposits,
  profileMap,
  isAdmin,
  auctionId,
  queryClient,
  toast,
  userId,
}: {
  deposits: any[];
  profileMap: Map<string, string | null>;
  isAdmin: boolean;
  auctionId: string;
  queryClient: any;
  toast: any;
  userId?: string;
}) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Group deposits by user
  const grouped = useMemo(() => {
    const map = new Map<string, typeof deposits>();
    deposits.forEach((d) => {
      const list = map.get(d.user_id) ?? [];
      list.push(d);
      map.set(d.user_id, list);
    });
    // Sort by total deposited desc
    return [...map.entries()]
      .map(([uid, deps]) => ({
        userId: uid,
        name: profileMap.get(uid) || "Usuário",
        deposits: deps,
        total: deps.reduce((s: number, d: any) => s + Number(d.amount), 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [deposits, profileMap]);

  const handleRefund = async (depId: string, amount: number, userName: string) => {
    if (!confirm(`Estornar $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} para ${userName}?`)) return;
    const { error } = await supabase.rpc("refund_auction_deposit", { p_deposit_id: depId });
    if (error) {
      toast({ title: "Erro ao estornar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Depósito estornado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["auction-deposits", auctionId] });
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Depósitos ({deposits.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {grouped.map((group) => {
          const isExpanded = expandedUser === group.userId;
          const hasMultiple = group.deposits.length > 1;

          return (
            <div key={group.userId} className="rounded-xl border border-border/50 overflow-hidden">
              {/* User header row */}
              <button
                type="button"
                onClick={() => hasMultiple && setExpandedUser(isExpanded ? null : group.userId)}
                className={`w-full flex items-center gap-3 p-3 sm:p-4 text-left transition-colors ${hasMultiple ? "hover:bg-secondary/40 cursor-pointer" : "cursor-default"}`}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {isAdmin ? group.name : (group.userId === userId ? "Você" : group.name)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {group.deposits.length} depósito{group.deposits.length > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="font-bold text-sm text-foreground">
                  ${group.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                {hasMultiple && (
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                )}
              </button>

              {/* Expanded deposits */}
              {isExpanded && hasMultiple && (
                <div className="border-t border-border/30 bg-secondary/20">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-10 text-xs">#</TableHead>
                        <TableHead className="text-xs">Valor</TableHead>
                        <TableHead className="text-xs">Data</TableHead>
                        {isAdmin && <TableHead className="w-20 text-xs"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.deposits.map((dep: any, idx: number) => (
                        <TableRow key={dep.id}>
                          <TableCell className="font-mono text-muted-foreground text-xs">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-sm">${Number(dep.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {format(new Date(dep.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-destructive hover:text-destructive"
                                onClick={() => handleRefund(dep.id, Number(dep.amount), group.name)}
                              >
                                Estornar
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Single deposit - show inline without accordion */}
              {!hasMultiple && (
                <div className="border-t border-border/30 bg-secondary/20 px-4 py-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {format(new Date(group.deposits[0].created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleRefund(group.deposits[0].id, Number(group.deposits[0].amount), group.name)}
                    >
                      Estornar
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
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

  // Admin: fetch all users with credits for linking
  const { data: usersWithCredits } = useQuery({
    queryKey: ["users-with-credits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, credits")
        .gt("credits", 0)
        .order("credits", { ascending: false });
      if (error) throw error;
      // Filter out admin users
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminIds = new Set(adminRoles?.map((r) => r.user_id) ?? []);
      return data.filter((p) => !adminIds.has(p.user_id));
    },
    enabled: isAdmin,
  });

  const [selectedUserId, setSelectedUserId] = useState("");
  const [linkRawAmount, setLinkRawAmount] = useState(0);
  const [linkDisplayAmount, setLinkDisplayAmount] = useState("");

  const adminDepositMutation = useMutation({
    mutationFn: async () => {
      const amount = linkRawAmount / 100;
      if (isNaN(amount) || amount < 800) throw new Error("O valor mínimo é $800");

      const { error } = await supabase.rpc("admin_create_auction_deposit", {
        p_auction_id: id!,
        p_user_id: selectedUserId,
        p_amount: amount,
        p_auction_title: auction?.title || "",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auction-deposits", id] });
      queryClient.invalidateQueries({ queryKey: ["users-with-credits"] });
      queryClient.invalidateQueries({ queryKey: ["investment-kpis"] });
      toast({ title: "Investidor vinculado com sucesso!" });
      setSelectedUserId("");
      setLinkRawAmount(0);
      setLinkDisplayAmount("");
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


  if (!auction) {
    return <div className="animate-pulse text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
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
        <CountdownTimer targetDate={auction.scheduled_start} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Depositado</p>
            <p className="text-xl font-bold text-foreground">${totalDeposited.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Depósitos</p>
            <p className="text-xl font-bold text-foreground">{deposits?.length ?? 0}</p>
          </CardContent>
        </Card>
        {!isAdmin && (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Meu Total</p>
              <p className="text-xl font-bold text-primary">${myTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Admin: Link investor to auction */}
      {isAdmin && !isFinished && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-discovery-green" />
              Vincular Investidor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/40 p-3 space-y-1.5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground text-sm">Regras de Participação</p>
              <p>• Valor mínimo: <span className="font-semibold text-foreground">$800</span></p>
              <p>• <span className="font-semibold text-foreground">$800 – $10.999</span> → Terreno (taxa: <span className="font-semibold text-foreground">$500</span>)</p>
              <p>• <span className="font-semibold text-foreground">$11.000+</span> → Casa (taxa: <span className="font-semibold text-foreground">$5.000</span>)</p>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">Investidor</Label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecione um investidor</option>
                {usersWithCredits?.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.full_name || "Usuário"} — Saldo: ${Number(u.credits).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">Valor do depósito</Label>
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

            {/* Dynamic feedback */}
            {(() => {
              const amt = linkRawAmount / 100;
              if (amt <= 0) return null;
              if (amt < 800) return <p className="text-xs text-destructive">O valor mínimo é $800.</p>;
              const isCasa = amt >= 11000;
              const taxa = isCasa ? 5000 : 500;
              const categoria = isCasa ? "Casa" : "Terreno";
              return (
                <div className="rounded-lg border border-border/50 bg-secondary/30 p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria</span>
                    <Badge variant="outline" className="text-xs gap-1">
                      {isCasa ? <Home className="h-3 w-3" /> : <TreePine className="h-3 w-3" />} {categoria}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa inclusa</span>
                    <span className="font-semibold">${taxa.toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor líquido</span>
                    <span className="font-semibold text-foreground">${(amt - taxa).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })()}

            <Button
              onClick={() => adminDepositMutation.mutate()}
              disabled={!selectedUserId || linkRawAmount / 100 < 800 || adminDepositMutation.isPending}
              className="w-full bg-discovery-green hover:bg-discovery-green/90 text-primary-foreground"
            >
              {adminDepositMutation.isPending ? "Processando..." : "Vincular Investidor"}
            </Button>
          </CardContent>
        </Card>
      )}

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
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-3 rounded-xl bg-secondary/30 ${isAdmin && item.property_id ? "cursor-pointer hover:bg-secondary/50 transition-colors" : ""}`}
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
                  {isAdmin && auction.status !== "finished" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); removeItemMutation.mutate(item.id); }}
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

      {/* Deposits list - grouped by user with accordion */}
      {deposits && deposits.length > 0 && (
        <DepositsAccordion
          deposits={deposits}
          profileMap={profileMap}
          isAdmin={isAdmin}
          auctionId={id!}
          queryClient={queryClient}
          toast={toast}
          userId={user?.id}
        />
      )}
    </div>
  );
}
