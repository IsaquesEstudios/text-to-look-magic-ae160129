import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { markAuctionsRead } from "@/hooks/useUnreadAuctions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Gavel, MapPin, Home, TreePine, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function CountdownBlock({ targetDate, status }: { targetDate: string; status: string }) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0 || status === "active") {
        setIsStarted(true);
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

  if (status === "finished") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Encerrado</span>
      </div>
    );
  }

  if (isStarted) {
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-discovery-green opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-discovery-green" />
        </span>
        <span className="text-sm font-bold text-discovery-green">AO VIVO</span>
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
  return (
    <div className="group relative overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30">
      {/* Image or placeholder */}
      {item.image_url ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px]">
            {item.type === "terreno" ? "Terreno" : "Casa"}
          </Badge>
        </div>
      ) : (
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary/50 flex items-center justify-center">
          {item.type === "terreno" ? (
            <TreePine className="h-10 w-10 text-muted-foreground/30" />
          ) : (
            <Home className="h-10 w-10 text-muted-foreground/30" />
          )}
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px]">
            {item.type === "terreno" ? "Terreno" : "Casa"}
          </Badge>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <p className="font-semibold text-sm text-foreground truncate">{item.title}</p>
        {item.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
            <MapPin className="h-3 w-3 text-primary flex-shrink-0" /> {item.location}
          </p>
        )}
        {item.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
        )}
      </div>
    </div>
  );
}

export default function UserLeiloesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: auctions, isLoading } = useQuery({
    queryKey: ["user-auctions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auctions")
        .select("*")
        .order("scheduled_start", { ascending: false });
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
        .select("*")
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
    const isStarted = auction.status === "active" || start <= new Date();
    const items = itemsByAuction.get(auction.id) ?? [];

    return (
      <AccordionItem key={auction.id} value={auction.id} className="border border-border/50 rounded-xl mb-3 overflow-hidden bg-card/50">
        <AccordionTrigger className="hover:no-underline px-4 sm:px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-3 gap-3">
            {/* Left: Title + badge */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Gavel className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm sm:text-base text-foreground truncate block">{auction.title}</span>
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
              <CountdownBlock targetDate={auction.scheduled_start} status={auction.status} />
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-4 sm:px-5 pb-5">
          {auction.description && (
            <p className="text-sm text-muted-foreground mb-4">{auction.description}</p>
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
        <p className="text-sm text-muted-foreground mt-1">Participe dos leilões e invista seus créditos</p>
      </div>

      {active.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Próximos & Ativos</h2>
          <Accordion type="single" collapsible className="space-y-0">
            {active.map(renderAuction)}
          </Accordion>
        </div>
      )}

      {finished.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-muted-foreground mb-3">Encerrados</h2>
          <Accordion type="single" collapsible className="space-y-0">
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
