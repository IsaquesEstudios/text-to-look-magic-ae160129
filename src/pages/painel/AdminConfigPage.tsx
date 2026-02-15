import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Search } from "lucide-react";

export default function AdminConfigPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const { data: taxes, isLoading } = useQuery({
    queryKey: ["us-state-taxes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("us_state_taxes")
        .select("*")
        .order("state_name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = taxes?.filter(
    (t) =>
      t.state_name.toLowerCase().includes(search.toLowerCase()) ||
      t.state_code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (id: string, stateCode: string) => {
    const newRate = parseFloat(editingRates[id] ?? "");
    if (isNaN(newRate) || newRate < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    setSaving(id);
    const { error } = await supabase
      .from("us_state_taxes")
      .update({ tax_rate: newRate })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Tarifa de ${stateCode} atualizada` });
      setEditingRates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["us-state-taxes"] });
    }
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as tarifas dos estados americanos</p>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            Tarifas por Estado (Sales Tax)
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar estado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-3 text-muted-foreground font-medium">Código</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Estado</th>
                    <th className="text-right p-3 text-muted-foreground font-medium">Taxa (%)</th>
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((tax) => {
                    const isEditing = editingRates[tax.id] !== undefined;
                    return (
                      <tr key={tax.id} className="border-b border-border/30 hover:bg-secondary/30">
                        <td className="p-3 text-foreground font-mono">{tax.state_code}</td>
                        <td className="p-3 text-foreground">{tax.state_name}</td>
                        <td className="p-3 text-right">
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            value={isEditing ? editingRates[tax.id] : String(tax.tax_rate)}
                            onChange={(e) =>
                              setEditingRates((prev) => ({ ...prev, [tax.id]: e.target.value }))
                            }
                            className="w-24 ml-auto text-right h-8"
                          />
                        </td>
                        <td className="p-3">
                          {isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-primary"
                              disabled={saving === tax.id}
                              onClick={() => handleSave(tax.id, tax.state_code)}
                            >
                              {saving === tax.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
