import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Phone, MapPin, Save } from "lucide-react";

export default function UserProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile-full", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_zip: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: (profile as any).phone ?? "",
        whatsapp: (profile as any).whatsapp ?? "",
        address_street: (profile as any).address_street ?? "",
        address_number: (profile as any).address_number ?? "",
        address_complement: (profile as any).address_complement ?? "",
        address_neighborhood: (profile as any).address_neighborhood ?? "",
        address_city: (profile as any).address_city ?? "",
        address_state: (profile as any).address_state ?? "",
        address_zip: (profile as any).address_zip ?? "",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim() || null,
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          address_street: form.address_street.trim() || null,
          address_number: form.address_number.trim() || null,
          address_complement: form.address_complement.trim() || null,
          address_neighborhood: form.address_neighborhood.trim() || null,
          address_city: form.address_city.trim() || null,
          address_state: form.address_state.trim() || null,
          address_zip: form.address_zip.trim() || null,
        } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile-full"] });
      toast({ title: "Perfil atualizado com sucesso!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Meu Perfil</h1>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input id="fullName" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Seu nome completo" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Email
            </Label>
            <Input value={user.email ?? ""} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+55 (00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="+55 (00) 00000-0000" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <Label>Rua</Label>
              <Input value={form.address_street} onChange={(e) => update("address_street", e.target.value)} placeholder="Nome da rua" />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input value={form.address_number} onChange={(e) => update("address_number", e.target.value)} placeholder="Nº" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input value={form.address_complement} onChange={(e) => update("address_complement", e.target.value)} placeholder="Apto, bloco..." />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input value={form.address_neighborhood} onChange={(e) => update("address_neighborhood", e.target.value)} placeholder="Bairro" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-2">
              <Label>CEP</Label>
              <Input value={form.address_zip} onChange={(e) => update("address_zip", e.target.value)} placeholder="00000-000" />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={form.address_city} onChange={(e) => update("address_city", e.target.value)} placeholder="Cidade" />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input value={form.address_state} onChange={(e) => update("address_state", e.target.value)} placeholder="UF" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="gap-2">
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar Alterações
      </Button>
    </div>
  );
}
