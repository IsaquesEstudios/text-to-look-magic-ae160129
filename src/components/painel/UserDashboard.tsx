import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, PieChart, Building2, Loader2, MapPin } from "lucide-react";
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
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Meus Investimentos</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-xl bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Créditos Disponíveis</p>
              <p className="text-xl font-bold text-foreground">
                ${credits.toLocaleString("pt-BR")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <PieChart className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Investido</p>
              <p className="text-xl font-bold text-foreground">
                ${totalInvested.toLocaleString("pt-BR")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-xl bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Retorno Estimado</p>
              <p className="text-xl font-bold text-primary">
                ${estimatedReturn.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">*estimativa</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Meus Imóveis</h2>
        {!shares?.length ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-4 opacity-50" />
              <p>Você ainda não participa de nenhuma cota</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {shares.map((share) => {
              const prop = share.properties as any;
              if (!prop) return null;
              return (
                <Card key={share.id} className="bg-card/50 border-border/50 overflow-hidden">
                  <div className="flex">
                    <div className="w-32 h-32 bg-muted flex-shrink-0">
                      {prop.cover_image_url ? (
                        <img
                          src={prop.cover_image_url}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <CardContent className="flex-1 p-4">
                      <h3 className="font-semibold text-foreground">{prop.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="h-3 w-3" />
                        {prop.location}
                      </p>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Cotas</p>
                          <p className="font-medium text-foreground">{share.quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Investido</p>
                          <p className="font-medium text-foreground">
                            ${Number(share.amount_paid).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/painel/imovel/${prop.id}`}
                        className="text-xs text-primary hover:underline mt-2 inline-block"
                      >
                        Ver detalhes →
                      </Link>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
