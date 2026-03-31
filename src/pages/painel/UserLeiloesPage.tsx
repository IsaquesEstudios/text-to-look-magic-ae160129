import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_AUCTION, DEMO_AUCTION_ITEMS, DEMO_SHARES } from "@/data/demoData";
import { usePanelTranslation } from "@/hooks/usePanelTranslation";
import { markAuctionsRead } from "@/hooks/useUnreadAuctions";
import { Badge } from "@/components/ui/badge";
import { Clock, Gavel, MapPin, Home, TreePine, CalendarDays, ArrowUpRight, UserCheck, DollarSign, Percent } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const dateFnsLocales = { pt: ptBR, en: enUS, es };

function CountdownBlock({ targetDate, status, p }: { targetDate: string; status: string; p: any }) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setIsOver(true); return; }
      setParts({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [targetDate, status]);

  if (status === "finished" || isOver) {
    return <div className="flex items-center gap-2 text-destructive"><Clock className="h-4 w-4" /><span className="text-sm font-bold">{p.finished}</span></div>;
  }

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-lg sm:text-xl font-bold font-mono text-foreground bg-secondary rounded-md px-2 py-1 min-w-[2.5rem] text-center">{String(value).padStart(2, "0")}</span>
      <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <TimeUnit value={parts.d} label={p.days} /><span className="text-muted-foreground font-bold text-lg pb-4">:</span>
      <TimeUnit value={parts.h} label={p.hours} /><span className="text-muted-foreground font-bold text-lg pb-4">:</span>
      <TimeUnit value={parts.m} label={p.minutes} /><span className="text-muted-foreground font-bold text-lg pb-4">:</span>
      <TimeUnit value={parts.s} label={p.seconds} />
    </div>
  );
}

interface ShareInfo { property_id: string; amount_paid: number; }
interface DepositInfo { auction_id: string; amount: number; service_fee: number; }

function AuctionItemCard({ item, userSharesMap, linkedPropertyIds, p }: { item: any; userSharesMap: Map<string, ShareInfo>; linkedPropertyIds: Set<string>; p: any }) {
  const prop = item.properties;
  const image = prop?.cover_image_url || item.image_url;
  const title = prop?.title || item.title;
  const location = prop?.location || item.location;
  const type = prop?.type === "house" || item.type === "casa" ? p.house : p.land;
  const hasProperty = !!prop;
  const isLinked = prop ? linkedPropertyIds.has(prop.id) : false;
  const shareInfo = prop ? userSharesMap.get(prop.id) : undefined;

  const content = (
    <div className={`group relative flex flex-col rounded-2xl border ${isLinked ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/30'} bg-card overflow-hidden hover:shadow-lg transition-all duration-300`}>
      <div className="aspect-[16/10] bg-secondary/50 overflow-hidden relative">
        {image ? <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : (
          <div className="w-full h-full flex items-center justify-center">
            {type === p.land ? <TreePine className="h-8 w-8 text-muted-foreground/20" /> : <Home className="h-8 w-8 text-muted-foreground/20" />}
          </div>
        )}
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px]">{type}</Badge>
        {isLinked && <Badge className="absolute top-3 right-3 bg-green-600 text-white text-[10px] flex items-center gap-1"><UserCheck className="h-3 w-3" /> {p.linked}</Badge>}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground leading-tight">{title}</h3>
            {location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {location}</p>}
          </div>
          {hasProperty && <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />}
        </div>
        {(() => {
          const auctionVal = Number(prop?.estimated_auction_value ?? item.estimated_auction_value) || 0;
          const renovationVal = Number(prop?.estimated_renovation_cost ?? item.estimated_renovation_cost) || 0;
          const totalProject = auctionVal + renovationVal;
          const saleVal = Number(prop?.estimated_sale_value ?? item.estimated_sale_value) || 0;
          const ret = totalProject > 0 ? ((saleVal - totalProject) / totalProject) * 100 : 0;
          const investedAmount = shareInfo?.amount_paid ?? 0;
          const participationPct = totalProject > 0 ? (investedAmount / totalProject) * 100 : 0;
          const showEstimates = auctionVal > 0 || renovationVal > 0 || saleVal > 0;
          return showEstimates ? (
            <>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-medium mb-1">{p.estimates}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.auctionPrice}</p><p className="font-semibold text-foreground">${auctionVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.renovation}</p><p className="font-semibold text-foreground">${renovationVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.projectTotal}</p><p className="font-semibold text-foreground">${totalProject.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.saleValue}</p><p className="font-semibold text-foreground">${saleVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p></div>
              </div>
              {isLinked && shareInfo && (
                <div className="border-t border-border/30 pt-3 mt-1">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-medium mb-2">{p.yourParticipation}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.invested}</p><p className="font-semibold text-primary">${investedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p></div>
                    <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.participation}</p><p className="font-semibold text-primary">{participationPct.toFixed(1)}%</p></div>
                  </div>
                </div>
              )}
              <Badge variant="outline" className="w-fit text-[10px] border-primary/30 text-primary">
                {p.estimatedReturnBadge.replace("{pct}", ret.toFixed(1))}
              </Badge>
            </>
          ) : null;
        })()}
        {!hasProperty && item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
      </div>
    </div>
  );

  if (hasProperty) return <Link to={`/painel/imovel/${prop.id}`} className="block">{content}</Link>;
  return content;
}

