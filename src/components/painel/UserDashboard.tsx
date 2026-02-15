import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, TrendingUp, PieChart, Building2, Loader2, ArrowUpRight, Clock, ShoppingCart, CreditCard, History, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

export function UserDashboard() {
  const { user, profile } = useAuth();

  const { data: shares, isLoading } = useQuery({
    queryKey: ["user-shares", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("*, properties(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: availableProperties } = useQuery({
    queryKey: ["available-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .gt("available_shares", 0)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["user-recent-activity", user?.id],
    queryFn: async () => {
      const [sharesRes, creditsRes] = await Promise.all([
        supabase
          .from("shares")
          .select("id, purchased_at, quantity, amount_paid, properties(title)")
          .eq("user_id", user!.id)
          .order("purchased_at", { ascending: false })
          .limit(5),
        supabase
          .from("credit_transactions")
          .select("id, created_at, type, amount, description")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const items: { id: string; date: string; icon: "share" | "credit"; title: string; detail: string }[] = [];

      sharesRes.data?.forEach((s) => {
        const prop = s.properties as any;
        items.push({
          id: s.id,
          date: s.purchased_at,
          icon: "share",
          title: `Cota adquirida`,
          detail: `${s.quantity}x em ${prop?.title ?? "Imóvel"} — $${Number(s.amount_paid).toLocaleString("pt-BR")}`,
        });
      });

      creditsRes.data?.forEach((c) => {
        items.push({
          id: c.id,
          date: c.created_at,
          icon: "credit",
          title: c.type === "deposit" ? "Depósito" : c.type === "withdrawal" ? "Saque" : c.type,
          detail: c.description || `$${Number(c.amount).toLocaleString("pt-BR")}`,
        });
      });

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return items.slice(0, 6);
    },
    enabled: !!user,
  });

  // Properties the user has shares in, with unread message + expense count
  const { data: propertyNews } = useQuery({
    queryKey: ["property-news", user?.id],
    queryFn: async () => {
      const { data: userShares, error: sharesErr } = await supabase
        .from("shares")
        .select("property_id, properties(id, title, cover_image_url, status)")
        .eq("user_id", user!.id);
      if (sharesErr) throw sharesErr;
      if (!userShares?.length) return [];

      const propertyMap = new Map<string, any>();
      userShares.forEach((s) => {
        const prop = s.properties as any;
        if (prop && !propertyMap.has(prop.id)) propertyMap.set(prop.id, prop);
      });
      const propertyIds = Array.from(propertyMap.keys());

      // Get read timestamps for messages and expenses
      const [{ data: msgReads }, { data: expReads }] = await Promise.all([
        supabase
          .from("property_message_reads")
          .select("property_id, last_read_at")
          .eq("user_id", user!.id)
          .in("property_id", propertyIds),
        supabase
          .from("property_expense_reads")
          .select("property_id, last_read_at")
          .eq("user_id", user!.id)
          .in("property_id", propertyIds),
      ]);

      const msgReadMap = new Map<string, string>();
      msgReads?.forEach((r) => msgReadMap.set(r.property_id, r.last_read_at));
      const expReadMap = new Map<string, string>();
      expReads?.forEach((r) => expReadMap.set(r.property_id, r.last_read_at));

      const results = await Promise.all(
        propertyIds.map(async (pid) => {
          const msgLastRead = msgReadMap.get(pid);
          let mq = supabase
            .from("property_messages")
            .select("id", { count: "exact", head: true })
            .eq("property_id", pid);
          if (msgLastRead) mq = mq.gt("created_at", msgLastRead);
          const { count: mc } = await mq;

          const expLastRead = expReadMap.get(pid);
          let eq = supabase
            .from("property_expenses")
            .select("id", { count: "exact", head: true })
            .eq("property_id", pid);
          if (expLastRead) eq = eq.gt("created_at", expLastRead);
          const { count: ec } = await eq;

          const prop = propertyMap.get(pid);
          const unreadMessages = mc ?? 0;
          const unreadExpenses = ec ?? 0;
          return {
            id: pid,
            title: prop.title,
            cover_image_url: prop.cover_image_url,
            status: prop.status,
            unread: unreadMessages + unreadExpenses,
            unreadMessages,
            unreadExpenses,
          };
        })
      );

      // Sort: properties with unread first
      results.sort((a, b) => b.unread - a.unread);
      return results;
    },
    enabled: !!user,
  });

  const credits = profile?.credits ?? 0;
  const totalInvested = shares?.reduce((sum, s) => sum + Number(s.amount_paid), 0) ?? 0;
  const estimatedReturn = shares?.reduce((sum, s) => {
    const prop = s.properties as any;
    if (!prop) return sum;
    const returnPct = Number(prop.estimated_return_pct) / 100;
    return sum + Number(s.amount_paid) * (1 + returnPct);
  }, 0) ?? 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalShares = shares?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;
  const totalProperties = new Set(shares?.map(s => (s.properties as any)?.id).filter(Boolean)).size;

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Olá, {profile?.full_name?.split(" ")[0] || "Investidor"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumo dos seus investimentos
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Créditos</p>
            <p className="text-lg font-bold text-foreground">${credits.toLocaleString("pt-BR")}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-5">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <PieChart className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Investido</p>
            <p className="text-lg font-bold text-foreground">${totalInvested.toLocaleString("pt-BR")}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Retorno Est.</p>
            <p className="text-lg font-bold text-primary">
              ${estimatedReturn.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-5">
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Cotas</p>
            <p className="text-lg font-bold text-foreground">
              {totalShares} <span className="text-sm font-normal text-muted-foreground">em {totalProperties} imóve{totalProperties === 1 ? "l" : "is"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Property News / Novidades */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Atualizações dos seus imóveis
        </h2>
        {!propertyNews?.length ? (
          <div className="rounded-2xl border border-dashed border-border/40 flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Building2 className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">Você ainda não possui cotas em nenhum imóvel</p>
            <Link to="/painel/oportunidades" className="text-xs text-primary hover:underline mt-1">
              Ver oportunidades →
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {propertyNews.map((prop) => (
              <Link
                key={prop.id}
                to={`/painel/imovel/${prop.id}${prop.unreadMessages > 0 ? "/novidades" : prop.unreadExpenses > 0 ? "/gastos" : "/novidades"}`}
                className="group relative flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-4 hover:bg-card/70 hover:border-primary/20 transition-all duration-300"
              >
                <div className="h-11 w-11 rounded-xl overflow-hidden bg-secondary/50 flex-shrink-0">
                  {prop.cover_image_url ? (
                    <img src={prop.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{prop.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {prop.unread > 0
                      ? [
                          prop.unreadMessages > 0 ? `${prop.unreadMessages} novidade${prop.unreadMessages === 1 ? "" : "s"}` : null,
                          prop.unreadExpenses > 0 ? `${prop.unreadExpenses} gasto${prop.unreadExpenses === 1 ? "" : "s"}` : null,
                        ].filter(Boolean).join(" · ")
                      : "Sem atualizações"}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />

                {/* Notification badge */}
                {prop.unread > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center ${
                    prop.unreadExpenses > 0 && prop.unreadMessages === 0
                      ? "bg-amber-500 text-white"
                      : "bg-destructive text-destructive-foreground"
                  }`}>
                    {prop.unread > 9 ? "+9" : prop.unread}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
      {/* History + Opportunities side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden flex flex-col" style={{ height: 350 }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/20 flex-shrink-0">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm">Histórico Recente</h3>
            </div>
            <Link to="/painel/extrato" className="text-xs text-primary hover:underline">
              Ver tudo →
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {!recentActivity?.length ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Nenhuma atividade ainda
              </div>
            ) : (
              <div className="divide-y divide-border/10">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.icon === "share" ? "bg-primary/10" : "bg-accent/10"
                    }`}>
                      {item.icon === "share" ? (
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Opportunities */}
        <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden flex flex-col" style={{ height: 350 }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/20 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm">Oportunidades</h3>
            </div>
            <Link to="/painel/oportunidades" className="text-xs text-primary hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!availableProperties?.length ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Nenhuma oportunidade disponível
              </div>
            ) : (
              <div className="divide-y divide-border/10">
                {availableProperties.slice(0, 5).map((prop) => (
                  <Link
                    key={prop.id}
                    to={`/painel/imovel/${prop.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-secondary/50 flex-shrink-0">
                      {prop.cover_image_url ? (
                        <img src={prop.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{prop.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{prop.location}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-foreground">${Number(prop.share_price).toLocaleString("pt-BR")}</p>
                      <p className="text-[11px] text-primary font-medium">{prop.available_shares} cotas</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
