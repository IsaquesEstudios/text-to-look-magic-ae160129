import { useState } from "react";
import { useDemoGuard } from "@/hooks/useDemoGuard";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";

interface UserContractUploadFormProps {
  userId: string;
  onClose: () => void;
}

export function UserContractUploadForm({ userId, onClose }: UserContractUploadFormProps) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isDemoBlocked = useDemoGuard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoBlocked()) return;
    if (!title.trim() || !file) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("contracts")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("contracts")
        .insert({
          user_id: userId,
          title: title.trim(),
          pdf_url: urlData.publicUrl,
        });

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["user-contracts"] });
      toast({ title: "Contrato enviado com sucesso!" });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro ao enviar contrato", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border/40 bg-card/50 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Enviar Contrato</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Título do contrato</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Contrato de Investimento - Casa XYZ"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label>PDF do contrato</Label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border/60 cursor-pointer hover:bg-secondary/30 transition-colors text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            {file ? file.name : "Escolher arquivo PDF"}
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Enviar Contrato
        </Button>
      </div>
    </form>
  );
}
