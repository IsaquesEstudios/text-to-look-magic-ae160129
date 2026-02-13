import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, MapPin, ArrowUpRight } from "lucide-react";
import { PainelLayout } from "@/components/painel/PainelLayout";

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

        {!shares?.length ? (
          <div className="rounded-2xl border border-dashed border-border/40 flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Building2 className="h-9 w-9 mb-3 opacity-25" />
            <p className="text-sm">Você ainda não possui cotas</p>
            <Link to="/painel/oportunidades" className="text-xs text-primary hover:underline mt-2">
              Ver oportunidades →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => {
              const prop = share.properties as any;
              if (!prop) return null;
              const returnPct = Number(prop.estimated_return_pct);
              const estimatedValue = Number(share.amount_paid) * (1 + returnPct / 100);

              return (
                <Link
                  key={share.id}
                  to={`/painel/imovel/${prop.id}`}
                  className="group flex rounded-2xl border border-border/30 bg-card/40 overflow-hidden hover:bg-card/70 transition-all duration-300"
                >
                  <div className="w-32 sm:w-44 flex-shrink-0 bg-secondary/50">
                    {prop.cover_image_url ? (
                      <img
                        src={prop.cover_image_url}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[120px] flex items-center justify-center">
                        <Building2 className="h-7 w-7 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-5 flex flex-col justify-center">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{prop.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {prop.location}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>

                    <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-sm">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Cotas</p>
                        <p className="font-semibold text-foreground">{share.quantity}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Investido</p>
                        <p className="font-semibold text-foreground">${Number(share.amount_paid).toLocaleString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">Retorno Est.</p>
                        <p className="font-semibold text-primary">${estimatedValue.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    <Badge variant="outline" className="mt-3 w-fit text-[10px] border-primary/30 text-primary">
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
