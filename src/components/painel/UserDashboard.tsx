import { useAuth } from "@/hooks/useAuth";
import { usePanelTranslation } from "@/hooks/usePanelTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, TrendingUp, Building2, Loader2, ArrowUpRight, Clock, CreditCard, History, MessageSquare, Gavel, Percent } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { Link } from "react-router-dom";

const dateFnsLocales = { pt: ptBR, en: enUS, es };

export function UserDashboard() {
  const { user, profile } = useAuth();
  const { p, lang } = usePanelTranslation();
  const dateLocale = dateFnsLocales[lang] || ptBR;

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
    refetchOnMount: "always",
    staleTime: 0,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["user-recent-activity", user?.id],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async () => {
      const creditsRes = await supabase
        .from("credit_transactions")
        .select("id, created_at, type, amount, description")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(6);

      const items: { id: string; date: string; title: string; detail: string; amount: number; type: string }[] = [];

      creditsRes.data?.forEach((c) => {
        const typeMap: Record<string, string> = {
          deposit: p.deposit,
          withdrawal: p.withdrawal,
          refund: p.refund,
          auction_deposit: p.auctionDeposit,
          profit: p.profitReturn,
        };
        items.push({
          id: c.id,
          date: c.created_at,
          title: typeMap[c.type] || c.type,
          detail: c.description || `$${Number(c.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          amount: Number(c.amount),
          type: c.type,
        });
      });

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return items.slice(0, 6);
    },
    enabled: !!user,
  });

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

      const [{ data: msgReads }, { data: expReads }] = await Promise.all([
        supabase.from("property_message_reads").select("property_id, last_read_at").eq("user_id", user!.id).in("property_id", propertyIds),
        supabase.from("property_expense_reads").select("property_id, last_read_at").eq("user_id", user!.id).in("property_id", propertyIds),
      ]);

      const msgReadMap = new Map<string, string>();
      msgReads?.forEach((r) => msgReadMap.set(r.property_id, r.last_read_at));
      const expReadMap = new Map<string, string>();
      expReads?.forEach((r) => expReadMap.set(r.property_id, r.last_read_at));

      const results = await Promise.all(
        propertyIds.map(async (pid) => {
          const msgLastRead = msgReadMap.get(pid);
          let mq = supabase.from("property_messages").select("id", { count: "exact", head: true }).eq("property_id", pid);
          if (msgLastRead) mq = mq.gt("created_at", msgLastRead);
          const { count: mc } = await mq;

          const expLastRead = expReadMap.get(pid);
          let eq = supabase.from("property_expenses").select("id", { count: "exact", head: true }).eq("property_id", pid);
          if (expLastRead) eq = eq.gt("created_at", expLastRead);
          const { count: ec } = await eq;

          const prop = propertyMap.get(pid);
          const unreadMessages = mc ?? 0;
          const unreadExpenses = ec ?? 0;
          return { id: pid, title: prop.title, cover_image_url: prop.cover_image_url, status: prop.status, unread: unreadMessages + unreadExpenses, unreadMessages, unreadExpenses };
        })
      );

      results.sort((a, b) => b.unread - a.unread);
      return results;
    },
    enabled: !!user,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const credits = profile?.credits ?? 0;
  const totalProperties = new Set(shares?.map(s => (s.properties as any)?.id).filter(Boolean)).size;

  const { totalInvested, totalEstimatedReturn, portfolioRoi } = (() => {
    if (!shares?.length) return { totalInvested: 0, totalEstimatedReturn: 0, portfolioRoi: 0 };
    const propMap = new Map<string, { totalPaid: number; prop: any }>();
    shares.forEach((s) => {
      const prop = s.properties as any;
      if (!prop) return;
      const existing = propMap.get(prop.id);
      if (existing) { existing.totalPaid += Number(s.amount_paid); }
      else { propMap.set(prop.id, { totalPaid: Number(s.amount_paid), prop }); }
    });
    let invested = 0, estimated = 0;
    propMap.forEach(({ totalPaid, prop }) => {
      invested += totalPaid;
      const auctionVal = Number(prop.estimated_auction_value) || 0;
      const renovationVal = Number(prop.estimated_renovation_cost) || 0;
      const totalProject = auctionVal + renovationVal;
      const saleVal = Number(prop.estimated_sale_value) || 0;
      const participation = totalProject > 0 ? totalPaid / totalProject : 0;
      estimated += totalPaid + (participation * (saleVal - totalProject));
    });
    const portfolioRoi = invested > 0 ? ((estimated - invested) / invested) * 100 : 0;
    return { totalInvested: invested, totalEstimatedReturn: estimated, portfolioRoi };
  })();

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const fmtUnread = (messages: number, expenses: number) => {
    const parts: string[] = [];
    if (messages > 0) parts.push(messages === 1 ? p.newsCount.replace("{count}", "1") : p.newsCountPlural.replace("{count}", String(messages)));
    if (expenses > 0) parts.push(expenses === 1 ? p.expenseCount.replace("{count}", "1") : p.expenseCountPlural.replace("{count}", String(expenses)));
    return parts.join(" · ");
  };

  return (
    <div className="space-y-4 max-w-full">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {p.greeting.replace("{name}", profile?.full_name?.split(" ")[0] || p.investor)}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{p.investmentSummary}</p>
      </div>

      <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card/40 p-3 sm:p-5 overflow-hidden">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /></div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground/60 truncate">{p.availableCredit}</p>
            <p className="text-sm sm:text-lg font-bold text-foreground truncate">${credits.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card/40 p-3 sm:p-5 overflow-hidden">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /></div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground/60 truncate">{p.totalInvested}</p>
            <p className="text-sm sm:text-lg font-bold text-foreground truncate">${totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card/40 p-3 sm:p-5 overflow-hidden">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0"><TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent" /></div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground/60 truncate">{p.estimatedReturn}</p>
            <p className={`text-sm sm:text-lg font-bold truncate ${totalEstimatedReturn >= totalInvested ? 'text-primary' : 'text-destructive'}`}>
              ${totalEstimatedReturn.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card/40 p-3 sm:p-5 overflow-hidden">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Percent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /></div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground/60 truncate">{p.estimatedROI}</p>
            <p className={`text-sm sm:text-lg font-bold ${portfolioRoi >= 0 ? 'text-primary' : 'text-destructive'}`}>{portfolioRoi.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            {p.propertyUpdates}
          </h2>
          {propertyNews && propertyNews.length > 4 && (
            <Link to="/painel/meus-projetos" className="text-xs text-primary hover:underline">{p.viewAll}</Link>
          )}
        </div>
        {!propertyNews?.length ? (
          <div className="rounded-2xl border border-dashed border-border/40 flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Building2 className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">{p.noLinkedProperties}</p>
            <Link to="/painel/leiloes-user" className="text-xs text-primary hover:underline mt-1">{p.viewAuctions}</Link>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {propertyNews.slice(0, 4).map((prop) => (
              <Link
                key={prop.id}
                to={`/painel/imovel/${prop.id}${prop.unreadMessages > 0 ? "/novidades" : prop.unreadExpenses > 0 ? "/gastos" : "/novidades"}`}
                className="group relative flex items-center gap-3 rounded-2xl border border-border/30 bg-card/40 p-3 sm:p-4 sm:gap-4 hover:bg-card/70 hover:border-primary/20 transition-all duration-300 overflow-hidden"
              >
                <div className="h-11 w-11 rounded-xl overflow-hidden bg-secondary/50 flex-shrink-0">
                  {prop.cover_image_url ? (
                    <img src={prop.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Building2 className="h-5 w-5 text-muted-foreground/20" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{prop.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {prop.unread > 0 ? fmtUnread(prop.unreadMessages, prop.unreadExpenses) : p.noUpdates}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
                {prop.unread > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center ${
                    prop.unreadExpenses > 0 && prop.unreadMessages === 0 ? "bg-amber-500 text-white" : "bg-destructive text-destructive-foreground"
                  }`}>
                    {prop.unread > 9 ? "+9" : prop.unread}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden flex flex-col" style={{ maxHeight: 350 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">{p.recentHistory}</h3>
          </div>
          <Link to="/painel/extrato" className="text-xs text-primary hover:underline">{p.viewAll}</Link>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {!recentActivity?.length ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">{p.noActivityYet}</div>
          ) : (
            <div className="divide-y divide-border/10">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.type === "deposit" || item.type === "profit" ? "bg-primary/10" : item.type === "refund" ? "bg-amber-500/10" : "bg-accent/10"
                  }`}>
                    <CreditCard className={`h-4 w-4 ${
                      item.type === "deposit" || item.type === "profit" ? "text-primary" : item.type === "refund" ? "text-amber-500" : "text-accent"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className={`text-xs truncate ${
                      item.type === "deposit" || item.type === "profit" ? "text-primary" : item.type === "withdrawal" || item.type === "auction_deposit" ? "text-destructive" : "text-muted-foreground"
                    }`}>{item.detail}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: dateLocale })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
