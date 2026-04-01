import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Loader2, Home, TreePine, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export interface AuctionPropertyData {
  type: "house" | "land";
  title: string;
  location: string;
  state_code: string;
  estimated_auction_value: string;
  estimated_renovation_cost: string;
  estimated_return_pct: string;
  estimated_sale_value: string;
  estimated_timeline: string;
  doc_commission_rate: string;
  total_shares: string;
  share_price: string;
  status: string;
  coverImage: string | null;
  galleryImages: string[];
}

export const emptyPropertyData: AuctionPropertyData = {
  type: "house",
  title: "",
  location: "",
  state_code: "",
  estimated_auction_value: "",
  estimated_renovation_cost: "",
  estimated_return_pct: "",
  estimated_sale_value: "",
  estimated_timeline: "",
  total_shares: "1",
  share_price: "",
  status: "available",
  coverImage: null,
  galleryImages: [],
};

interface Props {
  index: number;
  data: AuctionPropertyData;
  onChange: (data: AuctionPropertyData) => void;
  onRemove: () => void;
}

export function AuctionPropertyForm({ index, data, onChange, onRemove }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const { rate: docCommissionRate } = useDocCommissionRate();

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
    (parseFloat(data.estimated_auction_value) || 0) +
    (parseFloat(data.estimated_renovation_cost) || 0);

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
    if (url) onChange({ ...data, coverImage: url });
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
    onChange({ ...data, galleryImages: [...data.galleryImages, ...urls] });
    setUploading(false);
  };

  const removeGalleryImage = (idx: number) => {
    onChange({ ...data, galleryImages: data.galleryImages.filter((_, i) => i !== idx) });
  };

  const set = (field: keyof AuctionPropertyData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base">Imóvel {index + 1}</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Type */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange({ ...data, type: "house" })}
            className={`flex-1 py-3 rounded-xl border transition-colors text-sm font-medium ${
              data.type === "house"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            <Home className="h-4 w-4 inline mr-2" />Casa
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...data, type: "land" })}
            className={`flex-1 py-3 rounded-xl border transition-colors text-sm font-medium ${
              data.type === "land"
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
          <Input value={data.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex: Casa em Orlando" />
        </div>

        {/* City & State */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Cidade *</Label>
            <Input value={data.location} onChange={(e) => set("location", e.target.value)} placeholder="Orlando" />
          </div>
          <div className="space-y-2">
            <Label>Estado *</Label>
            <select
              value={data.state_code}
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

        {/* Auction & Renovation Values */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Valor Est. de Arremate ($)</Label>
            <Input type="number" step="0.01" min="0" value={data.estimated_auction_value} onChange={(e) => set("estimated_auction_value", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor Est. de Reforma ($)</Label>
            <Input type="number" step="0.01" min="0" value={data.estimated_renovation_cost} onChange={(e) => set("estimated_renovation_cost", e.target.value)} />
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
            <Label>Valor Est. de Venda ($)</Label>
            <Input type="number" step="0.01" min="0" value={data.estimated_sale_value} onChange={(e) => set("estimated_sale_value", e.target.value)} placeholder="Ex: 350000" />
          </div>
        </div>

        {/* Calculated Return (with doc commission) */}
        <div className="space-y-2">
          <Label>Retorno Estimado (%)</Label>
          <div className="flex items-center h-10 rounded-md border border-input bg-muted/50 px-3 text-sm font-medium">
            {(() => {
              const saleVal = parseFloat(data.estimated_sale_value) || 0;
              const docComm = saleVal * (docCommissionRate / 100);
              const profit = saleVal - totalProjeto - docComm;
              if (totalProjeto > 0 && saleVal > 0) {
                return `${((profit / totalProjeto) * 100).toFixed(1)}%`;
              }
              return "—";
            })()}
          </div>
          <p className="text-xs text-muted-foreground">Calculado: (Venda − Projeto − Doc.&Comissão {docCommissionRate}%) / Projeto</p>
        </div>


        {/* Timeline */}
        <div className="space-y-2">
          <Label>Prazo Estimado</Label>
          <Input value={data.estimated_timeline} onChange={(e) => set("estimated_timeline", e.target.value)} placeholder="Ex: 6 meses" />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <select
            value={data.status}
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
          {data.coverImage ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
              <img src={data.coverImage} alt="Capa" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange({ ...data, coverImage: null })}
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
            {data.galleryImages.map((url, i) => (
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
      </CardContent>
    </Card>
  );
}
