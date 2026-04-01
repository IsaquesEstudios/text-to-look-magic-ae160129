import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Loader2, Home, TreePine, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface PropertyEditFormProps {
  property: {
    id: string;
    type: string;
    title: string;
    location: string;
    state_code: string | null;
    estimated_auction_value: number | null;
    estimated_renovation_cost: number | null;
    estimated_sale_value: number | null;
    estimated_timeline: string | null;
    doc_commission_rate?: number | null;
    status: string;
    cover_image_url: string | null;
  };
  images: { id: string; image_url: string; sort_order: number }[];
  onDone: () => void;
}

export function PropertyEditForm({ property, images, onDone }: PropertyEditFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const docCommissionRate = (property as any).doc_commission_rate ?? 10;

  const [form, setForm] = useState({
    type: property.type as "house" | "land",
    title: property.title,
    location: property.location,
    state_code: property.state_code || "",
    estimated_auction_value: String(property.estimated_auction_value ?? ""),
    estimated_renovation_cost: String(property.estimated_renovation_cost ?? ""),
    estimated_sale_value: String(property.estimated_sale_value ?? ""),
    estimated_timeline: property.estimated_timeline || "",
    doc_commission_rate: String((property as any).doc_commission_rate ?? 10),
    status: property.status,
    coverImage: property.cover_image_url,
    galleryImages: images.map((img) => ({ id: img.id, url: img.image_url })),
    newGalleryImages: [] as string[],
    removedGalleryIds: [] as string[],
  });

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

  const totalProjeto =
    (parseFloat(form.estimated_auction_value) || 0) +
    (parseFloat(form.estimated_renovation_cost) || 0);

  const saleVal = parseFloat(form.estimated_sale_value) || 0;
  const dcRate = parseFloat(form.doc_commission_rate) || 10;
  const docComm = saleVal * (dcRate / 100);
  const returnPct =
    totalProjeto > 0 && saleVal > 0
      ? (((saleVal - totalProjeto - docComm) / totalProjeto) * 100).toFixed(1)
      : "—";

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
    const { data: urlData } = supabase.storage.from("property-media").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    if (url) setForm((f) => ({ ...f, coverImage: url }));
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
    setForm((f) => ({ ...f, newGalleryImages: [...f.newGalleryImages, ...urls] }));
    setUploading(false);
  };

  const validateForm = (): string | null => {
    if (!form.title.trim()) return "O campo 'Título' é obrigatório.";
    if (!form.location.trim()) return "O campo 'Cidade' é obrigatório.";
    if (!form.state_code) return "O campo 'Estado' é obrigatório.";
    const auctionVal = parseFloat(form.estimated_auction_value);
    if (form.estimated_auction_value && isNaN(auctionVal)) return "O campo 'Valor Est. de Arremate' contém um valor inválido.";
    if (auctionVal < 0) return "O campo 'Valor Est. de Arremate' não pode ser negativo.";
    const renovVal = parseFloat(form.estimated_renovation_cost);
    if (form.estimated_renovation_cost && isNaN(renovVal)) return "O campo 'Valor Est. de Reforma' contém um valor inválido.";
    if (renovVal < 0) return "O campo 'Valor Est. de Reforma' não pode ser negativo.";
    const saleVal = parseFloat(form.estimated_sale_value);
    if (form.estimated_sale_value && isNaN(saleVal)) return "O campo 'Valor Est. de Venda' contém um valor inválido.";
    if (saleVal < 0) return "O campo 'Valor Est. de Venda' não pode ser negativo.";
    const total = (auctionVal || 0) + (renovVal || 0);
    if (total > 9999999999.99) return "O 'Total Est. do Projeto' excede o limite máximo permitido ($9,999,999,999.99).";
    const roi = total > 0 ? (((saleVal || 0) - total) / total) * 100 : 0;
    if (Math.abs(roi) > 99999.99) return "O 'Retorno Estimado' excede o limite máximo permitido (99,999.99%).";
    return null;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const validationError = validateForm();
      if (validationError) throw new Error(validationError);

      const auctionVal = parseFloat(form.estimated_auction_value) || 0;
      const renovVal = parseFloat(form.estimated_renovation_cost) || 0;

      const { error } = await supabase
        .from("properties")
        .update({
          type: form.type,
          title: form.title.trim(),
          location: form.location.trim(),
          state_code: form.state_code || null,
          estimated_auction_value: auctionVal,
          estimated_renovation_cost: renovVal,
          purchase_price: auctionVal + renovVal,
          estimated_sale_value: parseFloat(form.estimated_sale_value) || 0,
          estimated_return_pct: (() => {
            const av = auctionVal + renovVal;
            const sv = parseFloat(form.estimated_sale_value) || 0;
            const dc = sv * ((parseFloat(form.doc_commission_rate) || 10) / 100);
            return av > 0 ? Math.min(((sv - av - dc) / av) * 100, 99999.99) : 0;
          })(),
          doc_commission_rate: parseFloat(form.doc_commission_rate) || 10,
          estimated_timeline: form.estimated_timeline.trim(),
          status: form.status,
          cover_image_url: form.coverImage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", property.id);
      if (error) throw error;

      // Remove deleted gallery images
      if (form.removedGalleryIds.length > 0) {
        await supabase.from("property_images").delete().in("id", form.removedGalleryIds);
      }

      // Add new gallery images
      if (form.newGalleryImages.length > 0) {
        const maxSort = form.galleryImages.length;
        await supabase.from("property_images").insert(
          form.newGalleryImages.map((url, i) => ({
            property_id: property.id,
            image_url: url,
            sort_order: maxSort + i,
          }))
        );
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["property-detail", property.id] }),
        queryClient.invalidateQueries({ queryKey: ["property-images", property.id] }),
        queryClient.invalidateQueries({ queryKey: ["admin-properties"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-portfolio-counts"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-properties-kpis"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-terrenos-kpis"] }),
        queryClient.invalidateQueries({ queryKey: ["user-shares-houses"] }),
        queryClient.invalidateQueries({ queryKey: ["user-shares-land"] }),
        queryClient.invalidateQueries({ queryKey: ["auction-items"] }),
      ]);
      toast({ title: "Imóvel atualizado com sucesso!" });
      onDone();
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="pt-6 space-y-5">
        {/* Type */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, type: "house" }))}
            className={`flex-1 py-3 rounded-xl border transition-colors text-sm font-medium ${
              form.type === "house"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            <Home className="h-4 w-4 inline mr-2" />Casa
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, type: "land" }))}
            className={`flex-1 py-3 rounded-xl border transition-colors text-sm font-medium ${
              form.type === "land"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            <TreePine className="h-4 w-4 inline mr-2" />Terreno
          </button>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label>Título *</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>

        {/* City & State */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Cidade *</Label>
            <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Estado *</Label>
            <select
              value={form.state_code}
              onChange={(e) => set("state_code", e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione</option>
              {usStates?.map((s) => (
                <option key={s.state_code} value={s.state_code}>
                  {s.state_name} ({s.state_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Values */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Valor Est. de Arremate ($)</Label>
            <Input type="number" step="0.01" min="0" value={form.estimated_auction_value} onChange={(e) => set("estimated_auction_value", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor Est. de Reforma ($)</Label>
            <Input type="number" step="0.01" min="0" value={form.estimated_renovation_cost} onChange={(e) => set("estimated_renovation_cost", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Total Est. do Projeto ($)</Label>
            <div className="flex items-center h-10 rounded-md border border-input bg-muted/50 px-3 text-sm font-medium">
              {totalProjeto.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Valor Est. de Venda ($)</Label>
            <Input type="number" step="0.01" min="0" value={form.estimated_sale_value} onChange={(e) => set("estimated_sale_value", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Retorno Estimado (%)</Label>
          <div className="flex items-center h-10 rounded-md border border-input bg-muted/50 px-3 text-sm font-medium">
            {returnPct !== "—" ? `${returnPct}%` : "—"}
          </div>
          <p className="text-xs text-muted-foreground">Com Doc.&Comissão de {docCommissionRate}%</p>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <Label>Prazo Estimado</Label>
          <Input value={form.estimated_timeline} onChange={(e) => set("estimated_timeline", e.target.value)} />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
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
          {form.coverImage ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
              <img src={form.coverImage} alt="Capa" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, coverImage: null }))}
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
            {form.galleryImages
              .filter((img) => !form.removedGalleryIds.includes(img.id))
              .map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        removedGalleryIds: [...f.removedGalleryIds, img.id],
                      }))
                    }
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 hover:bg-background"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            {form.newGalleryImages.map((url, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      newGalleryImages: f.newGalleryImages.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 hover:bg-background"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">Adicionar</span>
              <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
            </label>
          </div>
        </div>

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando imagem...
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onDone}>
            Cancelar
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!form.title || !form.location || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
