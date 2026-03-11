import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";

interface Props {
  propertyId: string | null;
  onClose: () => void;
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

  // Fetch US states for dropdown
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

  // Computed total
  const totalProjeto =
    (parseFloat(form.estimated_auction_value) || 0) +
    (parseFloat(form.estimated_renovation_cost) || 0);

  // Load existing property
  useEffect(() => {
    if (!propertyId) return;
    const load = async () => {
      const [propRes, imgRes] = await Promise.all([
        supabase.from("properties").select("*").eq("id", propertyId).maybeSingle(),
        supabase
          .from("property_images")
          .select("*")
          .eq("property_id", propertyId)
          .order("sort_order"),
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
        total_shares: parseInt(form.total_shares),
        share_price: parseFloat(form.share_price),
        available_shares: parseInt(form.total_shares),
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

      toast({ title: propertyId ? "Imóvel atualizado!" : "Imóvel criado!" });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      onClose();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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

            {/* Total do Projeto (computed) + Return % */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Total Est. do Projeto ($)</Label>
                <div className="flex items-center h-10 rounded-md border border-input bg-muted/50 px-3 text-sm font-medium">
                  {totalProjeto.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Arremate + Reforma</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnPct">Retorno Estimado (%)</Label>
                <Input
                  id="returnPct"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.estimated_return_pct}
                  onChange={(e) => setForm({ ...form, estimated_return_pct: e.target.value })}
                  placeholder="Ex: 30"
                />
                {totalProjeto > 0 && parseFloat(form.estimated_return_pct) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Valor de mercado: ${(totalProjeto * (1 + (parseFloat(form.estimated_return_pct) || 0) / 100)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>

            {/* Shares */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totalShares">Quantidade de Cotas</Label>
                <Input
                  id="totalShares"
                  type="number"
                  min="1"
                  value={form.total_shares}
                  onChange={(e) => setForm({ ...form, total_shares: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sharePrice">Preço por Cota ($)</Label>
                <Input
                  id="sharePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.share_price}
                  onChange={(e) => setForm({ ...form, share_price: e.target.value })}
                  required
                />
              </div>
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
