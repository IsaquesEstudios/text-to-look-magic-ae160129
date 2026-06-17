import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePanelTranslation } from "@/hooks/usePanelTranslation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Upload, X, Loader2, UserPlus, Trash2 } from "lucide-react";
import { LinkInvestorDialog, type ManualFees } from "@/components/painel/admin/LinkInvestorDialog";

interface Props {
  propertyId: string | null;
  onClose: () => void;
}

interface InvestorToLink {
  userId: string;
  rawAmount: number;
  displayAmount: string;
  fees: ManualFees;
}

const MAX_PROPERTY_AMOUNT = 9_999_999_999.99;
const MAX_PROPERTY_ROI = 99_999.99;

const currencySchema = z.coerce.number().min(0).max(MAX_PROPERTY_AMOUNT);

const propertyFormSchema = z.object({
  type: z.enum(["house", "land"]),
  title: z.string().trim().min(1).max(200),
  location: z.string().trim().min(1).max(200),
  state_code: z.string().trim().min(1).max(10),
  total_shares: z.coerce.number().int().min(1).max(1_000_000).default(1),
  share_price: currencySchema.default(0),
  status: z.string().trim().min(1).max(50),
  estimated_auction_value: currencySchema.default(0),
  estimated_renovation_cost: currencySchema.default(0),
  estimated_sale_value: currencySchema.default(0),
  estimated_timeline: z.string().trim().max(100).default(""),
});