export default function UserLeiloesPage() {
  const { user, isAdmin } = useAuth();
  const { p, lang } = usePanelTranslation();
  const dateLocale = dateFnsLocales[lang] || ptBR;
  const queryClient = useQueryClient();

  const { data: auctions, isLoading } = useQuery({
    queryKey: ["user-auctions", isAdmin],
    queryFn: async () => {
      let query = supabase.from("auctions").select("*").order("scheduled_start", { ascending: false });
      if (!isAdmin) query = query.eq("visibility", "public");
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const auctionIds = auctions?.map((a) => a.id) ?? [];

  const { data: userShares } = useQuery({
    queryKey: ["user-shares-with-amounts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("shares").select("property_id, amount_paid").eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: userDeposits } = useQuery({
    queryKey: ["user-deposits-for-auctions", user?.id, auctionIds],
    queryFn: async () => {
      if (!user || auctionIds.length === 0) return [];
      const { data, error } = await supabase.from("auction_deposits").select("auction_id, amount, service_fee").eq("user_id", user.id).in("auction_id", auctionIds);
      if (error) throw error;
      return data;
    },
    enabled: !!user && auctionIds.length > 0,
  });

  const linkedPropertyIds = new Set(userShares?.map((s) => s.property_id) ?? []);
  const userSharesMap = new Map<string, ShareInfo>();
  userShares?.forEach((s) => {
    const existing = userSharesMap.get(s.property_id);
    const paid = Number(s.amount_paid) || 0;
    if (existing) existing.amount_paid += paid;
    else userSharesMap.set(s.property_id, { property_id: s.property_id, amount_paid: paid });
  });
  const depositsByAuction = new Map<string, DepositInfo>();
  userDeposits?.forEach((d) => depositsByAuction.set(d.auction_id, { auction_id: d.auction_id, amount: Number(d.amount), service_fee: Number(d.service_fee) }));

  const { data: allItems } = useQuery({
    queryKey: ["auction-items-all", auctionIds],
    queryFn: async () => {
      if (auctionIds.length === 0) return [];
      const { data, error } = await supabase.from("auction_items").select("*, properties(*)").in("auction_id", auctionIds);
      if (error) throw error;
      return data;
    },
    enabled: auctionIds.length > 0,
  });

  useEffect(() => {
    if (user && auctions) {
      markAuctionsRead(user.id).then(() => queryClient.invalidateQueries({ queryKey: ["unread-auctions"] }));
    }
  }, [user, auctions, queryClient]);

  const itemsByAuction = new Map<string, typeof allItems>();
  allItems?.forEach((item) => {
    const list = itemsByAuction.get(item.auction_id) ?? [];
    list.push(item);
    itemsByAuction.set(item.auction_id, list);
  });

  const active = auctions?.filter((a) => a.status !== "finished") ?? [];

  if (isLoading) return <div className="animate-pulse text-muted-foreground">{p.loading}</div>;

  const renderAuction = (auction: (typeof auctions)[number]) => {
    const start = new Date(auction.scheduled_start);
    const items = itemsByAuction.get(auction.id) ?? [];

    return (
      <AccordionItem key={auction.id} value={auction.id} className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
        <AccordionTrigger className="hover:no-underline px-4 sm:px-5 py-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between w-full pr-3 gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Gavel className="h-5 w-5 text-primary" /></div>
                <div className="min-w-0">
                <span className="font-bold text-sm sm:text-base text-foreground block">{auction.title}</span>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{p.auctionDate || "Leilão"}: {format(start, "dd MMMM yyyy", { locale: dateLocale })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{p.investmentDeadline || "Prazo invest."}: {format(new Date(start.getTime() - 2 * 24 * 60 * 60 * 1000), "dd MMMM yyyy", { locale: dateLocale })}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0"><CountdownBlock targetDate={auction.scheduled_start} status={auction.status} p={p} /></div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 sm:px-5 pb-5 space-y-4">
          {auction.description && <p className="text-sm text-muted-foreground">{auction.description}</p>}
          {depositsByAuction.has(auction.id) && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{p.serviceFee}</span>
              <span className="text-xs font-semibold text-foreground">${depositsByAuction.get(auction.id)!.service_fee.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item) => <AuctionItemCard key={item.id} item={item} userSharesMap={userSharesMap} linkedPropertyIds={linkedPropertyIds} p={p} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">{p.noItemsInAuction}</p>
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Gavel className="h-6 w-6 text-primary" /> {p.auctionsTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{p.followAuctions}</p>
      </div>
      {active.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{p.upcomingActive}</h2>
          <Accordion type="single" collapsible className="flex flex-col gap-3">{active.map(renderAuction)}</Accordion>
        </div>
      )}
      {active.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/40 flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Gavel className="h-9 w-9 mb-3 opacity-25" /><p className="text-sm">{p.noAuctionsAvailable}</p>
        </div>
      )}
      {auctions?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground"><Gavel className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>{p.noAuctionsAvailable}</p></div>
      )}
    </div>
  );
}
