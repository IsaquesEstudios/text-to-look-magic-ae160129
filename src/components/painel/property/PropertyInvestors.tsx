import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShoppingCart, Hammer, Handshake, UserPlus, Trash2, Pencil, Check, X, Search, ArrowRight, ArrowLeft, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { computeSaleResults, phaseFromStatus, type Phase } from "@/lib/propertyPhases";

interface Props {
  propertyId: string;
  totalProject: number;
  renovationCost: number;
  estimatedSaleValue?: number;
  docCommissionRate?: number;
  propertyType?: string;
  propertyTitle?: string;
}

const fmt = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const parseNum = (s: string) => {
  const n = parseFloat(s.replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
};

const PHASE_STATUS: Record<Phase, string> = {
  purchase: "auctioned",
  renovation: "renovation_in_progress",
  sale: "for_sale",
};

export function PropertyInvestors({ propertyId, renovationCost, estimatedSaleValue = 0, propertyType, propertyTitle }: Props) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isLand = propertyType === "land" || propertyType === "terreno";

  const [viewPhase, setViewPhase] = useState<Phase | null>(null);
  const [linkPhase, setLinkPhase] = useState<"purchase" | "renovation" | null>(null);
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);

  const { data: property } = useQuery({
    queryKey: ["property-phase-info", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("status, estimated_auction_value, estimated_renovation_cost, estimated_sale_value, sale_doc_cost, broker_commission")
        .eq("id", propertyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId && isAdmin,
  });

  const { data: shares } = useQuery({
    queryKey: ["property-investors", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("id, user_id, amount_paid, phase, purchased_at")
        .eq("property_id", propertyId)
        .order("purchased_at");
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId && isAdmin,
  });

  const userIds = [...new Set((shares ?? []).map((s) => s.user_id))];
  const { data: profiles } = useQuery({
    queryKey: ["investor-profiles", userIds],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      if (error) throw error;
      return data;
    },
    enabled: userIds.length > 0,
  });
  const nameOf = (id: string) => profiles?.find((p) => p.user_id === id)?.full_name || "Usuário";

  const invalidate = () => {
    ["property-investors", "property-phase-info", "property-detail", "investors-with-credits-dialog", "admin-properties", "admin-properties-kpis", "admin-portfolio-counts", "admin-users"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    );
  };
  const onErr = (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" });

  const linkMut = useMutation({
    mutationFn: async (v: { userId: string; amount: number; phase: string }) => {
      const { error } = await supabase.rpc("admin_link_investor_phase", {
        p_property_id: propertyId, p_user_id: v.userId, p_amount: v.amount, p_phase: v.phase,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setLinkPhase(null); toast({ title: "Investidor vinculado" }); },
    onError: onErr,
  });
  const updateMut = useMutation({
    mutationFn: async (v: { id: string; amount: number }) => {
      const { error } = await supabase.rpc("admin_update_share_amount", { p_share_id: v.id, p_new_amount: v.amount });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setEditing(null); toast({ title: "Valor atualizado" }); },
    onError: onErr,
  });
  const removeMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("admin_remove_share", { p_share_id: id });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: "Vínculo removido e créditos restituídos" }); },
    onError: onErr,
  });
  const statusMut = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("properties").update({ status }).eq("id", propertyId);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setViewPhase(null); },
    onError: onErr,
  });
  const saleMut = useMutation({
    mutationFn: async (v: { sale: number; doc: number; broker: number }) => {
      const { error } = await supabase
        .from("properties")
        .update({ estimated_sale_value: v.sale, sale_doc_cost: v.doc, broker_commission: v.broker })
        .eq("id", propertyId);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: "Dados de venda salvos" }); },
    onError: onErr,
  });

  if (!isAdmin) return null;

  const currentPhase = phaseFromStatus(property?.status);
  const phases: Phase[] = isLand ? ["purchase", "sale"] : ["purchase", "renovation", "sale"];
  const active = viewPhase ?? currentPhase;
  const purchaseTarget = Number(property?.estimated_auction_value ?? 0);
  const renoTarget = Number(property?.estimated_renovation_cost ?? renovationCost ?? 0);

  const byPhase = (ph: string) => (shares ?? []).filter((s) => (s.phase ?? "purchase") === ph);

  const goTo = (ph: Phase) => statusMut.mutate(PHASE_STATUS[ph]);
  const idx = phases.indexOf(currentPhase);
  const next = phases[idx + 1];
  const prev = phases[idx - 1];

  const meta: Record<Phase, { label: string; icon: typeof ShoppingCart }> = {
    purchase: { label: "Compra", icon: ShoppingCart },
    renovation: { label: "Reforma", icon: Hammer },
    sale: { label: "Venda", icon: Handshake },
  };

  const renderList = (ph: "purchase" | "renovation", target: number) => {
    const list = byPhase(ph);
    const total = list.reduce((a, s) => a + Number(s.amount_paid), 0);
    const diff = target - total;
    return (
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Investido: ${fmt(total)}</span>
            <span>Meta (Est.): ${fmt(target)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${target > 0 ? Math.min((total / target) * 100, 100) : 0}%` }} />
          </div>
          {target > 0 && diff !== 0 && (
            <p className={`text-[11px] mt-1 ${diff > 0 ? "text-muted-foreground" : "text-amber-500"}`}>
              {diff > 0 ? `Faltam $${fmt(diff)}` : `Acima da estimativa em $${fmt(-diff)}`}
            </p>
          )}
        </div>

        {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">Nenhum investidor nesta etapa</p>}

        {list.map((s) => {
          const isEd = editing?.id === s.id;
          const pct = total > 0 ? (Number(s.amount_paid) / total) * 100 : 0;
          return (
            <div key={s.id} className="flex flex-col items-stretch sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-3">
              <Link to={`/painel/usuarios/${s.user_id}`} className="min-w-0 text-sm font-medium hover:text-primary flex items-center gap-1.5">
                <span className="min-w-0 break-words">{nameOf(s.user_id)}</span> <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
              </Link>
              <div className="flex items-center justify-end gap-2 shrink-0">
                {isEd ? (
                  <>
                    <div className="relative w-32">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input autoFocus className="h-8 pl-5 text-sm" value={editing.value} inputMode="decimal"
                        onChange={(e) => setEditing({ id: s.id, value: e.target.value })} />
                    </div>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={updateMut.isPending}
                      onClick={() => updateMut.mutate({ id: s.id, amount: parseNum(editing.value) })}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-right">
                      <p className="text-sm font-bold">${fmt(Number(s.amount_paid))}</p>
                      <p className="text-[11px] text-muted-foreground">{pct.toFixed(1)}% da etapa</p>
                    </div>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
                      onClick={() => setEditing({ id: s.id, value: String(Number(s.amount_paid)) })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" disabled={removeMut.isPending}
                      onClick={() => { if (confirm("Remover este vínculo e devolver o valor ao saldo?")) removeMut.mutate(s.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={() => setLinkPhase(ph)}>
          <UserPlus className="h-3.5 w-3.5" /> Vincular Investidor
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {phases.map((ph, i) => {
          const M = meta[ph];
          const done = phases.indexOf(currentPhase) > i;
          const isCurrent = currentPhase === ph;
          return (
            <div key={ph} className="flex flex-col sm:flex-row items-center gap-2 sm:flex-1 min-w-0">
              <Button type="button" variant="ghost" onClick={() => setViewPhase(ph)}
                className={`w-full sm:w-auto sm:flex-1 h-auto min-h-10 flex flex-wrap items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium whitespace-normal transition-colors ${
                  active === ph ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:bg-secondary/30"
                }`}>
                <M.icon className="h-4 w-4" />
                {i + 1}. {M.label}
                {isCurrent && <span className="text-[9px] uppercase tracking-wider rounded bg-primary text-primary-foreground px-1.5 py-0.5">atual</span>}
                {done && <Check className="h-3 w-3" />}
              </Button>
              {i < phases.length - 1 && <ArrowRight className="h-3.5 w-3.5 rotate-90 sm:rotate-0 text-muted-foreground/50 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {active === "purchase" && renderList("purchase", purchaseTarget)}
      {active === "renovation" && renderList("renovation", renoTarget)}
      {active === "sale" && (
        <SalePanel
          key={`${property?.estimated_sale_value}-${property?.sale_doc_cost}-${property?.broker_commission}`}
          initialSale={Number(property?.estimated_sale_value ?? estimatedSaleValue)}
          initialDoc={Number(property?.sale_doc_cost ?? 0)}
          initialBroker={Number(property?.broker_commission ?? 0)}
          shares={shares ?? []}
          nameOf={nameOf}
          onSave={(v) => saleMut.mutate(v)}
          saving={saleMut.isPending}
        />
      )}

      {/* Phase advance */}
      {active === currentPhase && (
        <div className="flex flex-col sm:flex-row gap-2">
          {prev && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={statusMut.isPending} onClick={() => goTo(prev)}>
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para {meta[prev].label}
            </Button>
          )}
          {next && (
            <Button type="button" variant="cta" size="sm" className="flex-1 gap-1.5" disabled={statusMut.isPending}
              onClick={() => { if (confirm(`Concluir ${meta[currentPhase].label} e avançar para ${meta[next].label}?`)) goTo(next); }}>
              Concluir {meta[currentPhase].label} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      <LinkPhaseDialog
        phase={linkPhase}
        onClose={() => setLinkPhase(null)}
        onLink={(userId, amount) => linkPhase && linkMut.mutate({ userId, amount, phase: linkPhase })}
        isPending={linkMut.isPending}
        title={propertyTitle}
      />
    </div>
  );
}

function SalePanel({ initialSale, initialDoc, initialBroker, shares, nameOf, onSave, saving }: {
  initialSale: number; initialDoc: number; initialBroker: number;
  shares: { user_id: string; amount_paid: number; phase: string | null }[];
  nameOf: (id: string) => string;
  onSave: (v: { sale: number; doc: number; broker: number }) => void;
  saving: boolean;
}) {
  const [sale, setSale] = useState(String(initialSale || ""));
  const [doc, setDoc] = useState(String(initialDoc || ""));
  const [broker, setBroker] = useState(String(initialBroker || ""));

  const investors = useMemo(() => {
    const m = new Map<string, { userId: string; purchase: number; renovation: number }>();
    for (const s of shares) {
      const e = m.get(s.user_id) ?? { userId: s.user_id, purchase: 0, renovation: 0 };
      if ((s.phase ?? "purchase") === "renovation") e.renovation += Number(s.amount_paid);
      else e.purchase += Number(s.amount_paid);
      m.set(s.user_id, e);
    }
    return [...m.values()];
  }, [shares]);

  const r = computeSaleResults(investors, parseNum(sale), parseNum(doc), parseNum(broker));
  const field = (label: string, v: string, set: (s: string) => void) => (
    <div>
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <Input className="h-9 pl-6" inputMode="decimal" value={v} onChange={(e) => set(e.target.value)} placeholder="0" />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {field("Valor de Venda", sale, setSale)}
        {field("Documentação de Venda", doc, setDoc)}
        {field("Comissão do Corretor", broker, setBroker)}
      </div>
      <Button type="button" size="sm" variant="outline" disabled={saving}
        onClick={() => onSave({ sale: parseNum(sale), doc: parseNum(doc), broker: parseNum(broker) })}>
        Salvar dados de venda
      </Button>

      <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-xs space-y-1">
        <div className="flex justify-between"><span>Valor de venda</span><span>${fmt(parseNum(sale))}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>− Documentação</span><span>${fmt(parseNum(doc))}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>− Comissão do corretor</span><span>${fmt(parseNum(broker))}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>− Total investido</span><span>${fmt(r.totalInvested)}</span></div>
        <div className="border-t border-border/50 pt-1 flex justify-between font-semibold">
          <span>Lucro (Est.)</span><span className={r.profit >= 0 ? "text-primary" : "text-destructive"}>${fmt(r.profit)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Resumo do Investidor</p>
        {r.results.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">Nenhum investidor vinculado</p>}
        {r.results.sort((a, b) => b.total - a.total).map((i) => (
          <div key={i.userId} className="rounded-lg border border-border/50 bg-card/50 px-4 py-3 text-xs">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-medium">{nameOf(i.userId)}</span>
              <span className="font-semibold">{i.pct.toFixed(1)}% do total</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-muted-foreground">
              <span>Compra: <b className="text-foreground">${fmt(i.purchase)}</b></span>
              <span>Reforma: <b className="text-foreground">${fmt(i.renovation)}</b></span>
              <span>Total: <b className="text-foreground">${fmt(i.total)}</b></span>
              <span>Lucro (Est.): <b className="text-primary">${fmt(i.profit)}</b></span>
              <span>Retorno (Est.): <b className="text-primary">{i.roiPct.toFixed(1)}%</b></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkPhaseDialog({ phase, onClose, onLink, isPending, title }: {
  phase: "purchase" | "renovation" | null;
  onClose: () => void;
  onLink: (userId: string, amount: number) => void;
  isPending: boolean;
  title?: string;
}) {
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");

  const { data: users } = useQuery({
    queryKey: ["investors-with-credits-dialog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, credits").eq("status", "approved").order("full_name");
      if (error) throw error;
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      const ids = new Set(admins?.map((a) => a.user_id) ?? []);
      return data.filter((p) => !ids.has(p.user_id));
    },
    enabled: !!phase,
  });

  const filtered = (users ?? []).filter((u) => (u.full_name ?? "").toLowerCase().includes(search.toLowerCase().trim()));
  const sel = users?.find((u) => u.user_id === userId);
  const val = parseNum(amount);
  const over = sel ? val > Number(sel.credits) : false;

  const close = () => { setSearch(""); setUserId(""); setAmount(""); onClose(); };

  return (
    <Dialog open={!!phase} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular na {phase === "renovation" ? "Reforma" : "Compra"}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {!sel ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar usuário" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 rounded-lg border border-border p-1">
                {filtered.map((u) => (
                  <button key={u.user_id} type="button" onClick={() => setUserId(u.user_id)}
                    className="w-full flex justify-between rounded-md px-3 py-2 text-sm hover:bg-secondary/40">
                    <span>{u.full_name || "Usuário"}</span>
                    <span className="text-xs text-muted-foreground">${fmt(Number(u.credits))}</span>
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Nenhum usuário</p>}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{sel.full_name}</p>
                <p className="text-xs text-muted-foreground">Saldo: ${fmt(Number(sel.credits))}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setUserId("")}>Alterar</Button>
            </div>
          )}
          {sel && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Valor investido</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input className="pl-7" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              {over && <p className="text-xs text-destructive mt-1">Saldo insuficiente</p>}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={close}>Cancelar</Button>
            <Button type="button" variant="cta" className="flex-1" disabled={!sel || val <= 0 || over || isPending}
              onClick={() => { onLink(userId, val); setSearch(""); setUserId(""); setAmount(""); }}>
              Vincular
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
