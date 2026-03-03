import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { markAuctionsRead } from "@/hooks/useUnreadAuctions";
import { Badge } from "@/components/ui/badge";
import { Clock, Gavel, MapPin, Home, TreePine, CalendarDays, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function CountdownBlock({ targetDate, status }: { targetDate: string; status: string }) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setIsOver(true);
        return;
      }
      setParts({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [targetDate, status]);

  if (status === "finished" || isOver) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-bold">Terminado</span>
      </div>
    );
  }

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-lg sm:text-xl font-bold font-mono text-foreground bg-secondary rounded-md px-2 py-1 min-w-[2.5rem] text-center">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <TimeUnit value={parts.d} label="dias" />
      <span className="text-muted-foreground font-bold text-lg pb-4">:</span>
      <TimeUnit value={parts.h} label="hrs" />
      <span className="text-muted-foreground font-bold text-lg pb-4">:</span>
      <TimeUnit value={parts.m} label="min" />
      <span className="text-muted-foreground font-bold text-lg pb-4">:</span>
      <TimeUnit value={parts.s} label="seg" />
    </div>
  );
}

function AuctionItemCard({ item }: { item: any }) {
  const prop = item.properties;
  const image = prop?.cover_image_url || item.image_url;
  const title = prop?.title || item.title;
  const location = prop?.location || item.location;
  const type = prop?.type === "house" || item.type === "casa" ? "Casa" : "Terreno";
  const hasProperty = !!prop;

  const content = (
    <div className="group relative flex flex-col rounded-2xl border border-border/30 bg-card overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="aspect-[16/10] bg-secondary/50 overflow-hidden relative">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {type === "Terreno" ? <TreePine className="h-8 w-8 text-muted-foreground/20" /> : <Home className="h-8 w-8 text-muted-foreground/20" />}
          </div>
        )}
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px]">{type}</Badge>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground leading-tight">{title}</h3>
            {location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" /> {location}
              </p>
            )}
          </div>
          {hasProperty && <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />}
        </div>

        {hasProperty && (
          <>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 font-medium mb-1">Estimativas</p>
            {(() => {
              const auctionVal = Number(prop.estimated_auction_value) || 0;
              const renovationVal = Number(prop.estimated_renovation_cost) || 0;
              const totalProject = auctionVal + renovationVal;
              const saleVal = Number(prop.estimated_sale_value) || 0;
              const ret = totalProject > 0 ? ((saleVal - totalProject) / totalProject) * 100 : 0;
              return (
                <>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Arremate</p>
                      <p className="font-semibold text-foreground">${auctionVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Reforma</p>
                      <p className="font-semibold text-foreground">${renovationVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Total do Projeto</p>
                      <p className="font-semibold text-foreground">${totalProject.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Valor de Venda</p>
                      <p className="font-semibold text-foreground">${saleVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit text-[10px] border-primary/30 text-primary">
                    {ret.toFixed(1)}% retorno estimado
                  </Badge>
                </>
              );
            })()}
          </>
        )}

        {!hasProperty && item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}
      </div>
    </div>
  );

  if (hasProperty) {
    return <Link to={`/painel/imovel/${prop.id}`} className="block">{content}</Link>;
  }
  return content;
}

export default function UserLeiloesPage() {
  const { user, isAdmin, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: auctions, isLoading } = useQuery({
    queryKey: ["user-auctions", isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("auctions")
        .select("*")
        .order("scheduled_start", { ascending: false });
      if (!isAdmin) {
        query = query.eq("visibility", "public");
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const auctionIds = auctions?.map((a) => a.id) ?? [];




  const { data: allItems } = useQuery({
    queryKey: ["auction-items-all", auctionIds],
    queryFn: async () => {
      if (auctionIds.length === 0) return [];
      const { data, error } = await supabase
        .from("auction_items")
        .select("*, properties(*)")
        .in("auction_id", auctionIds);
      if (error) throw error;
      return data;
    },
    enabled: auctionIds.length > 0,
  });

  useEffect(() => {
    if (user && auctions) {
      markAuctionsRead(user.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ["unread-auctions"] });
      });
    }
  }, [user, auctions, queryClient]);

  const itemsByAuction = new Map<string, typeof allItems>();
  allItems?.forEach((item) => {
    const list = itemsByAuction.get(item.auction_id) ?? [];
    list.push(item);
    itemsByAuction.set(item.auction_id, list);
  });

  const active = auctions?.filter((a) => a.status !== "finished") ?? [];
  const finished = auctions?.filter((a) => a.status === "finished") ?? [];

  if (isLoading) return <div className="animate-pulse text-muted-foreground">Carregando...</div>;

  const renderAuction = (auction: (typeof auctions)[number]) => {
    const start = new Date(auction.scheduled_start);
    const isTimerOver = start <= new Date();
    const isFinished = auction.status === "finished" || isTimerOver;
    const items = itemsByAuction.get(auction.id) ?? [];

    return (
      <AccordionItem key={auction.id} value={auction.id} className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
        <AccordionTrigger className="hover:no-underline px-4 sm:px-5 py-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between w-full pr-3 gap-3">
            {/* Left: Title + badge */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Gavel className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm sm:text-base text-foreground block">{auction.title}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Countdown or status */}
            <div className="flex-shrink-0">
              <CountdownBlock
                targetDate={auction.scheduled_start}
                status={auction.status}
              />
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-4 sm:px-5 pb-5 space-y-4">
          {auction.description && (
            <p className="text-sm text-muted-foreground">{auction.description}</p>
          )}

          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item) => (
                <AuctionItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum imóvel cadastrado neste leilão</p>
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Gavel className="h-6 w-6 text-primary" /> Leilões
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seus investimentos em leilões</p>
      </div>

      {active.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Próximos & Ativos</h2>
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {active.map(renderAuction)}
          </Accordion>
        </div>
      )}

      {finished.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-muted-foreground mb-3">Encerrados</h2>
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {finished.map(renderAuction)}
          </Accordion>
        </div>
      )}

      {auctions?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Gavel className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum leilão disponível no momento</p>
        </div>
      )}
    </div>
  );
}
