import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Save, Search, Receipt, Pencil } from "lucide-react";

export default function AdminConfigPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
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

  const statesWithTax = taxes?.filter((t) => t.tax_rate > 0).length ?? 0;
  const avgRate = taxes?.length
    ? (taxes.reduce((s, t) => s + Number(t.tax_rate), 0) / taxes.length).toFixed(2)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as configurações do sistema</p>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">Tarifas dos Estados (EUA)</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Impostos estaduais aplicados automaticamente nos gastos dos imóveis.
                </p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{taxes?.length ?? 0}</span> estados cadastrados
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{statesWithTax}</span> com imposto
                  </span>
                  <span className="text-muted-foreground">
                    Média: <span className="font-medium text-foreground">{avgRate}%</span>
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2 flex-shrink-0" onClick={() => setOpen(true)}>
              <Pencil className="h-4 w-4" />
              Alterar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for editing tariffs */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Tarifas por Estado</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar estado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-1">
                {filtered?.map((tax) => {
                  const isEditing = editingRates[tax.id] !== undefined;
                  return (
                    <div
                      key={tax.id}
                      className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground w-7">{tax.state_code}</span>
                        <span className="text-sm text-foreground">{tax.state_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={isEditing ? editingRates[tax.id] : String(tax.tax_rate)}
                          onChange={(e) =>
                            setEditingRates((prev) => ({ ...prev, [tax.id]: e.target.value }))
                          }
                          className="w-20 text-right h-8 text-sm"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
