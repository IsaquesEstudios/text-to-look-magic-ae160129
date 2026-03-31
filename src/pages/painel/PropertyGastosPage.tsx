import { useParams } from "react-router-dom";
import { useEffect, useMemo, Fragment } from "react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PropertyExpenses } from "@/components/painel/property/PropertyExpenses";
import { PropertySubNav } from "@/components/painel/property/PropertySubNav";
import { PropertyPageSkeleton } from "@/components/painel/property/PropertyPageSkeleton";
import { isDemoPropertyId, getDemoProperty, getDemoExpenses } from "@/data/demoData";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function DemoExpensesView({ propertyId }: { propertyId: string }) {
  const expenses = getDemoExpenses(propertyId);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => { const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n; });
  };

  const grouped = useMemo(() => {
    const map = new Map<string, { category: string; total: number; totalTax: number; items: typeof expenses }>();
    expenses.forEach((e) => {
      const tax = e.price * ((e.tax_rate || 0) / 100);
      const existing = map.get(e.category);
      if (existing) { existing.total += e.price; existing.totalTax += tax; existing.items.push(e); }
      else { map.set(e.category, { category: e.category, total: e.price, totalTax: tax, items: [e] }); }
    });
    return Array.from(map.values());
  }, [expenses]);

  const totalSpent = grouped.reduce((s, g) => s + g.total, 0);
  const totalTax = grouped.reduce((s, g) => s + g.totalTax, 0);
  const fmt = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Card className="bg-card/50 border-border/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-2 sm:p-3 text-muted-foreground font-medium">Categoria</th>
              <th className="text-right p-2 sm:p-3 text-muted-foreground font-medium w-20 sm:w-auto">Valor</th>
              <th className="text-right p-2 sm:p-3 text-muted-foreground font-medium w-16 sm:w-auto">Tarifa</th>
              <th className="text-right p-2 sm:p-3 text-muted-foreground font-medium w-20 sm:w-auto">Total</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((group) => {
              const isExpanded = expandedCats.has(group.category);
              const hasMultiple = group.items.length > 1;
              return (
                <Fragment key={group.category}>
                  <tr className={cn("border-b border-border/30 hover:bg-secondary/30", hasMultiple && "cursor-pointer")} onClick={() => hasMultiple && toggleCat(group.category)}>
                    <td className="p-2 sm:p-3 text-foreground">
                      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        {hasMultiple && (isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />)}
                        <span className="truncate text-xs sm:text-sm">{group.category}</span>
                        {hasMultiple && <span className="text-[10px] text-muted-foreground shrink-0">({group.items.length})</span>}
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 text-right text-foreground text-xs sm:text-sm">${fmt(group.total)}</td>
                    <td className="p-2 sm:p-3 text-right text-muted-foreground text-xs sm:text-sm">{group.totalTax > 0 ? `$${fmt(group.totalTax)}` : "—"}</td>
                    <td className="p-2 sm:p-3 text-right font-medium text-foreground text-xs sm:text-sm">${fmt(group.total + group.totalTax)}</td>
                  </tr>
                  {isExpanded && group.items.map((expense) => {
                    const itemTax = expense.price * ((expense.tax_rate || 0) / 100);
                    return (
                      <tr key={expense.id} className="border-b border-border/20 bg-secondary/10">
                        <td className="p-2 sm:p-3 pl-6 sm:pl-8 text-muted-foreground text-xs">{expense.product}</td>
                        <td className="p-2 sm:p-3 text-right text-muted-foreground text-xs">${fmt(expense.price)}</td>
                        <td className="p-2 sm:p-3 text-right text-muted-foreground text-xs">{itemTax > 0 ? `$${fmt(itemTax)}` : "—"}</td>
                        <td className="p-2 sm:p-3 text-right text-muted-foreground text-xs">${fmt(expense.price + itemTax)}</td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
            <tr className="bg-secondary/20 font-semibold">
              <td className="p-2 sm:p-3 text-foreground text-xs sm:text-sm">Total</td>
              <td className="p-2 sm:p-3 text-right text-foreground text-xs sm:text-sm">${fmt(totalSpent)}</td>
              <td className="p-2 sm:p-3 text-right text-muted-foreground text-xs sm:text-sm">{totalTax > 0 ? `$${fmt(totalTax)}` : "—"}</td>
              <td className="p-2 sm:p-3 text-right text-foreground text-xs sm:text-sm">${fmt(totalSpent + totalTax)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function PropertyGastosPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, isDemoUser } = useAuth();
  const queryClient = useQueryClient();

  const isDemo = isDemoUser && id && isDemoPropertyId(id);

  // Mark expenses as read (skip for demo)
  useEffect(() => {
    if (user && id && !isDemo) {
      supabase
        .from("property_expense_reads")
        .upsert(
          { user_id: user.id, property_id: id, last_read_at: new Date().toISOString() },
          { onConflict: "user_id,property_id" }
        )
        .then(({ error }) => {
          if (error) {
            console.error("Failed to mark expenses as read:", error);
            return;
          }
          queryClient.invalidateQueries({ queryKey: ["property-unread-counts"] });
          queryClient.invalidateQueries({ queryKey: ["multi-property-unread"] });
          queryClient.invalidateQueries({ queryKey: ["total-unread-news"] });
          queryClient.invalidateQueries({ queryKey: ["property-news"] });
        });
    }
  }, [user, id, queryClient, isDemo]);

  // Demo property
  if (isDemo) {
    const demoProp = getDemoProperty(id!);
    if (!demoProp) return <p className="text-center text-muted-foreground py-16">Acesso não permitido.</p>;
    return (
      <div className="space-y-4">
        <PropertySubNav propertyId={demoProp.id} propertyTitle={demoProp.title} active="gastos" hasShares={true} />
        <DemoExpensesView propertyId={demoProp.id} />
      </div>
    );
  }

  const { data: property, isLoading } = useQuery({
    queryKey: ["property-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, state_code")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user && !isDemo,
  });

  const { data: userShares, isLoading: isSharesLoading } = useQuery({
    queryKey: ["user-shares", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("id")
        .eq("property_id", id!)
        .eq("user_id", user!.id)
        .limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user && !isDemo,
  });

  if (isLoading || isSharesLoading) {
    return <PropertyPageSkeleton />;
  }

  const hasAccess = isAdmin || (userShares && userShares.length > 0);

  if (!property || !hasAccess) {
    return <p className="text-center text-muted-foreground py-16">Acesso não permitido.</p>;
  }

  return (
    <div className="space-y-4">
      <PropertySubNav propertyId={property.id} propertyTitle={property.title} active="gastos" hasShares={!!(userShares && userShares.length > 0)} />
      <PropertyExpenses propertyId={property.id} propertyStateCode={property.state_code ?? undefined} />
    </div>
  );
}
