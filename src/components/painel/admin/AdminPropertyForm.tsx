import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Upload, X, Loader2, UserPlus, Trash2, AlertTriangle } from "lucide-react";

interface Props {
  propertyId: string | null;
  onClose: () => void;
}

interface InvestorToLink {
  userId: string;
  rawAmount: number;
  displayAmount: string;
}

function formatUSD(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getServiceFee(type: string): number {
  return type === "land" || type === "terreno" ? 500 : 5000;
}

export function AdminPropertyForm({ propertyId, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    type: "house" as "house" | "land",
    title: "",
    location: "",
    state_code: "",
    total_shares: "",
    share_price: "",
    status: "available",
    estimated_auction_value: "",
    estimated_renovation_cost: "",
    estimated_return_pct: "",
    estimated_sale_value: "",
    estimated_timeline: "",
  });

  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Investor linking state (only for new properties)
  const [investorsToLink, setInvestorsToLink] = useState<InvestorToLink[]>([]);
  const [showAddInvestor, setShowAddInvestor] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [linkRawAmount, setLinkRawAmount] = useState(0);
  const [linkDisplayAmount, setLinkDisplayAmount] = useState("");

  const { data: usStates } = useQuery({
    queryKey: ["us-states"],
    queryFn: async () => {
      const { data } = await supabase
        .from("us_state_taxes")
        .select("state_code, state_name")
        .order("state_name");
      return data ?? [];
    },
  });

  // Fetch investors with credits (only when not editing)
  const { data: investorsWithCredits } = useQuery({
    queryKey: ["investors-with-credits-form"],
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
    enabled: !propertyId,
  });

  const totalProjeto =
    (parseFloat(form.estimated_auction_value) || 0) +
    (parseFloat(form.estimated_renovation_cost) || 0);

  const serviceFee = getServiceFee(form.type);

  // Calculate already-added amounts per investor
  const totalLinked = investorsToLink.reduce((s, inv) => s + inv.rawAmount / 100, 0);
  const remaining = totalProjeto - totalLinked;

  // Build a map of credits already "reserved" by pending links
  const reservedCredits = new Map<string, number>();
  for (const inv of investorsToLink) {
    const amount = inv.rawAmount / 100;
    const fee = totalProjeto > 0 ? Math.min(Math.round((amount / totalProjeto) * serviceFee * 100) / 100, serviceFee) : 0;
    reservedCredits.set(inv.userId, (reservedCredits.get(inv.userId) ?? 0) + amount + fee);
  }

  const getAvailableCredits = (userId: string) => {
    const inv = investorsWithCredits?.find((i) => i.user_id === userId);
    if (!inv) return 0;
    return Number(inv.credits) - (reservedCredits.get(userId) ?? 0);
  };

  // Current link preview
  const currentAmount = linkRawAmount / 100;
  const currentFeeShare = totalProjeto > 0 ? Math.min(Math.round((currentAmount / totalProjeto) * serviceFee * 100) / 100, serviceFee) : 0;
  const currentTotalDeduction = currentAmount + currentFeeShare;
  const selectedAvailableCredits = getAvailableCredits(selectedUserId);

  const maxLinkableByCredits = totalProjeto > 0
    ? Math.floor((selectedAvailableCredits / (1 + serviceFee / totalProjeto)) * 100) / 100
    : selectedAvailableCredits;
  const maxLinkable = maxLinkableByCredits;

  const addInvestorToList = () => {
    if (!selectedUserId || currentAmount <= 0) return;
    setInvestorsToLink((prev) => [...prev, { userId: selectedUserId, rawAmount: linkRawAmount, displayAmount: linkDisplayAmount }]);
    setSelectedUserId("");
    setLinkRawAmount(0);
    setLinkDisplayAmount("");
    setShowAddInvestor(false);
  };

  const removeInvestorFromList = (index: number) => {
    setInvestorsToLink((prev) => prev.filter((_, i) => i !== index));
  };

  // Load existing property
  useEffect(() => {
    if (!propertyId) return;
    const load = async () => {
      const [propRes, imgRes] = await Promise.all([
        supabase.from("properties").select("*").eq("id", propertyId).maybeSingle(),
        supabase.from("property_images").select("*").eq("property_id", propertyId).order("sort_order"),
      ]);

      if (propRes.data) {
        const p = propRes.data;
        setForm({
          type: p.type as "house" | "land",
          title: p.title,
          location: p.location,
          state_code: p.state_code ?? "",
          total_shares: String(p.total_shares),
          share_price: String(p.share_price),
          status: p.status,
          estimated_auction_value: String(p.estimated_auction_value ?? 0),
          estimated_renovation_cost: String(p.estimated_renovation_cost ?? 0),
          estimated_return_pct: String(p.estimated_return_pct ?? 0),
          estimated_sale_value: String(p.estimated_sale_value ?? 0),
          estimated_timeline: p.estimated_timeline ?? "",
        });
        setCoverImage(p.cover_image_url);
      }

      if (imgRes.data) {
        setGalleryImages(imgRes.data.map((i) => i.image_url));
      }
    };
    load();
  }, [propertyId]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("property-media")
      .upload(path, file, { contentType: file.type });
    if (error) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("property-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    if (url) setCoverImage(url);
    setUploading(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    setGalleryImages((prev) => [...prev, ...urls]);
    setUploading(false);
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
    queryClient.invalidateQueries({ queryKey: ["admin-portfolio-counts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-properties-kpis"] });
    queryClient.invalidateQueries({ queryKey: ["investors-with-credits-form"] });
    queryClient.invalidateQueries({ queryKey: ["investors-with-credits-linking"] });
    queryClient.invalidateQueries({ queryKey: ["property-investors"] });
    queryClient.invalidateQueries({ queryKey: ["user-shares-houses"] });
    queryClient.invalidateQueries({ queryKey: ["user-shares-land"] });
    queryClient.invalidateQueries({ queryKey: ["investment-kpis"] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const saleValue = parseFloat(form.estimated_sale_value) || 0;
      const calculatedReturn = totalProjeto > 0 ? ((saleValue - totalProjeto) / totalProjeto) * 100 : 0;

      const propertyData = {
        type: form.type,
        title: form.title.trim(),
        location: form.location.trim(),
        state_code: form.state_code || null,
        purchase_price: totalProjeto,
        estimated_return_pct: Math.round(calculatedReturn * 10) / 10,
        total_shares: parseInt(form.total_shares) || 1,
        share_price: parseFloat(form.share_price) || 0,
        available_shares: parseInt(form.total_shares) || 1,
        status: form.status,
        cover_image_url: coverImage,
        created_by: user.id,
        estimated_auction_value: parseFloat(form.estimated_auction_value) || 0,
        estimated_renovation_cost: parseFloat(form.estimated_renovation_cost) || 0,
        estimated_sale_value: saleValue,
        estimated_timeline: form.estimated_timeline.trim(),
      };

      let propId = propertyId;

      if (propertyId) {
        const { error } = await supabase
          .from("properties")
          .update(propertyData)
          .eq("id", propertyId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("properties")
          .insert(propertyData)
          .select("id")
          .single();
        if (error) throw error;
        propId = data.id;
      }

      // Sync gallery images
      if (propId) {
        await supabase.from("property_images").delete().eq("property_id", propId);
        if (galleryImages.length > 0) {
          await supabase.from("property_images").insert(
            galleryImages.map((url, i) => ({
              property_id: propId!,
              image_url: url,
              sort_order: i,
            }))
          );
        }
      }

      // Link investors (only for new properties)
      if (propId && !propertyId && investorsToLink.length > 0) {
        for (const inv of investorsToLink) {
          const amount = inv.rawAmount / 100;
          const { error } = await supabase.rpc("admin_link_investor_to_property" as any, {
            p_property_id: propId,
            p_user_id: inv.userId,
            p_amount: amount,
            p_property_type: form.type,
            p_property_title: form.title.trim(),
          });
          if (error) {
            toast({
              title: "Erro ao vincular investidor",
              description: error.message,
              variant: "destructive",
            });
          }
        }
      }

      toast({ title: propertyId ? "Imóvel atualizado!" : "Imóvel criado!" });
      invalidateAll();
      onClose();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const availableInvestors = (investorsWithCredits ?? []).filter((inv) => getAvailableCredits(inv.user_id) > 0);

  return (
    <div className="space-y-6">
      <button
        onClick={onClose}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>{propertyId ? "Editar Imóvel" : "Novo Imóvel"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "house" })}
                  className={`flex-1 py-3 rounded-xl border transition-colors text-sm font-medium ${
                    form.type === "house"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  🏠 Casa
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "land" })}
                  className={`flex-1 py-3 rounded-xl border transition-colors text-sm font-medium ${
                    form.type === "land"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  🌳 Terreno
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Casa em Orlando"
                required
                maxLength={200}
              />
            </div>

            {/* City & State */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Cidade</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Orlando"
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <select
                  id="state"
                  value={form.state_code}
                  onChange={(e) => setForm({ ...form, state_code: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Selecione o estado</option>
                  {usStates?.map((s) => (
                    <option key={s.state_code} value={s.state_code}>
                      {s.state_name} ({s.state_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auction & Renovation Values */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="auctionValue">Valor Est. de Arremate ($)</Label>
                <Input
                  id="auctionValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.estimated_auction_value}
                  onChange={(e) => setForm({ ...form, estimated_auction_value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renovationCost">Valor Est. de Reforma ($)</Label>
                <Input
                  id="renovationCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.estimated_renovation_cost}
                  onChange={(e) => setForm({ ...form, estimated_renovation_cost: e.target.value })}
                />
              </div>
            </div>

            {/* Total + Sale Value */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Total Est. do Projeto ($)</Label>
                <div className="flex items-center h-10 rounded-md border border-input bg-muted/50 px-3 text-sm font-medium">
                  {totalProjeto.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Arremate + Reforma</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleValue">Valor Est. de Venda ($)</Label>
                <Input
                  id="saleValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.estimated_sale_value}
                  onChange={(e) => setForm({ ...form, estimated_sale_value: e.target.value })}
                  placeholder="Ex: 350000"
                />
              </div>
            </div>

            {/* Calculated Return */}
            <div className="space-y-2">
              <Label>Retorno Estimado (%)</Label>
              <div className="flex items-center h-10 rounded-md border border-input bg-muted/50 px-3 text-sm font-medium">
                {totalProjeto > 0 && parseFloat(form.estimated_sale_value) > 0
                  ? `${(((parseFloat(form.estimated_sale_value) - totalProjeto) / totalProjeto) * 100).toFixed(1)}%`
                  : "—"}
              </div>
              <p className="text-xs text-muted-foreground">Calculado: (Valor de Venda − Total do Projeto) / Total do Projeto</p>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <Label htmlFor="timeline">Prazo Estimado</Label>
              <Input
                id="timeline"
                value={form.estimated_timeline}
                onChange={(e) => setForm({ ...form, estimated_timeline: e.target.value })}
                placeholder="Ex: 6 meses"
              />
            </div>

            {/* ===== Investor Linking Section (only for new properties) ===== */}
            {!propertyId && (
              <div className="space-y-3 rounded-xl border border-border/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold">Vincular Investidores</Label>
                  </div>
                  {totalProjeto > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Falta: <span className="font-semibold text-foreground">${formatUSD(Math.max(remaining, 0))}</span> de ${formatUSD(totalProjeto)}
                    </span>
                  )}
                </div>

                {/* Service fee info */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Taxa de serviço: <span className="font-semibold text-foreground">${formatUSD(serviceFee)}</span>
                    {" "}({form.type === "land" ? "terreno" : "casa"}) — proporcional ao valor vinculado
                  </span>
                </div>

                {/* Progress bar */}
                {totalProjeto > 0 && totalLinked > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Vinculado: ${formatUSD(totalLinked)}</span>
                      <span>Total: ${formatUSD(totalProjeto)}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min((totalLinked / totalProjeto) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Listed investors to link */}
                {investorsToLink.length > 0 && (
                  <div className="space-y-1.5">
                    {investorsToLink.map((inv, idx) => {
                      const profile = investorsWithCredits?.find((p) => p.user_id === inv.userId);
                      const amount = inv.rawAmount / 100;
                      const fee = totalProjeto > 0 ? Math.min(Math.round((amount / totalProjeto) * serviceFee * 100) / 100, serviceFee) : 0;
                      const pct = totalProjeto > 0 ? ((amount / totalProjeto) * 100).toFixed(1) : "0";

                      return (
                        <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/20 text-sm">
                          <div>
                            <span className="font-medium">{profile?.full_name || "Usuário"}</span>
                            <span className="text-muted-foreground ml-2">({pct}%)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-semibold">${formatUSD(amount)}</p>
                              <p className="text-[10px] text-amber-500">Taxa: ${formatUSD(fee)}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeInvestorFromList(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add investor form */}
                {showAddInvestor ? (
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Investidor</label>
                      <select
                        value={selectedUserId}
                        onChange={(e) => { setSelectedUserId(e.target.value); setLinkRawAmount(0); setLinkDisplayAmount(""); }}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Selecione um investidor</option>
                        {availableInvestors.map((inv) => (
                          <option key={inv.user_id} value={inv.user_id}>
                            {inv.full_name || "Usuário"} — Saldo: ${formatUSD(getAvailableCredits(inv.user_id))}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedUserId && (
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
                    )}

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
                            Taxa proporcional ({totalProjeto > 0 ? Math.min((currentAmount / totalProjeto) * 100, 100).toFixed(1) : 0}% de ${formatUSD(serviceFee)})
                          </span>
                          <span className="font-semibold text-amber-500">${formatUSD(currentFeeShare)}</span>
                        </div>
                        <div className="border-t border-border/50 pt-1.5 flex justify-between">
                          <span className="font-medium text-foreground">Total debitado</span>
                          <span className="font-bold text-foreground">${formatUSD(currentTotalDeduction)}</span>
                        </div>
                        {currentTotalDeduction > selectedAvailableCredits && (
                          <p className="text-destructive font-medium mt-1">
                            ⚠ Saldo insuficiente (disponível: ${formatUSD(selectedAvailableCredits)})
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2"
                        disabled={
                          !selectedUserId ||
                          currentAmount <= 0 ||
                          currentAmount > remaining ||
                          currentTotalDeduction > selectedAvailableCredits ||
                          totalProjeto <= 0
                        }
                        onClick={addInvestorToList}
                      >
                        <UserPlus className="h-4 w-4" />
                        Adicionar
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAddInvestor(false); setSelectedUserId(""); setLinkRawAmount(0); setLinkDisplayAmount(""); }}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 w-full"
                    onClick={() => setShowAddInvestor(true)}
                  >
                    <UserPlus className="h-4 w-4" /> Vincular Investidor
                  </Button>
                )}
              </div>
            )}

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="available">Disponível</option>
                <option value="auctioned">Arrematado</option>
                <option value="waiting_permit">Aguardando Alvará</option>
                <option value="renovation_in_progress">Reforma em Andamento</option>
                <option value="for_sale">À Venda</option>
                <option value="under_contract">Sob Contrato</option>
                <option value="sold">Vendido</option>
              </select>
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Foto de Capa</Label>
              {coverImage ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
                  <img src={coverImage} alt="Capa" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverImage(null)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Clique para enviar</span>
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Gallery */}
            <div className="space-y-2">
              <Label>Galeria de Fotos</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {galleryImages.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(i)}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 hover:bg-background"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Adicionar</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando imagem...
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" variant="cta" className="flex-1" disabled={loading || uploading}>
                {loading && <Loader2 className="animate-spin" />}
                {propertyId ? "Salvar Alterações" : "Criar Imóvel"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
