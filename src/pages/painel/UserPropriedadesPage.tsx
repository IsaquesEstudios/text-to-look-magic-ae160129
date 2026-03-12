import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePanelTranslation } from "@/hooks/usePanelTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin, Loader2, ArrowUpRight, Bell, TrendingUp, Percent } from "lucide-react";
import { Link } from "react-router-dom";
import { useMultiPropertyUnreadCounts } from "@/hooks/usePropertyUnreadCounts";

type AggregatedProperty = { prop: any; totalQuantity: number; totalPaid: number };

function useUserShares(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-shares-all", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("shares").select("*, properties(*)").eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
    refetchOnMount: "always",
    staleTime: 0,
  });
}

function aggregateByType(shares: any[], type: string): AggregatedProperty[] {
  const map = new Map<string, AggregatedProperty>();
  shares.forEach((s) => {
    const prop = s.properties as any;
    if (!prop || prop.type !== type) return;
    const existing = map.get(prop.id);
    if (existing) { existing.totalQuantity += s.quantity; existing.totalPaid += Number(s.amount_paid); }
    else { map.set(prop.id, { prop, totalQuantity: s.quantity, totalPaid: Number(s.amount_paid) }); }
  });
  return Array.from(map.values());
}

function computeKpis(aggregated: AggregatedProperty[]) {
  let invested = 0, estimated = 0;
  aggregated.forEach(({ totalPaid, prop }) => {
    invested += totalPaid;
    const auctionVal = Number(prop.estimated_auction_value) || 0;
    const renovationVal = Number(prop.estimated_renovation_cost) || 0;
    const totalProject = auctionVal + renovationVal;
    const saleVal = Number(prop.estimated_sale_value) || 0;
    const participation = totalProject > 0 ? totalPaid / totalProject : 0;
    estimated += totalPaid + (participation * (saleVal - totalProject));
  });
  return { totalInvested: invested, totalEstimatedReturn: estimated };
}

function KPICards({ aggregated, p }: { aggregated: AggregatedProperty[]; p: any }) {
  const { totalInvested, totalEstimatedReturn } = computeKpis(aggregated);
  const roi = totalInvested > 0 ? ((totalEstimatedReturn - totalInvested) / totalInvested) * 100 : 0;
  if (aggregated.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-5">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-primary" /></div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.totalInvested}</p>
          <p className="text-lg font-bold text-foreground">${totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-5">
        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-accent" /></div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.estimatedReturn}</p>
          <p className={`text-lg font-bold ${totalEstimatedReturn >= totalInvested ? 'text-primary' : 'text-destructive'}`}>
            ${totalEstimatedReturn.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-card/40 p-5">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Percent className="h-5 w-5 text-primary" /></div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.estimatedROI}</p>
          <p className={`text-lg font-bold ${roi >= 0 ? 'text-primary' : 'text-destructive'}`}>{roi.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

function PropertyGrid({ aggregated, emptyIcon: EmptyIcon, emptyText, p }: { aggregated: AggregatedProperty[]; emptyIcon: any; emptyText: string; p: any }) {
  const propertyIds = aggregated.map((a) => a.prop.id);
  const { data: unreadMap } = useMultiPropertyUnreadCounts(propertyIds);

  const sorted = [...aggregated].sort((a, b) => {
    const aU = unreadMap ? (unreadMap.get(a.prop.id)?.novidades ?? 0) + (unreadMap.get(a.prop.id)?.gastos ?? 0) : 0;
    const bU = unreadMap ? (unreadMap.get(b.prop.id)?.novidades ?? 0) + (unreadMap.get(b.prop.id)?.gastos ?? 0) : 0;
    return bU - aU;
  });

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/40 flex flex-col items-center justify-center py-20 text-muted-foreground">
        <EmptyIcon className="h-9 w-9 mb-3 opacity-25" /><p className="text-sm">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map(({ prop, totalPaid }) => {
        const auctionVal = Number(prop.estimated_auction_value) || 0;
        const renovationVal = Number(prop.estimated_renovation_cost) || 0;
        const totalProject = auctionVal + renovationVal;
        const saleVal = Number(prop.estimated_sale_value) || 0;
        const roiPct = totalProject > 0 ? ((saleVal - totalProject) / totalProject) * 100 : 0;
        const participation = totalProject > 0 ? totalPaid / totalProject : 0;
        const estimatedValue = totalPaid + (participation * (saleVal - totalProject));
        const counts = unreadMap?.get(prop.id);
        const totalUnread = (counts?.novidades ?? 0) + (counts?.gastos ?? 0);

        return (
          <Link key={prop.id} to={`/painel/imovel/${prop.id}`} className="group relative flex flex-col rounded-2xl border border-border/30 bg-card overflow-hidden hover:shadow-lg transition-all duration-300">
            {totalUnread > 0 && (
              <span className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md">
                <Bell className="h-3 w-3" />{totalUnread > 9 ? "+9" : totalUnread}
              </span>
            )}
            <div className="aspect-[16/10] bg-secondary/50 overflow-hidden">
              {prop.cover_image_url ? (
                <img src={prop.cover_image_url} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><EmptyIcon className="h-8 w-8 text-muted-foreground/20" /></div>
              )}
            </div>
            <div className="p-4 flex flex-col gap-3 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground leading-tight">{prop.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{prop.location}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center mt-auto">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{p.invested}</p>
                  <p className="font-semibold text-sm text-foreground">${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{p.estimatedReturnShort}</p>
                  <p className="font-semibold text-sm text-primary">${estimatedValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  {p.estimatedReturnBadge.replace("{pct}", roiPct.toFixed(1))}
                </Badge>
                {participation > 0 && (
                  <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                    {p.participationBadge.replace("{pct}", (participation * 100).toFixed(1))}
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function UserPropriedadesPage() {
  const { user } = useAuth();
  const { p } = usePanelTranslation();
  const { data: shares, isLoading } = useUserShares(user?.id);
  const [activeTab, setActiveTab] = useState("house");

  const houses = aggregateByType(shares ?? [], "house");
  const lands = aggregateByType(shares ?? [], "land");

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{p.myProjects}</h1>
        <p className="text-sm text-muted-foreground mt-1">{p.propertiesAndLands}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 border-0 p-1 rounded-xl h-auto">
          <TabsTrigger value="house" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2 text-sm">
            <Building2 className="h-4 w-4" />{p.housesTab}
            {houses.length > 0 && (<><span className="w-px h-3.5 bg-border/60 mx-1" /><span className="text-xs text-muted-foreground">{houses.length}</span></>)}
          </TabsTrigger>
          <TabsTrigger value="land" className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2 text-sm">
            <MapPin className="h-4 w-4" />{p.landsTab}
            {lands.length > 0 && (<><span className="w-px h-3.5 bg-border/60 mx-1" /><span className="text-xs text-muted-foreground">{lands.length}</span></>)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="house" className="mt-6 space-y-6">
          <KPICards aggregated={houses} p={p} />
          <PropertyGrid aggregated={houses} emptyIcon={Building2} emptyText={p.noLinkedHouses} p={p} />
        </TabsContent>
        <TabsContent value="land" className="mt-6 space-y-6">
          <KPICards aggregated={lands} p={p} />
          <PropertyGrid aggregated={lands} emptyIcon={MapPin} emptyText={p.noLinkedLands} p={p} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
