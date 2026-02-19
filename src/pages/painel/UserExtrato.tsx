import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowDownLeft, ArrowUpRight, Receipt, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UserExtrato() {
  const { user, profile } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["credit-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });


  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const timeline = [
    ...(transactions?.map((t) => ({
      id: t.id,
      date: t.created_at,
      type: t.type as string,
      description: t.description || (t.type === "deposit" ? "Depósito de créditos" : "Movimentação"),
      amount: Number(t.amount),
      isCredit: t.type === "deposit" || Number(t.amount) > 0,
    })) ?? []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const credits = profile?.credits ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Extrato</h1>
          <p className="text-sm text-muted-foreground mt-1">Histórico de movimentações</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Saldo atual</p>
            <p className="text-lg font-bold text-primary">${credits.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              const amount = prompt("Qual valor deseja recarregar? (em dólares)");
              if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
                const msg = encodeURIComponent(
                  `Olá! Gostaria de fazer uma recarga de créditos no valor de $${Number(amount).toLocaleString("en-US")}. Meu e-mail cadastrado é: ${user?.email || "N/A"}`
                );
                window.open(`https://wa.me/14752985931?text=${msg}`, "_blank");
              }
            }}
          >
            <CreditCard className="h-4 w-4" />
            Recarga
          </Button>
        </div>
      </div>

      {!timeline.length ? (
        <div className="rounded-2xl border border-dashed border-border/40 flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Receipt className="h-9 w-9 mb-3 opacity-25" />
          <p className="text-sm">Nenhuma movimentação ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {timeline.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl border border-border/20 bg-card/30 px-4 py-3"
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                item.isCredit ? "bg-primary/10" : "bg-secondary"
              }`}>
                {item.isCredit ? (
                  <ArrowDownLeft className="h-4 w-4 text-primary" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{item.description}</p>
                <p className="text-[11px] text-muted-foreground/60">
                  {new Date(item.date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <p className={`text-sm font-semibold flex-shrink-0 ${
                item.isCredit ? "text-primary" : "text-foreground"
              }`}>
                {item.isCredit ? "+" : ""}${Math.abs(item.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
