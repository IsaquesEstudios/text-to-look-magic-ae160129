import { useState, useEffect, useRef, useMemo, Fragment } from "react";
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
import { Plus, Trash2, Loader2, Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  propertyId: string;
  propertyStateCode?: string;
}

const MONTHS = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

function formatMonthLabel(monthStr: string | null) {
  if (!monthStr) return "—";
  const found = MONTHS.find((m) => m.value === monthStr);
  return found?.label ?? monthStr;
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
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ month: "", category: "", price: "", taxStateCode: "" });
  const [catOpen, setCatOpen] = useState(false);
  const defaultInitialized = useRef(false);

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

  // Fetch property default tax state code
  const { data: propertyData } = useQuery({
    queryKey: ["property-tax-rate", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("default_tax_rate, state_code")
        .eq("id", propertyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch pre-defined tax rates from config
  const { data: stateTaxes } = useQuery({
    queryKey: ["us-state-taxes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("us_state_taxes")
        .select("state_code, state_name, tax_rate")
        .order("state_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch last read timestamp for this user
  const { data: lastReadData } = useQuery({
    queryKey: ["expense-last-read", propertyId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_expense_reads")
        .select("last_read_at")
        .eq("property_id", propertyId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const lastReadAt = lastReadData?.last_read_at ?? null;

  // Existing categories for autocomplete
  const existingCategories = useMemo(() => {
    if (!expenses) return [];
    const cats = new Set(expenses.map((e) => e.category));
    return Array.from(cats).sort();
  }, [expenses]);

  // Set defaults
  useEffect(() => {
    if (defaultInitialized.current) return;
    if (expenses === undefined || propertyData === undefined || stateTaxes === undefined) return;

    const lastExpense = expenses?.length ? expenses[expenses.length - 1] : null;
    const now = new Date();
    const defaultMonth = lastExpense?.month || String(now.getMonth() + 1).padStart(2, "0");
    
    // Use property state_code as default tax
    const defaultStateCode = propertyData?.state_code || "";

    setForm((f) => ({ ...f, month: defaultMonth, taxStateCode: defaultStateCode }));
    defaultInitialized.current = true;
  }, [expenses, propertyData, stateTaxes]);

  // Resolve tax rate from selected state code
  const resolvedTaxRate = useMemo(() => {
    if (!form.taxStateCode || form.taxStateCode === "none" || !stateTaxes) return 0;
    const found = stateTaxes.find((t) => t.state_code === form.taxStateCode);
    return found ? Number(found.tax_rate) : 0;
  }, [form.taxStateCode, stateTaxes]);

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseCurrency(form.price);
    if (!price || !form.category.trim() || !form.month) return;
    setAdding(true);
    const { error } = await supabase.from("property_expenses").insert({
      property_id: propertyId,
      category: form.category.trim(),
      product: form.category.trim(),
      quantity: 1,
      price,
      month: form.month,
      tax_rate: resolvedTaxRate,
      state_code: form.taxStateCode || null,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      // Save state_code as default on the property
      if (form.taxStateCode) {
        await supabase.from("properties").update({ state_code: form.taxStateCode } as any).eq("id", propertyId);
        queryClient.invalidateQueries({ queryKey: ["property-tax-rate", propertyId] });
      }
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

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Group expenses by category
  const groupedExpenses = useMemo(() => {
    if (!expenses) return [];
    const map = new Map<string, { category: string; total: number; totalTax: number; newCount: number; items: typeof expenses }>();
    expenses.forEach((e) => {
      const tax = Number(e.price) * (Number(e.tax_rate || 0) / 100);
      const isNew = lastReadAt ? new Date(e.created_at) > new Date(lastReadAt) : false;
      const existing = map.get(e.category);
      if (existing) {
        existing.total += Number(e.price);
        existing.totalTax += tax;
        if (isNew) existing.newCount++;
        existing.items.push(e);
      } else {
        map.set(e.category, { category: e.category, total: Number(e.price), totalTax: tax, newCount: isNew ? 1 : 0, items: [e] });
      }
    });
    return Array.from(map.values());
  }, [expenses, lastReadAt]);

  const totalSpent = groupedExpenses.reduce((sum, g) => sum + g.total, 0);
  const totalTax = groupedExpenses.reduce((sum, g) => sum + g.totalTax, 0);

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
                    {MONTHS.map((o) => (
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

              <div className="w-48">
                <label className="text-xs text-muted-foreground">Tarifa</label>
                <Select value={form.taxStateCode} onValueChange={(v) => setForm({ ...form, taxStateCode: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem tarifa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem tarifa</SelectItem>
                    {stateTaxes?.map((t) => (
                      <SelectItem key={t.state_code} value={t.state_code}>
                        {t.state_name} ({t.tax_rate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" variant="cta" size="sm" disabled={adding || !form.category.trim()}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Expenses table - grouped by category */}
      {groupedExpenses.length > 0 ? (
        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 text-muted-foreground font-medium">Categoria</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Valor</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Tarifa</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Total</th>
                  {isAdmin && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {groupedExpenses.map((group) => {
                  const isExpanded = expandedCats.has(group.category);
                  const hasMultiple = group.items.length > 1;
                  return (
                    <Fragment key={group.category}>
                      <tr
                        className={cn(
                          "border-b border-border/30 hover:bg-secondary/30",
                          hasMultiple && "cursor-pointer"
                        )}
                        onClick={() => hasMultiple && toggleCat(group.category)}
                      >
                        <td className="p-3 text-foreground flex items-center gap-2">
                          {hasMultiple && (
                            isExpanded
                              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span>{group.category}</span>
                          {hasMultiple && (
                            <span className="text-xs text-muted-foreground">({group.items.length})</span>
                          )}
                        </td>
                        <td className="p-3 text-right text-foreground">${fmt(group.total)}</td>
                        <td className="p-3 text-right text-muted-foreground">{group.totalTax > 0 ? `$${fmt(group.totalTax)}` : "—"}</td>
                        <td className="p-3 text-right font-medium text-foreground">${fmt(group.total + group.totalTax)}</td>
                        {isAdmin && !hasMultiple && (
                          <td className="p-3">
                            <button onClick={(e) => { e.stopPropagation(); deleteExpense(group.items[0].id); }} className="text-destructive/60 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                        {isAdmin && hasMultiple && <td />}
                      </tr>
                      {isExpanded && group.items.map((expense) => {
                        const itemTax = Number(expense.price) * (Number(expense.tax_rate || 0) / 100);
                        return (
                          <tr key={expense.id} className="border-b border-border/20 bg-secondary/10">
                            <td className="p-2 pl-10 text-muted-foreground text-xs">
                              {formatMonthLabel(expense.month)}
                            </td>
                            <td className="p-2 text-right text-muted-foreground text-xs">${fmt(Number(expense.price))}</td>
                            <td className="p-2 text-right text-muted-foreground text-xs">
                              {Number(expense.tax_rate || 0) > 0 ? `${expense.tax_rate}% ($${fmt(itemTax)})` : "—"}
                            </td>
                            <td className="p-2 text-right text-muted-foreground text-xs">${fmt(Number(expense.price) + itemTax)}</td>
                            {isAdmin && (
                              <td className="p-2">
                                <button onClick={() => deleteExpense(expense.id)} className="text-destructive/60 hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border/50">
                  <td className="p-3 font-bold text-foreground">Total</td>
                  <td className="p-3 text-right font-bold text-foreground">${fmt(totalSpent)}</td>
                  <td className="p-3 text-right font-bold text-muted-foreground">{totalTax > 0 ? `$${fmt(totalTax)}` : "—"}</td>
                  <td className="p-3 text-right font-bold text-primary">${fmt(totalSpent + totalTax)}</td>
                  {isAdmin && <td />}
                </tr>
              </tfoot>
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
    </div>
  );
}
