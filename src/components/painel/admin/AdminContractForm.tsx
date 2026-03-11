import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";

interface AdminContractFormProps {
  onClose: () => void;
}

export function AdminContractForm({ onClose }: AdminContractFormProps) {
  const [users, setUsers] = useState<{ user_id: string; full_name: string | null }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("user_id, full_name")
      .order("full_name")
      .then(({ data }) => {
        if (data) setUsers(data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !title || !file) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${selectedUserId}/${Date.now()}.${fileExt}`;

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
          user_id: selectedUserId,
          title,
          pdf_url: urlData.publicUrl,
        });

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["user-contracts"] });
      toast({ title: "Contrato criado com sucesso!" });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro ao criar contrato", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border/40 bg-card/50 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Novo Contrato</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Investidor</Label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um investidor" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.user_id} value={u.user_id}>
                {u.full_name || u.user_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Título do contrato</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Contrato de Investimento - Casa XYZ"
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
          Criar Contrato
        </Button>
      </div>
    </form>
  );
}
