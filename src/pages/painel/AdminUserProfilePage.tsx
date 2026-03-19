import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Upload,
  Loader2,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Gavel,
  UserX,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminUserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [creditRawAmount, setCreditRawAmount] = useState(0);
  const [creditDisplayAmount, setCreditDisplayAmount] = useState("");
  const [savingCredits, setSavingCredits] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin-user-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!user && isAdmin,
    refetchOnMount: "always",
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: paymentImages, refetch: refetchImages } = useQuery({
    queryKey: ["payment-images", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_payment_images")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!user && isAdmin,
  });

  const { data: auctionInvestments } = useQuery({
    queryKey: ["admin-user-auctions", userId],
    queryFn: async () => {
      const { data: deposits, error } = await supabase
        .from("auction_deposits")
        .select("id, amount, created_at, auction_id")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!deposits || deposits.length === 0) return [];

      const auctionIds = [...new Set(deposits.map((d) => d.auction_id))];
      const { data: auctions } = await supabase
        .from("auctions")
        .select("id, title, status, scheduled_start")
        .in("id", auctionIds);

      const auctionMap = new Map((auctions ?? []).map((a) => [a.id, a]));

      const grouped = new Map<string, { auction: any; deposits: typeof deposits; total: number }>();
      for (const d of deposits) {
        if (!grouped.has(d.auction_id)) {
          grouped.set(d.auction_id, {
            auction: auctionMap.get(d.auction_id),
            deposits: [],
            total: 0,
          });
        }
        const g = grouped.get(d.auction_id)!;
        g.deposits.push(d);
        g.total += Number(d.amount);
      }
      return Array.from(grouped.values());
    },
    enabled: !!userId && !!user && isAdmin,
  });

  const { data: userShares } = useQuery({
    queryKey: ["admin-user-shares", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("id, property_id, amount_paid")
        .eq("user_id", userId!);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const propertyIds = [...new Set(data.map(s => s.property_id))];
      const { data: props } = await supabase
        .from("properties")
        .select("id, title, type")
        .in("id", propertyIds);
      const propMap = new Map((props ?? []).map(p => [p.id, p]));
      return data.map(s => ({ ...s, property: propMap.get(s.property_id) }));
    },
    enabled: !!userId && !!user && isAdmin,
  });

  const receivedImages = paymentImages?.filter((img) => img.type === "received") ?? [];
  const sentImages = paymentImages?.filter((img) => img.type === "sent") ?? [];

  const handleAddCredits = async () => {
    if (!userId || creditRawAmount === 0 || !user) return;
    const amount = creditRawAmount / 100;
    if (amount <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    setSavingCredits(true);
    try {
      const currentCredits = Number(profile?.credits) || 0;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ credits: currentCredits + amount })
        .eq("user_id", userId);
      if (profileError) throw profileError;

      const { error: txError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: userId,
          amount,
          type: "deposit",
          description: `Crédito adicionado pelo admin`,
          created_by: user.id,
        });
      if (txError) throw txError;

      toast({ title: `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} adicionados com sucesso!` });
      setCreditRawAmount(0);
      setCreditDisplayAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin-user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["investors-with-credits-linking"] });
      queryClient.invalidateQueries({ queryKey: ["investment-kpis"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSavingCredits(false);
    }
  };

  const uploadImage = async (file: File, type: "received" | "sent") => {
    const ext = file.name.split(".").pop();
    const path = `payments/${userId}/${type}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("property-media")
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("property-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "received" | "sent"
  ) => {
    const files = e.target.files;
    if (!files || !user || !userId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImage(file, type);
        await supabase.from("user_payment_images").insert({
          user_id: userId,
          uploaded_by: user.id,
          type,
          image_url: url,
        });
      }
      refetchImages();
      toast({ title: "Imagens enviadas!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    const { error } = await supabase
      .from("user_payment_images")
      .delete()
      .eq("id", imageId);
    if (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
    } else {
      refetchImages();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return <p className="text-center text-muted-foreground py-16">Usuário não encontrado.</p>;

  const credits = Number(profile.credits) || 0;

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate("/painel/usuarios")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Usuários
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {profile.full_name || "Sem nome"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{userId}</p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary text-base px-4 py-1.5">
          <DollarSign className="h-4 w-4 mr-1" />
          {credits.toLocaleString("en-US")}
        </Badge>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Informações do Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Nome completo", profile.full_name],
              ["Telefone", profile.phone],
              ["WhatsApp", profile.whatsapp],
              ["País", profile.country],
              ["CEP / Postal Code", profile.postal_code],
              ["Rua", profile.address_street],
              ["Número", profile.address_number],
              ["Complemento", profile.address_complement],
              ["Bairro", profile.address_neighborhood],
              ["Cidade", profile.address_city],
              ["Estado", profile.address_state],
            ].map(([label, value]) => (
              <div key={label as string} className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className="text-foreground">{(value as string) || "—"}</span>
              </div>
            ))}
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-xs">Cadastrado em</span>
              <span className="text-foreground">
                {format(new Date(profile.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Adicionar Créditos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="credits">Valor ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="credits"
                  type="text"
                  inputMode="numeric"
                  value={creditDisplayAmount}
                  onChange={(e) => {
                    const input = e.target.value.replace(/[^0-9]/g, "");
                    const cents = parseInt(input || "0", 10);
                    setCreditRawAmount(cents);
                    if (cents === 0) {
                      setCreditDisplayAmount("");
                    } else {
                      setCreditDisplayAmount((cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                    }
                  }}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
            <Button
              onClick={handleAddCredits}
              disabled={savingCredits || creditRawAmount === 0}
              className="h-10"
            >
              {savingCredits && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gavel className="h-4 w-4 text-primary" />
            Leilões Investidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!auctionInvestments || auctionInvestments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum investimento em leilões
            </p>
          ) : (
            <div className="space-y-4">
              {auctionInvestments.map((item) => (
                <div key={item.auction?.id || Math.random()} className="border border-border/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.auction?.title || "Leilão"}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.auction?.scheduled_start
                          ? format(new Date(item.auction.scheduled_start), "dd MMM yyyy", { locale: ptBR })
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        Total: ${item.total.toLocaleString("en-US")}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {item.deposits.length} depósito{item.deposits.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {item.deposits.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50">
                        <span className="text-muted-foreground">
                          {format(new Date(d.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                        <span className="font-medium text-foreground">${Number(d.amount).toLocaleString("en-US")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4 text-primary" />
            Pagamentos Recebidos do Cliente
          </CardTitle>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <span>
                <Upload className="h-3.5 w-3.5" />
                Enviar
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, "received")}
            />
          </label>
        </CardHeader>
        <CardContent>
          {receivedImages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum comprovante enviado
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {receivedImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-background/70 px-2 py-1">
                    <p className="text-[10px] text-muted-foreground truncate">
                      {new Date(img.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            Pagamentos Feitos para o Cliente
          </CardTitle>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <span>
                <Upload className="h-3.5 w-3.5" />
                Enviar
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, "sent")}
            />
          </label>
        </CardHeader>
        <CardContent>
          {sentImages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum comprovante enviado
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sentImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-background/70 px-2 py-1">
                    <p className="text-[10px] text-muted-foreground truncate">
                      {new Date(img.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Enviando imagens...
        </div>
      )}
    </div>
  );
}
