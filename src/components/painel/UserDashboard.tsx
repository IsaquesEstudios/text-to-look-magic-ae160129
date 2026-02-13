import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, PieChart, Building2, Loader2, MapPin, ArrowUpRight } from "lucide-react";
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

  const { data: availableProperties, isLoading: loadingProperties } = useQuery({
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

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Olá, {profile?.full_name?.split(" ")[0] || "Investidor"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe seus investimentos e oportunidades
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
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
      </div>

      {/* My Properties */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Minhas Cotas</h2>
        {!shares?.length ? (
          <div className="rounded-2xl border border-dashed border-border/40 flex flex-col items-center justify-center py-14 text-muted-foreground">
            <Building2 className="h-9 w-9 mb-3 opacity-25" />
            <p className="text-sm">Você ainda não possui cotas</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Explore as oportunidades abaixo</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {shares.map((share) => {
              const prop = share.properties as any;
              if (!prop) return null;
              return (
                <Link
                  key={share.id}
                  to={`/painel/imovel/${prop.id}`}
                  className="group flex rounded-2xl border border-border/30 bg-card/40 overflow-hidden hover:bg-card/70 transition-all duration-300"
                >
                  <div className="w-28 sm:w-36 flex-shrink-0 bg-secondary/50">
                    {prop.cover_image_url ? (
                      <img
                        src={prop.cover_image_url}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-7 w-7 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{prop.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {prop.location}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex gap-6 mt-3 text-sm">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Cotas</p>
                        <p className="font-semibold text-foreground">{share.quantity}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Investido</p>
                        <p className="font-semibold text-foreground">
                          ${Number(share.amount_paid).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Available Properties */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Oportunidades</h2>
          {availableProperties && availableProperties.length > 0 && (
            <span className="text-xs text-muted-foreground/60">
              {availableProperties.length} disponíve{availableProperties.length === 1 ? "l" : "is"}
            </span>
          )}
        </div>
        {loadingProperties ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !availableProperties?.length ? (
          <div className="rounded-2xl border border-dashed border-border/40 flex flex-col items-center justify-center py-14 text-muted-foreground">
            <Building2 className="h-9 w-9 mb-3 opacity-25" />
            <p className="text-sm">Nenhum imóvel disponível no momento</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableProperties.map((property) => (
              <Link
                key={property.id}
                to={`/painel/imovel/${property.id}`}
                className="group rounded-2xl border border-border/30 bg-card/40 overflow-hidden hover:bg-card/70 hover:border-primary/20 transition-all duration-300"
              >
                <div className="aspect-[16/10] relative bg-secondary/50 overflow-hidden">
                  {property.cover_image_url ? (
                    <img
                      src={property.cover_image_url}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}
                  <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground border-0 text-[10px] font-medium shadow-sm">
                    {property.available_shares} cota{property.available_shares > 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{property.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {property.location}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/20">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Por cota</p>
                      <p className="font-bold text-foreground text-sm">
                        ${Number(property.share_price).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Retorno</p>
                      <p className="font-bold text-primary text-sm">
                        {Number(property.estimated_return_pct)}%
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
