import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePanelTranslation } from "@/hooks/usePanelTranslation";
import { FileImage, Loader2, ArrowDownLeft, ArrowUpRight, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const dateFnsLocales = { pt: ptBR, en: enUS, es };

export default function UserComprovantesPage() {
  const { user } = useAuth();
  const { p, lang } = usePanelTranslation();
  const dateLocale = dateFnsLocales[lang] || ptBR;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: images = [], isLoading: loadingImages } = useQuery({
    queryKey: ["user-payment-images", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_payment_images").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: recharges = [], isLoading: loadingRecharges } = useQuery({
    queryKey: ["user-recharges", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("credit_transactions").select("*").eq("user_id", user!.id).eq("type", "deposit").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter((t) => {
        const desc = (t.description ?? "").toLowerCase();
        return !desc.includes("leilão") && !desc.includes("leilao") && !desc.includes("lucro");
      });
    },
    enabled: !!user,
  });

  const received = images.filter((img) => img.type === "received");
  const sent = images.filter((img) => img.type === "sent");
  const isLoading = loadingImages || loadingRecharges;

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{p.receiptsTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{p.receiptsDesc}</p>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="received" className="gap-1.5 text-xs sm:text-sm">
            <ArrowDownLeft className="h-3.5 w-3.5" />{p.received}{received.length > 0 && ` (${received.length})`}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-1.5 text-xs sm:text-sm">
            <ArrowUpRight className="h-3.5 w-3.5" />{p.sent}{sent.length > 0 && ` (${sent.length})`}
          </TabsTrigger>
          <TabsTrigger value="recharges" className="gap-1.5 text-xs sm:text-sm">
            <CreditCard className="h-3.5 w-3.5" />{p.recharges}{recharges.length > 0 && ` (${recharges.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          {received.length === 0 ? <EmptyState text={p.noReceivedReceipts} /> : <ImageGrid items={received} onSelect={setSelectedImage} dateLocale={dateLocale} />}
        </TabsContent>
        <TabsContent value="sent" className="mt-6">
          {sent.length === 0 ? <EmptyState text={p.noSentReceipts} /> : <ImageGrid items={sent} onSelect={setSelectedImage} dateLocale={dateLocale} />}
        </TabsContent>
        <TabsContent value="recharges" className="mt-6">
          {recharges.length === 0 ? (
            <EmptyState text={p.noRecharges} icon={<CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />} />
          ) : (
            <div className="space-y-2">
              {recharges.map((r) => (
                <div key={r.id} className="flex items-center gap-4 rounded-xl border border-border/20 bg-card/30 px-4 py-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><ArrowDownLeft className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{r.description || p.creditDeposit}</p>
                    <p className="text-[11px] text-muted-foreground/60">{format(new Date(r.created_at), "dd MMM yyyy, HH:mm", { locale: dateLocale })}</p>
                  </div>
                  <p className="text-sm font-semibold text-primary flex-shrink-0">+${Math.abs(Number(r.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-2">{selectedImage && <img src={selectedImage} alt="" className="w-full rounded-lg" />}</DialogContent>
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

function ImageGrid({ items, onSelect, dateLocale }: { items: { id: string; image_url: string; created_at: string; description: string | null }[]; onSelect: (url: string) => void; dateLocale: any }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <button key={item.id} onClick={() => onSelect(item.image_url)} className="group relative rounded-xl overflow-hidden border border-border/40 bg-card hover:ring-2 hover:ring-primary/30 transition-all">
          <img src={item.image_url} alt={item.description || ""} className="w-full aspect-square object-cover" loading="lazy" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <span className="text-[11px] text-white/90">{format(new Date(item.created_at), "dd/MM/yyyy", { locale: dateLocale })}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
