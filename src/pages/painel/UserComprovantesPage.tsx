import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileImage, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function UserComprovantesPage() {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: images = [], isLoading } = useQuery({
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
  });

  const received = images.filter((img) => img.type === "received");
  const sent = images.filter((img) => img.type === "sent");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comprovantes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Comprovantes de pagamentos recebidos e enviados
        </p>
      </div>

      <ImageSection title="Pagamentos Recebidos" items={received} onSelect={setSelectedImage} />
      <ImageSection title="Pagamentos Enviados" items={sent} onSelect={setSelectedImage} />

      {images.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileImage className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum comprovante cadastrado ainda.</p>
        </div>
      )}

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          {selectedImage && (
            <img src={selectedImage} alt="Comprovante" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImageSection({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: { id: string; image_url: string; created_at: string; description: string | null }[];
  onSelect: (url: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.image_url)}
            className="group relative rounded-xl overflow-hidden border border-border/40 bg-card hover:ring-2 hover:ring-primary/30 transition-all"
          >
            <img
              src={item.image_url}
              alt={item.description || "Comprovante"}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <span className="text-[11px] text-white/90">
                {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
