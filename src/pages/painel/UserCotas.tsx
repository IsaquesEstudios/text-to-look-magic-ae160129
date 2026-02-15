import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, MapPin, ArrowUpRight, Bell } from "lucide-react";
import { PainelLayout } from "@/components/painel/PainelLayout";
import { useMultiPropertyUnreadCounts } from "@/hooks/usePropertyUnreadCounts";

export default function UserCotas() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

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

  // Aggregate shares by property
  const propertyMap = new Map<string, { prop: any; totalQuantity: number; totalPaid: number }>();
  shares?.forEach((share) => {
    const prop = share.properties as any;
    if (!prop) return;
    const existing = propertyMap.get(prop.id);
    if (existing) {
      existing.totalQuantity += share.quantity;
      existing.totalPaid += Number(share.amount_paid);
    } else {
      propertyMap.set(prop.id, {
        prop,
        totalQuantity: share.quantity,
        totalPaid: Number(share.amount_paid),
      });
    }
  });
  const aggregated = Array.from(propertyMap.values());
  const propertyIds = aggregated.map((a) => a.prop.id);

  const { data: unreadMap } = useMultiPropertyUnreadCounts(propertyIds);

  // Sort: properties with unread items first
  const sorted = [...aggregated].sort((a, b) => {
    const aUnread = unreadMap ? (unreadMap.get(a.prop.id)?.novidades ?? 0) + (unreadMap.get(a.prop.id)?.gastos ?? 0) : 0;
    const bUnread = unreadMap ? (unreadMap.get(b.prop.id)?.novidades ?? 0) + (unreadMap.get(b.prop.id)?.gastos ?? 0) : 0;
    return bUnread - aUnread;
  });

  if (authLoading || isLoading) {
    return (
      <PainelLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </PainelLayout>
    );
  }

  if (!user) return null;

  return (
    <PainelLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Minhas Cotas</h1>
          <p className="text-sm text-muted-foreground mt-1">Imóveis em que você participa</p>
        </div>

        {!sorted.length ? (
          <div className="rounded-2xl border border-dashed border-border/40 flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Building2 className="h-9 w-9 mb-3 opacity-25" />
            <p className="text-sm">Você ainda não possui cotas</p>
            <Link to="/painel/oportunidades" className="text-xs text-primary hover:underline mt-2">
              Ver oportunidades →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(({ prop, totalQuantity, totalPaid }) => {
              const returnPct = Number(prop.estimated_return_pct);
              const estimatedValue = totalPaid * (1 + returnPct / 100);
              const counts = unreadMap?.get(prop.id);
              const totalUnread = (counts?.novidades ?? 0) + (counts?.gastos ?? 0);

              return (
                <Link
                  key={prop.id}
                  to={`/painel/imovel/${prop.id}`}
                  className="group relative flex flex-col rounded-2xl border border-border/30 bg-card overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  {totalUnread > 0 && (
                    <span className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md">
                      <Bell className="h-3 w-3" />
                      {totalUnread > 9 ? "+9" : totalUnread}
                    </span>
                  )}
                  <div className="aspect-[16/10] bg-secondary/50 overflow-hidden">
                    {prop.cover_image_url ? (
                      <img
                        src={prop.cover_image_url}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground leading-tight">{prop.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {prop.location}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center mt-auto">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Cotas</p>
                        <p className="font-semibold text-sm text-foreground">
                          {prop.total_shares - (prop.available_shares ?? 0)}<span className="text-muted-foreground/60 font-normal">/{prop.total_shares}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Investido</p>
                        <p className="font-semibold text-sm text-foreground">${totalPaid.toLocaleString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Retorno</p>
                        <p className="font-semibold text-sm text-primary">${estimatedValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>

                    <Badge variant="outline" className="w-fit text-[10px] border-primary/30 text-primary">
                      {returnPct}% retorno estimado
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PainelLayout>
  );
}
