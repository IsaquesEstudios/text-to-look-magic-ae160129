import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Trash2, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  propertyId: string;
  propertyStateCode?: string;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getMonthOptions() {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ value: val, label });
  }
  return options;
}

function formatMonthLabel(monthStr: string | null) {
  if (!monthStr) return "—";
  const [y, m] = monthStr.split("-");
  const idx = parseInt(m, 10) - 1;
  return `${MONTHS[idx] ?? m} ${y}`;
}

function formatCurrency(raw: string): string {
  const digits = raw.replace(/[^0-9.]/g, "");
  const parts = digits.split(".");
  const intPart = parts[0] || "";
  const decimalPart = parts[1];
  if (!intPart && !decimalPart) return "";
  const num = parseInt(intPart || "0", 10);
  const formatted = num.toLocaleString("en-US");
  const hasDecimal = raw.includes(".");
  if (hasDecimal) {
    return `$${formatted}.${(decimalPart ?? "").slice(0, 2)}`;
  }
  return `$${formatted}`;
}

function parseCurrency(val: string): number {
  return parseFloat(val.replace(/[^0-9.]/g, "")) || 0;
}

export function PropertyExpenses({ propertyId, propertyStateCode }: Props) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ month: "", category: "", price: "", state_code: "" });
  const [catOpen, setCatOpen] = useState(false);
  const defaultInitialized = useRef(false);

  const monthOptions = useMemo(getMonthOptions, []);

  const { data: stateTaxes } = useQuery({
    queryKey: ["us-state-taxes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("us_state_taxes").select("*").order("state_name");
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

  // Existing categories for autocomplete
  const existingCategories = useMemo(() => {
    if (!expenses) return [];
    const cats = new Set(expenses.map((e) => e.category));
    return Array.from(cats).sort();
  }, [expenses]);

  // Set defaults
  useEffect(() => {
    if (defaultInitialized.current) return;
    if (!stateTaxes || expenses === undefined) return;

    const lastExpense = expenses?.length ? expenses[expenses.length - 1] : null;
    const defaultState = lastExpense?.state_code || propertyStateCode || "";
    const now = new Date();
    const defaultMonth = lastExpense?.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    setForm((f) => ({
      ...f,
      state_code: stateTaxes.some((s) => s.state_code === defaultState) ? defaultState : "",
      month: defaultMonth,
    }));
    defaultInitialized.current = true;
  }, [stateTaxes, expenses, propertyStateCode]);

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseCurrency(form.price);
    if (!price || !form.category.trim() || !form.month) return;
    setAdding(true);
    const taxRate = selectedTax?.tax_rate ?? 0;
    const { error } = await supabase.from("property_expenses").insert({
      property_id: propertyId,
      category: form.category.trim(),
      product: form.category.trim(), // keep product column populated
      quantity: 1,
      price,
      state_code: form.state_code || null,
      tax_rate: taxRate,
      month: form.month,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setForm((prev) => ({ ...prev, category: "", price: "" }));
      queryClient.invalidateQueries({ queryKey: ["property-expenses", propertyId] });
    }
    setAdding(false);
  };

  const deleteExpense = async (id: string) => {
    await supabase.from("property_expenses").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["property-expenses", propertyId] });
  };

  const fmt = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const calcTotal = (e: { price: number; quantity: number; tax_rate?: number | null }) => {
    const base = Number(e.price) * e.quantity;
    const tax = base * (Number(e.tax_rate ?? 0) / 100);
    return base + tax;
  };

  const totalSpent = expenses?.reduce((sum, e) => sum + calcTotal(e), 0) ?? 0;
  const categoryTotals: Record<string, number> = {};
  expenses?.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + calcTotal(e);
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
              <div className="w-44">
                <label className="text-xs text-muted-foreground">Mês</label>
                <Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-muted-foreground">Categoria</label>
                <Popover open={catOpen} onOpenChange={setCatOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={catOpen}
                      className="w-full justify-start font-normal h-10"
                    >
                      {form.category || <span className="text-muted-foreground">Ex: Eletricidade</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar ou criar..."
                        value={form.category}
                        onValueChange={(v) => setForm({ ...form, category: v })}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <button
                            type="button"
                            className="text-sm text-primary cursor-pointer"
                            onClick={() => setCatOpen(false)}
                          >
                            Usar "{form.category}"
                          </button>
                        </CommandEmpty>
                        <CommandGroup>
                          {existingCategories
                            .filter((c) => c.toLowerCase().includes(form.category.toLowerCase()))
                            .map((cat) => (
                              <CommandItem
                                key={cat}
                                value={cat}
                                onSelect={() => {
                                  setForm({ ...form, category: cat });
                                  setCatOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", form.category === cat ? "opacity-100" : "opacity-0")} />
                                {cat}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="w-32">
                <label className="text-xs text-muted-foreground">Valor ($)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: formatCurrency(e.target.value) })}
                  placeholder="$0.00"
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
                  +${((parseCurrency(form.price) * selectedTax.tax_rate) / 100).toFixed(2)} tax
                </div>
              )}

              <Button type="submit" variant="cta" size="sm" disabled={adding || !form.category.trim()}>
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
                  <th className="text-left p-3 text-muted-foreground font-medium">Mês</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Categoria</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Valor</th>
                  <th className="text-center p-3 text-muted-foreground font-medium">Tarifa</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Total</th>
                  {isAdmin && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border/30 hover:bg-secondary/30">
                    <td className="p-3 text-foreground">{formatMonthLabel(expense.month)}</td>
                    <td className="p-3 text-foreground">{expense.category}</td>
                    <td className="p-3 text-right text-foreground">${fmt(Number(expense.price))}</td>
                    <td className="p-3 text-center text-muted-foreground text-xs">
                      {expense.state_code ? `${expense.state_code} (${expense.tax_rate}%)` : "—"}
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">${fmt(calcTotal(expense))}</td>
                    {isAdmin && (
                      <td className="p-3">
                        <button onClick={() => deleteExpense(expense.id)} className="text-destructive/60 hover:text-destructive">
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
                <span className="text-foreground">${fmt(total)}</span>
              </div>
            ))}
            <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-primary">${fmt(totalSpent)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
