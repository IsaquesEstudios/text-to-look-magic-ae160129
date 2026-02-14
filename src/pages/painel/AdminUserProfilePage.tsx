import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PainelLayout } from "@/components/painel/PainelLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
} from "lucide-react";

export default function AdminUserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [creditAmount, setCreditAmount] = useState("");
  const [savingCredits, setSavingCredits] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/auth");
  }, [authLoading, user, isAdmin, navigate]);

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

  const receivedImages = paymentImages?.filter((img) => img.type === "received") ?? [];
  const sentImages = paymentImages?.filter((img) => img.type === "sent") ?? [];

  const handleAddCredits = async () => {
    if (!userId || !creditAmount || !user) return;
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    setSavingCredits(true);
    try {
      // Update profile credits
      const currentCredits = Number(profile?.credits) || 0;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ credits: currentCredits + amount })
        .eq("user_id", userId);
      if (profileError) throw profileError;

      // Record transaction
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

      toast({ title: `$${amount.toLocaleString("en-US")} adicionados com sucesso!` });
      setCreditAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin-user-profile", userId] });
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

  if (authLoading || isLoading) {
    return (
      <PainelLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PainelLayout>
    );
  }

  if (!user || !isAdmin || !profile) return null;

  const credits = Number(profile.credits) || 0;

  return (
    <PainelLayout>
      <div className="space-y-6">
        <button
          onClick={() => navigate("/painel/usuarios")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Usuários
        </button>

        {/* User Info Header */}
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

        {/* Add Credits */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Adicionar Créditos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="credits">Valor ($)</Label>
                <Input
                  id="credits"
                  type="number"
                  step="0.01"
                  min="0"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <Button
                onClick={handleAddCredits}
                disabled={savingCredits || !creditAmount}
                className="h-10"
              >
                {savingCredits && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Images - Received */}
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

        {/* Payment Images - Sent */}
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
    </PainelLayout>
  );
}
