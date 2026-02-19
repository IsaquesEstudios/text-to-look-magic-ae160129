import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowDownLeft, ArrowUpRight, Receipt, CreditCard, MessageCircle, ShieldCheck, RefreshCcw, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function UserExtrato() {
  const { user, profile } = useAuth();
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");

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

  const parsedAmount = Number(rechargeAmount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const handleWhatsAppRedirect = () => {
    if (!isValidAmount) return;
    const msg = encodeURIComponent(
      `Olá! Gostaria de fazer uma recarga de créditos no valor de $${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}. Meu e-mail cadastrado é: ${user?.email || "N/A"}`
    );
    window.open(`https://wa.me/14752985931?text=${msg}`, "_blank");
    setRechargeOpen(false);
    setRechargeAmount("");
  };

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
            onClick={() => setRechargeOpen(true)}
          >
            <CreditCard className="h-4 w-4" />
            Recarga
          </Button>
        </div>
      </div>

      {/* Recharge Dialog */}
      <Dialog open={rechargeOpen} onOpenChange={(open) => { setRechargeOpen(open); if (!open) setRechargeAmount(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Recarga de Créditos
            </DialogTitle>
            <DialogDescription>
              Adicione créditos à sua conta para participar dos leilões.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Valor da recarga (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Ex: 500.00"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Como funciona</p>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">1. WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Você será direcionado ao nosso WhatsApp para combinar o pagamento.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">2. Confirmação</p>
                    <p className="text-xs text-muted-foreground">Após o pagamento, um administrador adicionará os créditos à sua conta e o comprovante ficará disponível.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <RefreshCcw className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">3. Saldo permanente</p>
                    <p className="text-xs text-muted-foreground">Caso não consiga arrematar em um leilão, seus créditos continuam na Discovery para os próximos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setRechargeOpen(false); setRechargeAmount(""); }}>
              Cancelar
            </Button>
            <Button onClick={handleWhatsAppRedirect} disabled={!isValidAmount} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Ir para WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
