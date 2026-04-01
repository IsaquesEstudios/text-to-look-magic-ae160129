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

  const handleSaveAll = async () => {
    const entries = Object.entries(editingRates);
    if (entries.length === 0) return;
    setSaving("all");
    let hasError = false;
    for (const [id, value] of entries) {
      const newRate = parseFloat(value);
      if (isNaN(newRate) || newRate < 0) continue;
      const { error } = await supabase
        .from("us_state_taxes")
        .update({ tax_rate: newRate })
        .eq("id", id);
      if (error) hasError = true;
    }
    if (hasError) {
      toast({ title: "Erro ao salvar algumas tarifas", variant: "destructive" });
    } else {
      toast({ title: "Tarifas atualizadas com sucesso" });
      setEditingRates({});
      queryClient.invalidateQueries({ queryKey: ["us-state-taxes"] });
    }
    setSaving(null);
  };

  const hasChanges = Object.keys(editingRates).length > 0;

  const statesWithTax = taxes?.filter((t) => t.tax_rate > 0).length ?? 0;
  const avgRate = taxes?.length
    ? (taxes.reduce((s, t) => s + Number(t.tax_rate), 0) / taxes.length).toFixed(2)
    : "0";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as configurações do sistema</p>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-base sm:text-lg">Tarifas dos Estados (EUA)</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Impostos estaduais aplicados automaticamente nos gastos dos imóveis.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
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
            <Button variant="outline" size="sm" className="gap-2 flex-shrink-0 self-start" onClick={() => setOpen(true)}>
              <Pencil className="h-4 w-4" />
              Alterar
            </Button>
          </div>
        </CardContent>
      </Card>


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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save all button */}
          <div className="pt-4 border-t border-border/50">
            <Button
              className="w-full gap-2"
              disabled={!hasChanges || saving === "all"}
              onClick={handleSaveAll}
            >
              {saving === "all" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Alterações {hasChanges && `(${Object.keys(editingRates).length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
