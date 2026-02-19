import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShoppingCart, UserPlus, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type ActivityItem = {
  id: string;
  type: "share_purchase" | "user_registration";
  description: string;
  timestamp: string;
  icon: typeof ShoppingCart;
};

export default function AdminAtividadesPage() {
  const { user, isAdmin } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["admin-activity-full"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const [sharesRes, profilesRes] = await Promise.all([
        supabase
          .from("shares")
          .select("id, quantity, amount_paid, purchased_at, property_id, user_id")
          .order("purchased_at", { ascending: false })
          .limit(100),
        supabase
          .from("profiles")
          .select("id, user_id, full_name, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      const allProfiles = profilesRes.data ?? [];
      const nameMap = new Map(allProfiles.map((p) => [p.user_id, p.full_name || "Usuário"]));

      const shareUserIds = (sharesRes.data ?? []).map((s) => s.user_id).filter((id) => !nameMap.has(id));
      if (shareUserIds.length > 0) {
        const { data: extraProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", shareUserIds);
        (extraProfiles ?? []).forEach((p) => nameMap.set(p.user_id, p.full_name || "Usuário"));
      }

      const shareActivities: ActivityItem[] = (sharesRes.data ?? []).map((s) => ({
        id: `share-${s.id}`,
        type: "share_purchase" as const,
        description: `${nameMap.get(s.user_id) || "Usuário"} foi vinculado a um imóvel — $${Number(s.amount_paid).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        timestamp: s.purchased_at,
        icon: ShoppingCart,
      }));

      const profileActivities: ActivityItem[] = allProfiles.map((p) => ({
        id: `profile-${p.id}`,
        type: "user_registration" as const,
        description: `${p.full_name || "Novo usuário"} se registrou`,
        timestamp: p.created_at,
        icon: UserPlus,
      }));

      return [...shareActivities, ...profileActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Histórico de Atividades</h1>
        <p className="text-sm text-muted-foreground mt-1">Todas as ações realizadas no painel</p>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Atividades</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
          {!activities || activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atividade registrada</p>
          ) : (
            <div className="space-y-1">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
