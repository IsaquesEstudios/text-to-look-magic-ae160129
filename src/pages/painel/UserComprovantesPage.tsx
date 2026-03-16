import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePanelTranslation } from "@/hooks/usePanelTranslation";
import { FileImage, Loader2, ArrowDownLeft, ArrowUpRight, CreditCard, Upload, Trash2, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const dateFnsLocales: Record<string, typeof ptBR> = { pt: ptBR, en: enUS, es };

export default function UserComprovantesPage() {
  const { user } = useAuth();
  const { p, lang } = usePanelTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dateLocale = dateFnsLocales[lang] || ptBR;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: images = [], isLoading: loadingImages } = useQuery({
    queryKey: ["user-payment-images", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_payment_images")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchOnMount: "always" as const,
    staleTime: 0,
  });

  const { data: recharges = [], isLoading: loadingRecharges } = useQuery({
    queryKey: ["user-recharges", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("type", "deposit")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter((t) => {
        const desc = (t.description ?? "").toLowerCase();
        return !desc.includes("leilão") && !desc.includes("leilao") && !desc.includes("lucro");
      });
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const filePath = `user-receipts/${user!.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("property-media")
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("property-media")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("user_payment_images")
        .insert({
          user_id: user!.id,
          uploaded_by: user!.id,
          type: "sent",
          image_url: urlData.publicUrl,
          description: file.name,
        });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-payment-images"] });
      toast({ title: p.receiptUploaded });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_payment_images")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-payment-images"] });
      toast({ title: p.receiptDeleted });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  const received = images.filter((img) => img.type === "received");
  const sent = images.filter((img) => img.type === "sent");
  const isLoading = loadingImages || loadingRecharges;

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const isPdf = (url: string) => url.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{p.receiptsTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{p.receiptsDesc}</p>
      </div>

      <Tabs defaultValue="sent" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="sent" className="gap-1.5 text-xs sm:text-sm">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {p.sent}
            {sent.length > 0 && ` (${sent.length})`}
          </TabsTrigger>
          <TabsTrigger value="received" className="gap-1.5 text-xs sm:text-sm">
            <ArrowDownLeft className="h-3.5 w-3.5" />
            {p.received}
            {received.length > 0 && ` (${received.length})`}
          </TabsTrigger>
          <TabsTrigger value="recharges" className="gap-1.5 text-xs sm:text-sm">
            <CreditCard className="h-3.5 w-3.5" />
            {p.recharges}
            {recharges.length > 0 && ` (${recharges.length})`}
          </TabsTrigger>
        </TabsList>

        {/* SENT - user can upload */}
        <TabsContent value="sent" className="mt-6 space-y-4">
          {/* Upload zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/40 bg-card/30 hover:bg-card/50 transition-all flex flex-col items-center justify-center py-10 gap-2"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground/50" />
            )}
            <p className="text-sm text-muted-foreground font-medium">
              {uploadMutation.isPending ? p.uploading : p.uploadReceipt}
            </p>
            <p className="text-xs text-muted-foreground/60">{p.uploadReceiptDesc}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {sent.length === 0 ? (
            <EmptyState text={p.noSentReceipts} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sent.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-xl overflow-hidden border border-border/40 bg-card"
                >
                  {isPdf(item.image_url) ? (
                    <a
                      href={item.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center aspect-square bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <span className="text-xs text-muted-foreground truncate max-w-[90%] px-2">
                        {item.description || "PDF"}
                      </span>
                    </a>
                  ) : (
                    <button
                      onClick={() => setSelectedImage(item.image_url)}
                      className="w-full"
                    >
                      <img
                        src={item.image_url}
                        alt={item.description || ""}
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                      />
                    </button>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-end justify-between">
                    <span className="text-[11px] text-white/90">
                      {format(new Date(item.created_at), "dd/MM/yyyy", {
                        locale: dateLocale,
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white/70 hover:text-destructive hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(item.id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* RECEIVED - read-only from admin */}
        <TabsContent value="received" className="mt-6">
          {received.length === 0 ? (
            <EmptyState text={p.noReceivedReceipts} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {received.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-xl overflow-hidden border border-border/40 bg-card"
                >
                  {isPdf(item.image_url) ? (
                    <a
                      href={item.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center aspect-square bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <span className="text-xs text-muted-foreground truncate max-w-[90%] px-2">
                        {item.description || "PDF"}
                      </span>
                    </a>
                  ) : (
                    <button
                      onClick={() => setSelectedImage(item.image_url)}
                      className="w-full"
                    >
                      <img
                        src={item.image_url}
                        alt={item.description || ""}
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                      />
                    </button>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <span className="text-[11px] text-white/90">
                      {format(new Date(item.created_at), "dd/MM/yyyy", {
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* APORTES */}
        <TabsContent value="recharges" className="mt-6">
          {recharges.length === 0 ? (
            <EmptyState
              text={p.noRecharges}
              icon={<CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />}
            />
          ) : (
            <div className="space-y-2">
              {recharges.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 rounded-xl border border-border/20 bg-card/30 px-4 py-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ArrowDownLeft className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {r.description || p.creditDeposit}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(r.created_at), "dd MMM yyyy, HH:mm", {
                        locale: dateLocale,
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-primary flex-shrink-0">
                    +$
                    {Math.abs(Number(r.amount)).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          {selectedImage && (
            <img src={selectedImage} alt="" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center py-16 text-muted-foreground rounded-2xl border border-dashed border-border/40">
      {icon || <FileImage className="h-10 w-10 mx-auto mb-3 opacity-40" />}
      <p className="text-sm">{text}</p>
    </div>
  );
}
