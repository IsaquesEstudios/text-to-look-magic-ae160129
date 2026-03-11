import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePanelTranslation } from "@/hooks/usePanelTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowDownLeft, ArrowUpRight, Receipt, CreditCard, MessageCircle, ShieldCheck, RefreshCcw, DollarSign, Info, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function UserExtrato() {
  const { user, profile } = useAuth();
  const { p, lang } = usePanelTranslation();
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["credit-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("credit_transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const timeline = [
    ...(transactions?.map((t) => ({
      id: t.id, date: t.created_at, type: t.type as string,
      description: t.description || (t.type === "deposit" ? p.creditDeposit : p.movement),
      amount: Number(t.amount), isCredit: t.type === "deposit" || Number(t.amount) > 0,
    })) ?? []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const credits = profile?.credits ?? 0;
  const parsedAmount = Number(rechargeAmount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const handleWhatsAppRedirect = () => {
    if (!isValidAmount) return;
    const msg = encodeURIComponent(
      `${lang === "en" ? "Hi" : lang === "es" ? "Hola" : "Olá"}! ${lang === "en" ? "I'd like to make a deposit of" : lang === "es" ? "Me gustaría hacer un aporte de" : "Gostaria de fazer um aporte no valor de"} $${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}. ${lang === "en" ? "My email is" : lang === "es" ? "Mi correo es" : "Meu e-mail cadastrado é"}: ${user?.email || "N/A"}`
    );
    window.open(`https://wa.me/14752985931?text=${msg}`, "_blank");
    setRechargeOpen(false);
    setRechargeAmount("");
  };

  const dateLocale = lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR";

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{p.statement}</h1>
          <p className="text-sm text-muted-foreground mt-1">{p.transactionHistory}</p>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card/40 px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">{p.currentBalance}</p>
            <p className="text-xl font-bold text-primary">${credits.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setRechargeOpen(true)}>
            <CreditCard className="h-4 w-4" />{p.recharge}
          </Button>
        </div>
      </div>

      <Collapsible>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 cursor-pointer hover:bg-amber-500/10 transition-colors group">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0"><Info className="h-4 w-4 text-amber-500" /></div>
            <p className="text-sm font-semibold text-amber-500 flex-1 text-left">{p.importantInfoTitle}</p>
            <ChevronDown className="h-4 w-4 text-amber-500 group-data-[state=open]:rotate-180 transition-transform" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="rounded-2xl border border-border/30 bg-card/40 p-5 mt-2 space-y-4 text-sm text-muted-foreground">
            <div><h3 className="font-semibold text-foreground mb-1">{p.howInvestmentWorks}</h3><p>{p.howInvestmentWorksDesc}</p></div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{p.investmentTiers}</h3>
              <ul className="list-disc list-inside space-y-1.5 ml-1">
                <li>{p.tierLand}</li>
                <li>{p.tierHouse}</li>
              </ul>
            </div>
            <div><h3 className="font-semibold text-foreground mb-1">{p.housesExplained}</h3><p>{p.housesExplainedDesc}</p></div>
            <div><h3 className="font-semibold text-foreground mb-1">{p.landsExplained}</h3><p>{p.landsExplainedDesc}</p></div>
            <div><h3 className="font-semibold text-foreground mb-1">{p.noPurchaseTitle}</h3><p>{p.noPurchaseDesc}</p></div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={rechargeOpen} onOpenChange={(open) => { setRechargeOpen(open); if (!open) setRechargeAmount(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />{p.creditRecharge}</DialogTitle>
            <DialogDescription>{p.addCreditsDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{p.rechargeAmount}</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" min="1" step="0.01" placeholder="Ex: 500.00" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.howItWorks}</p>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><MessageCircle className="h-3.5 w-3.5 text-primary" /></div>
                  <div><p className="text-sm font-medium text-foreground">{p.step1WhatsApp}</p><p className="text-xs text-muted-foreground">{p.step1Desc}</p></div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /></div>
                  <div><p className="text-sm font-medium text-foreground">{p.step2Confirmation}</p><p className="text-xs text-muted-foreground">{p.step2Desc}</p></div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5"><RefreshCcw className="h-3.5 w-3.5 text-primary" /></div>
                  <div><p className="text-sm font-medium text-foreground">{p.step3Balance}</p><p className="text-xs text-muted-foreground">{p.step3Desc}</p></div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRechargeOpen(false); setRechargeAmount(""); }}>{p.cancel}</Button>
            <Button onClick={handleWhatsAppRedirect} disabled={!isValidAmount} className="gap-2"><MessageCircle className="h-4 w-4" />{p.goToWhatsApp}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!timeline.length ? (
        <div className="rounded-2xl border border-dashed border-border/40 flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Receipt className="h-9 w-9 mb-3 opacity-25" /><p className="text-sm">{p.noTransactions}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {timeline.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-xl border border-border/20 bg-card/30 px-4 py-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.isCredit ? "bg-primary/10" : "bg-secondary"}`}>
                {item.isCredit ? <ArrowDownLeft className="h-4 w-4 text-primary" /> : <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{item.description}</p>
                <p className="text-[11px] text-muted-foreground/60">
                  {new Date(item.date).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <p className={`text-sm font-semibold flex-shrink-0 ${item.isCredit ? "text-primary" : "text-foreground"}`}>
                {item.isCredit ? "+" : ""}${Math.abs(item.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
