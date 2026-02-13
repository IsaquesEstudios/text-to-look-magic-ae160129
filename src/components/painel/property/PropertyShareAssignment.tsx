import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Users } from "lucide-react";

interface Props {
  propertyId: string;
  sharePrice: number;
  availableShares: number;
}

export function PropertyShareAssignment({ propertyId, sharePrice, availableShares }: Props) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: existingShares } = useQuery({
    queryKey: ["property-shares", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("*, profiles!shares_user_id_fkey(full_name)")
        .eq("property_id", propertyId);
      if (error) {
        // Fallback without join if FK doesn't exist
        const { data: fallback, error: err2 } = await supabase
          .from("shares")
          .select("*")
          .eq("property_id", propertyId);
        if (err2) throw err2;
        return fallback;
      }
      return data;
    },
  });

  const handleAssign = async () => {
    if (!selectedUserId || !quantity) return;

    const qty = parseInt(quantity);
    if (qty < 1 || qty > availableShares) {
      toast({ title: "Erro", description: `Quantidade inválida. Disponível: ${availableShares}`, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const amountPaid = qty * sharePrice;

      const { error } = await supabase.from("shares").insert({
        property_id: propertyId,
        user_id: selectedUserId,
        quantity: qty,
        amount_paid: amountPaid,
      });
      if (error) throw error;

      // Update available shares
      const { error: updateError } = await supabase
        .from("properties")
        .update({ available_shares: availableShares - qty })
        .eq("id", propertyId);
      if (updateError) throw updateError;

      toast({ title: "Cota atribuída!", description: `${qty} cota(s) atribuída(s) com sucesso.` });
      setSelectedUserId("");
      setQuantity("1");
      queryClient.invalidateQueries({ queryKey: ["property-shares", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["property-detail", propertyId] });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getProfileName = (userId: string) => {
    const p = profiles?.find((pr) => pr.user_id === userId);
    return p?.full_name || userId.slice(0, 8) + "...";
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gestão de Cotas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing shares */}
        {existingShares && existingShares.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Cotas atribuídas</p>
            {existingShares.map((share) => (
              <div key={share.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{getProfileName(share.user_id)}</p>
                  <p className="text-xs text-muted-foreground">{share.quantity} cota(s)</p>
                </div>
                <p className="text-sm font-medium text-primary">
                  ${Number(share.amount_paid).toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Assign form */}
        {availableShares > 0 ? (
          <div className="space-y-4 border-t border-border/50 pt-4">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Atribuir cotas ({availableShares} disponíveis)
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Usuário</Label>
                {loadingProfiles ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles?.map((p) => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.full_name || p.user_id.slice(0, 8) + "..."}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Quantidade de Cotas</Label>
                <Input
                  type="number"
                  min="1"
                  max={availableShares}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Total: ${(parseInt(quantity || "0") * sharePrice).toLocaleString("pt-BR")}
                </p>
              </div>
              <Button onClick={handleAssign} disabled={submitting || !selectedUserId} className="w-full">
                {submitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                Atribuir Cotas
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">Todas as cotas foram atribuídas.</p>
        )}
      </CardContent>
    </Card>
  );
}