function formatUSD(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMaskedUSD(display: string): number {
  const clean = display.replace(/[^0-9]/g, "");
  return clean ? parseInt(clean, 10) / 100 : 0;
}

function maskUSDInput(raw: string): string {
  const clean = raw.replace(/[^0-9]/g, "");
  const num = clean ? parseInt(clean, 10) : 0;
  return (num / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function investorEntryFees(fees: ManualFees): number {
  return Math.round((fees.feeService + fees.feeRenovation + fees.feeSales) * 100) / 100;
}

export function AdminPropertyForm({ propertyId, onClose }: Props) {
  const { user } = useAuth();
  const { p } = usePanelTranslation();
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
    status: "auctioned",
    estimated_auction_value: "",
    estimated_renovation_cost: "",
    estimated_return_pct: "",
    estimated_sale_value: "",
    estimated_timeline: "",
    doc_commission_rate: "10",
  });

  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Investor linking state (only for new properties)
  const [investorsToLink, setInvestorsToLink] = useState<InvestorToLink[]>([]);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  // Wizard step state
  const [step, setStep] = useState(1);
  const totalSteps = propertyId ? 2 : 3;

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
        .eq("status", "approved")
        .order("full_name");
      if (error) throw error;
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminIds = new Set(adminRoles?.map((r) => r.user_id) ?? []);
      return data.filter((profile) => !adminIds.has(profile.user_id));
    },
    enabled: !propertyId,
  });

  const auctionValue = parseMaskedUSD(form.estimated_auction_value);
  const renovationCost = parseMaskedUSD(form.estimated_renovation_cost);
  const totalProjeto = auctionValue + renovationCost;
  const hasInvestors = investorsToLink.length > 0;
  const totalProjetoComTaxas = totalProjeto;

  // Calculate already-added amounts per investor
  const totalLinked = investorsToLink.reduce((sum, investor) => sum + investor.rawAmount / 100, 0);
  const remaining = totalProjeto - totalLinked;

  // Build a map of credits already "reserved" by pending links (aporte + entry fees)
  const reservedCredits = new Map<string, number>();
  for (const investor of investorsToLink) {
    const amount = investor.rawAmount / 100;
    const fee = investorEntryFees(investor.fees);
    reservedCredits.set(investor.userId, (reservedCredits.get(investor.userId) ?? 0) + amount + fee);
  }

  const addInvestorFromDialog = (userId: string, amount: number, fees: ManualFees) => {
    const rawAmount = Math.round(amount * 100);
    const displayAmount = amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setInvestorsToLink((prev) => [...prev, { userId, rawAmount, displayAmount, fees }]);
    setShowLinkDialog(false);
  };

  const removeInvestorFromList = (index: number) => {
    setInvestorsToLink((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  useEffect(() => {
    if (!propertyId) return;
    const load = async () => {
      const [propRes, imgRes] = await Promise.all([
        supabase.from("properties").select("*").eq("id", propertyId).maybeSingle(),
        supabase.from("property_images").select("*").eq("property_id", propertyId).order("sort_order"),
      ]);

      if (propRes.data) {
        const property = propRes.data;
        setForm({
          type: property.type as "house" | "land",
          title: property.title,
          location: property.location,
          state_code: property.state_code ?? "",
          total_shares: String(property.total_shares),
          share_price: String(property.share_price),
          status: property.status,
          estimated_auction_value: formatUSD(property.estimated_auction_value ?? 0),
          estimated_renovation_cost: formatUSD(property.estimated_renovation_cost ?? 0),
          estimated_return_pct: String(property.estimated_return_pct ?? 0),
          estimated_sale_value: formatUSD(property.estimated_sale_value ?? 0),
          estimated_timeline: property.estimated_timeline ?? "",
          doc_commission_rate: String((property as any).doc_commission_rate ?? 10),
        });
        setCoverImage(property.cover_image_url);
      }

      if (imgRes.data) {
        setGalleryImages(imgRes.data.map((image) => image.image_url));
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
    setGalleryImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
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

  const getValidationErrorMessage = (error: z.ZodError<typeof propertyFormSchema._type>) => {
    const issue = error.issues[0];
    if (!issue) return p.invalidValue;

    const fieldLabels: Record<string, string> = {
      title: "Título",
      location: "Cidade",
      state_code: "Estado",
      total_shares: "Total de cotas",
      share_price: "Valor da cota",
      status: "Status",
      estimated_auction_value: "Valor Est. de Arremate",
      estimated_renovation_cost: "Valor Est. de Reforma",
      estimated_sale_value: "Valor Est. de Venda",
      estimated_timeline: "Prazo Estimado",
    };

    const field = String(issue.path[0] ?? "");
    const label = fieldLabels[field] ?? "campo";

    if (issue.code === "too_small") {
      return `O campo '${label}' é obrigatório.`;
    }

    if (issue.code === "too_big") {
      if (field === "estimated_auction_value" || field === "estimated_renovation_cost" || field === "estimated_sale_value") {
        return `O campo '${label}' excede o limite máximo permitido ($${formatUSD(MAX_PROPERTY_AMOUNT)}).`;
      }
      if (field === "estimated_timeline") {
        return `O campo '${label}' pode ter no máximo 100 caracteres.`;
      }
      if (field === "title" || field === "location") {
        return `O campo '${label}' pode ter no máximo 200 caracteres.`;
      }
      return `O campo '${label}' excede o limite permitido.`;
    }

    if (issue.code === "invalid_type") {
      return `O campo '${label}' contém um valor inválido.`;
    }

    if (issue.code === "custom") {
      return issue.message || `O campo '${label}' contém um valor inválido.`;
    }

    return `Verifique o campo '${label}'.`;
  };

  const validateStep1 = (): boolean => {
    const parsedForm = propertyFormSchema.safeParse({
      type: form.type,
      title: form.title,
      location: form.location,
      state_code: form.state_code,
      total_shares: form.total_shares || 1,
      share_price: form.share_price || 0,
      status: form.status,
      estimated_auction_value: parseMaskedUSD(form.estimated_auction_value),
      estimated_renovation_cost: parseMaskedUSD(form.estimated_renovation_cost),
      estimated_sale_value: parseMaskedUSD(form.estimated_sale_value),
      estimated_timeline: form.estimated_timeline,
    });
    if (!parsedForm.success) {
      toast({ title: p.error, description: getValidationErrorMessage(parsedForm.error), variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;


    const parsedForm = propertyFormSchema.safeParse({
      type: form.type,
      title: form.title,
      location: form.location,
      state_code: form.state_code,
      total_shares: form.total_shares || 1,
      share_price: form.share_price || 0,
      status: form.status,
      estimated_auction_value: parseMaskedUSD(form.estimated_auction_value),
      estimated_renovation_cost: parseMaskedUSD(form.estimated_renovation_cost),
      estimated_sale_value: parseMaskedUSD(form.estimated_sale_value),
      estimated_timeline: form.estimated_timeline,
    });

    if (!parsedForm.success) {
      toast({ title: p.error, description: getValidationErrorMessage(parsedForm.error), variant: "destructive" });
      return;
    }

    const validated = parsedForm.data;
    const validatedTotalProjeto = validated.estimated_auction_value + validated.estimated_renovation_cost;
    const validatedTotalProjetoComTaxas = validatedTotalProjeto;
    const docRate = parseFloat(form.doc_commission_rate) || 10;
    const docComm = validated.estimated_sale_value * (docRate / 100);
    const calculatedReturn = validatedTotalProjetoComTaxas > 0
      ? ((validated.estimated_sale_value - validatedTotalProjetoComTaxas - docComm) / validatedTotalProjetoComTaxas) * 100
      : 0;

    if (validatedTotalProjetoComTaxas > MAX_PROPERTY_AMOUNT) {
      toast({
        title: p.error,
        description: `O 'Total Est. do Projeto' excede o limite máximo permitido ($${formatUSD(MAX_PROPERTY_AMOUNT)}).`,
        variant: "destructive",
      });
      return;
    }

    if (!Number.isFinite(calculatedReturn) || Math.abs(calculatedReturn) > MAX_PROPERTY_ROI) {
      toast({
        title: p.error,
        description: `O 'Retorno Estimado' excede o limite máximo permitido (${formatUSD(MAX_PROPERTY_ROI)}%).`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const propertyData = {
        type: validated.type,
        title: validated.title.trim(),
        location: validated.location.trim(),
        state_code: validated.state_code || null,
        purchase_price: validatedTotalProjetoComTaxas,
        estimated_return_pct: Math.round(calculatedReturn * 100) / 100,
        total_shares: validated.total_shares,
        share_price: validated.share_price,
        available_shares: validated.total_shares,
        status: validated.status,
        cover_image_url: coverImage,
        created_by: user.id,
        estimated_auction_value: validated.estimated_auction_value,
        estimated_renovation_cost: validated.estimated_renovation_cost,
        estimated_sale_value: validated.estimated_sale_value,
        estimated_timeline: validated.estimated_timeline.trim(),
        doc_commission_rate: parseFloat(form.doc_commission_rate) || 10,
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

      if (propId) {
        await supabase.from("property_images").delete().eq("property_id", propId);
        if (galleryImages.length > 0) {
          await supabase.from("property_images").insert(
            galleryImages.map((url, index) => ({
              property_id: propId!,
              image_url: url,
              sort_order: index,
            }))
          );
        }
      }

      if (propId && !propertyId && investorsToLink.length > 0) {
        for (const investor of investorsToLink) {
          const amount = investor.rawAmount / 100;
          const { error } = await supabase.rpc("admin_link_investor_to_property" as any, {
            p_property_id: propId,
            p_user_id: investor.userId,
            p_amount: amount,
            p_property_title: validated.title.trim(),
            p_fee_service: investor.fees.feeService,
            p_fee_renovation: investor.fees.feeRenovation,
            p_fee_sales: investor.fees.feeSales,
            p_fee_profit_rate: investor.fees.feeProfitRate,
          });
          if (error) {
            toast({
              title: p.error,
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
      const raw = error?.message ?? p.unexpectedError;
      let detail = raw;
      if (raw.includes("numeric field overflow")) {
        detail = `numeric field overflow — O valor calculado de purchase_price (${validatedTotalProjetoComTaxas.toFixed(2)}) ou estimated_return_pct (${calculatedReturn.toFixed(2)}) excede o limite da coluna no banco (numeric 12,2 / 5,2). Reduza os valores de arremate, reforma ou venda.`;
      }
      toast({ title: p.error, description: detail, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = propertyId
    ? ["Informações", "Imagens"]
    : ["Informações", "Imagens", "Investidores"];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>{propertyId ? "Editar Imóvel" : "Novo Imóvel"}</DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-3">
            {stepTitles.map((title, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              return (
                <div key={title} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : done
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {n}
                    </span>
                    <span className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                      {title}
                    </span>
                  </div>
                  {n < stepTitles.length && <span className="w-6 h-px bg-border" />}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ===== STEP 1: Informações ===== */}
          {step === 1 && (
            <>
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
                  type="text"
                  inputMode="decimal"
                  value={form.estimated_auction_value}
                  onChange={(e) => setForm({ ...form, estimated_auction_value: maskUSDInput(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renovationCost">Valor Est. de Reforma ($)</Label>
                <Input
                  id="renovationCost"
                  type="text"
                  inputMode="decimal"
                  value={form.estimated_renovation_cost}
                  onChange={(e) => setForm({ ...form, estimated_renovation_cost: maskUSDInput(e.target.value) })}
                  placeholder="0.00"
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
                  type="text"
                  inputMode="decimal"
                  value={form.estimated_sale_value}
                  onChange={(e) => setForm({ ...form, estimated_sale_value: maskUSDInput(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Calculated Return (with doc commission) */}
            <div className="space-y-2">
              <Label>Retorno Estimado (%)</Label>
              <div className="flex items-center h-10 rounded-md border border-input bg-muted/50 px-3 text-sm font-medium">
                {(() => {
                  const saleVal = parseMaskedUSD(form.estimated_sale_value);
                  const dcRate = parseFloat(form.doc_commission_rate) || 10;
                  const docComm = saleVal * (dcRate / 100);
                  const profit = saleVal - totalProjeto - docComm;
                  if (totalProjeto > 0 && saleVal > 0) {
                    return `${((profit / totalProjeto) * 100).toFixed(1)}%`;
                  }
                  return "—";
                })()}
              </div>
              <p className="text-xs text-muted-foreground">Calculado: (Venda − Projeto − Doc.&Comissão {form.doc_commission_rate}%) / Projeto</p>
            </div>

            {/* Doc Commission Rate */}
            <div className="space-y-2">
              <Label htmlFor="docCommission">Taxa Doc. & Comissão (%)</Label>
              <Input
                id="docCommission"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.doc_commission_rate}
                onChange={(e) => setForm({ ...form, doc_commission_rate: e.target.value })}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">Percentual sobre o valor de venda para documentação e comissão</p>
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
            </>
          )}

          {/* ===== STEP 2: Imagens ===== */}
          {step === 2 && (
            <>
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
            </>
          )}

          {/* ===== STEP 3: Investidores (only for new properties) ===== */}
          {step === 3 && !propertyId && (
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
                    const totalFee = investorEntryFees(inv.fees);
                    const pct = totalProjeto > 0 ? ((amount / totalProjeto) * 100).toFixed(1) : "0";

                    return (
                      <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/20 text-sm">
                        <div className="flex flex-col gap-0.5">
                          <div>
                            <span className="font-medium">{profile?.full_name || "Usuário"}</span>
                            <span className="text-muted-foreground ml-2">({pct}%)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">${formatUSD(amount)}</p>
                            {totalFee > 0 && (
                              <p className="text-[10px] text-amber-500">Taxas: ${formatUSD(totalFee)}</p>
                            )}
                            {totalFee === 0 && (
                              <p className="text-[10px] text-emerald-500">Sem taxas</p>
                            )}
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

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 w-full"
                onClick={() => setShowLinkDialog(true)}
                disabled={remaining <= 0 && totalProjeto > 0}
              >
                <UserPlus className="h-4 w-4" /> Vincular Investidor
              </Button>

              <LinkInvestorDialog
                open={showLinkDialog}
                onOpenChange={setShowLinkDialog}
                propertyType={form.type}
                totalProject={totalProjeto}
                renovationCost={renovationCost}
                estimatedSaleValue={parseMaskedUSD(form.estimated_sale_value)}
                remaining={remaining}
                onLink={addInvestorFromDialog}
                isPending={false}
                reservedCreditsMap={reservedCredits}
              />
            </div>
          )}

          {/* Footer navigation */}
          <div className="flex gap-3 pt-2">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
            )}

            {step < totalSteps ? (
              <Button type="button" variant="cta" onClick={handleNext} className="flex-1">
                Próximo
              </Button>
            ) : (
              <Button type="submit" variant="cta" className="flex-1" disabled={loading || uploading}>
                {loading && <Loader2 className="animate-spin" />}
                {propertyId ? "Salvar Alterações" : "Criar Imóvel"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

