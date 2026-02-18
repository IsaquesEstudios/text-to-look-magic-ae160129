import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { markAuctionsRead } from "@/hooks/useUnreadAuctions";
import { Badge } from "@/components/ui/badge";
import { Clock, Gavel, MapPin, Home, TreePine } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function MiniCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Iniciado!"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [targetDate]);

  return <span className="font-mono text-xs">{timeLeft}</span>;
}

export default function UserLeiloesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
    const now = new Date();
    const start = new Date(auction.scheduled_start);
    const isStarted = auction.status === "active" || start <= now;
    const items = itemsByAuction.get(auction.id) ?? [];

    return (
      <AccordionItem key={auction.id} value={auction.id} className="border-b border-border/50">
        <AccordionTrigger className="hover:no-underline px-1 py-4">
          <div className="flex items-center justify-between w-full pr-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-semibold text-sm truncate">{auction.title}</span>
              {isStarted && auction.status !== "finished" ? (
                <Badge className="bg-discovery-green text-primary-foreground text-[10px] px-2">Ativo</Badge>
              ) : auction.status === "finished" ? (
                <Badge variant="secondary" className="text-[10px] px-2">Encerrado</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-2">Em breve</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {isStarted ? (
                <span className="text-xs text-discovery-green font-medium">Aberto</span>
              ) : (
                <MiniCountdown targetDate={auction.scheduled_start} />
              )}
              <span className="text-[10px] hidden sm:inline">
                {format(start, "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-1 pb-4">
          {auction.description && (
            <p className="text-xs text-muted-foreground mb-3">{auction.description}</p>
          )}
          {items.length > 0 ? (
            <div className="grid gap-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {item.type === "terreno" ? (
                      <TreePine className="h-4 w-4 text-primary" />
                    ) : (
                      <Home className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {item.location}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Nenhum imóvel cadastrado neste leilão</p>
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
          <h2 className="text-lg font-semibold mb-2">Próximos & Ativos</h2>
          <Accordion type="single" collapsible>
            {active.map(renderAuction)}
          </Accordion>
        </div>
      )}

      {finished.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-muted-foreground mb-2">Encerrados</h2>
          <Accordion type="single" collapsible>
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
