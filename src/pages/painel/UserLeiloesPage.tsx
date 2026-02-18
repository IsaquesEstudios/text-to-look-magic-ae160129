import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { markAuctionsRead } from "@/hooks/useUnreadAuctions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Gavel } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

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
      console.log("[UserLeiloesPage] Fetching auctions...");
      const { data, error } = await supabase
        .from("auctions")
        .select("*")
        .order("scheduled_start", { ascending: false });
      console.log("[UserLeiloesPage] Result:", { data, error, count: data?.length });
      if (error) throw error;
      return data;
    },
  });

  // Mark auctions as read when visiting this page
  useEffect(() => {
    if (user && auctions) {
      markAuctionsRead(user.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ["unread-auctions"] });
      });
    }
  }, [user, auctions, queryClient]);

  const active = auctions?.filter((a) => a.status !== "finished") ?? [];
  const finished = auctions?.filter((a) => a.status === "finished") ?? [];

  if (isLoading) return <div className="animate-pulse text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Gavel className="h-6 w-6 text-primary" /> Leilões
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Participe dos leilões e invista seus créditos</p>
      </div>

      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Próximos & Ativos</h2>
          <div className="grid gap-4">
            {active.map((auction) => {
              const now = new Date();
              const start = new Date(auction.scheduled_start);
              const isStarted = auction.status === "active" || start <= now;
              return (
                <Link key={auction.id} to={`/painel/leilao/${auction.id}`}>
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold truncate">{auction.title}</span>
                          {isStarted ? (
                            <Badge className="bg-discovery-green text-primary-foreground text-xs">Ativo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Em breve</Badge>
                          )}
                        </div>
                        {auction.description && <p className="text-xs text-muted-foreground line-clamp-1">{auction.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {isStarted ? (
                            <span className="text-xs text-discovery-green font-medium">Aberto</span>
                          ) : (
                            <MiniCountdown targetDate={auction.scheduled_start} />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(start, "dd MMM yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {finished.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Encerrados</h2>
          <div className="grid gap-3">
            {finished.map((auction) => (
              <Link key={auction.id} to={`/painel/leilao/${auction.id}`}>
                <Card className="opacity-60 hover:opacity-80 transition-opacity cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="font-medium text-sm">{auction.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(auction.scheduled_start), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
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
