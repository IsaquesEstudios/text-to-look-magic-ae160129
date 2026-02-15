import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Props {
  propertyId: string;
  propertyStateCode?: string;
}

export function PropertyExpenses({ propertyId, propertyStateCode }: Props) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ category: "", product: "", quantity: "1", price: "", state_code: "" });
  const defaultInitialized = useRef(false);

  const { data: stateTaxes } = useQuery({
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

  const selectedTax = stateTaxes?.find((s) => s.state_code === form.state_code);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["property-expenses", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_expenses")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Set default state_code: last expense's state, or property's state
  useEffect(() => {
    if (defaultInitialized.current) return;
    if (!stateTaxes) return;
    if (expenses === undefined) return;
    
    const lastExpenseState = expenses?.length
      ? expenses[expenses.length - 1].state_code
      : null;
    const defaultState = lastExpenseState || propertyStateCode || "";
    if (defaultState && stateTaxes.some((s) => s.state_code === defaultState)) {
      setForm((f) => ({ ...f, state_code: defaultState }));
    }
    defaultInitialized.current = true;
  }, [stateTaxes, expenses, propertyStateCode]);

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    const taxRate = selectedTax?.tax_rate ?? 0;
    const { error } = await supabase.from("property_expenses").insert({
      property_id: propertyId,
      category: form.category.trim(),
      product: form.product.trim(),
      quantity: parseInt(form.quantity),
      price: parseFloat(form.price),
      state_code: form.state_code || null,
      tax_rate: taxRate,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setForm((prev) => ({ category: "", product: "", quantity: "1", price: "", state_code: prev.state_code }));
      queryClient.invalidateQueries({ queryKey: ["property-expenses", propertyId] });
    }
    setAdding(false);
  };

  const deleteExpense = async (id: string) => {
    await supabase.from("property_expenses").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["property-expenses", propertyId] });
  };

  // Summary calculations
  const calcTotal = (e: { price: number; quantity: number; tax_rate?: number | null }) => {
    const base = Number(e.price) * e.quantity;
    const tax = base * (Number(e.tax_rate ?? 0) / 100);
    return base + tax;
  };

  const totalSpent = expenses?.reduce((sum, e) => sum + calcTotal(e), 0) ?? 0;
  const categoryTotals: Record<string, number> = {};
  expenses?.forEach((e) => {
    const cat = e.category;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + calcTotal(e);
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add expense form - admin only */}
      {isAdmin && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <form onSubmit={addExpense} className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-muted-foreground">Categoria</label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Pintura"
                  required
                  maxLength={100}
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-muted-foreground">Produto</label>
                <Input
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                  placeholder="Tinta XY"
                  required
                  maxLength={200}
                />
              </div>
              <div className="w-20">
                <label className="text-xs text-muted-foreground">Qtd</label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="w-28">
                <label className="text-xs text-muted-foreground">Preço ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="w-36">
                <label className="text-xs text-muted-foreground">Tarifa (Estado)</label>
                <Select value={form.state_code} onValueChange={(v) => setForm({ ...form, state_code: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {stateTaxes?.map((s) => (
                      <SelectItem key={s.state_code} value={s.state_code}>
                        {s.state_code} ({s.tax_rate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedTax && form.price && (
                <div className="text-xs text-muted-foreground self-end pb-2">
                  +${((parseFloat(form.price || "0") * selectedTax.tax_rate) / 100).toFixed(2)} tax
                </div>
              )}
              <Button type="submit" variant="cta" size="sm" disabled={adding}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Expenses table */}
      {expenses && expenses.length > 0 ? (
        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 text-muted-foreground font-medium">Categoria</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Produto</th>
                  <th className="text-center p-3 text-muted-foreground font-medium">Qtd</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Preço</th>
                  <th className="text-center p-3 text-muted-foreground font-medium">Tarifa</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Total</th>
                  {isAdmin && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border/30 hover:bg-secondary/30">
                    <td className="p-3 text-foreground">{expense.category}</td>
                    <td className="p-3 text-foreground">{expense.product}</td>
                    <td className="p-3 text-center text-foreground">{expense.quantity}</td>
                    <td className="p-3 text-right text-foreground">
                      ${Number(expense.price).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3 text-center text-muted-foreground text-xs">
                      {expense.state_code ? `${expense.state_code} (${expense.tax_rate}%)` : "—"}
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">
                      ${calcTotal(expense).toLocaleString("pt-BR")}
                    </td>
                    {isAdmin && (
                      <td className="p-3">
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="text-destructive/60 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum gasto registrado.
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {expenses && expenses.length > 0 && (
        <Card className="bg-card/50 border-primary/20">
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-foreground">Resumo de Gastos</h3>
            {Object.entries(categoryTotals).map(([cat, total]) => (
              <div key={cat} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{cat}</span>
                <span className="text-foreground">${total.toLocaleString("pt-BR")}</span>
              </div>
            ))}
            <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-primary">${totalSpent.toLocaleString("pt-BR")}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
