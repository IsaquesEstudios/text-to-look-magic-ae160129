import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";

export function AdminUsersList() {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profiles?.length) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mb-4 opacity-50" />
          <p>Nenhum usuário cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {profiles.map((profile) => (
        <Card key={profile.id} className="bg-card/50 border-border/50">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-foreground">
                {profile.full_name || "Sem nome"}
              </p>
              <p className="text-sm text-muted-foreground">{profile.user_id}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="border-primary/30 text-primary">
                ${Number(profile.credits).toLocaleString("pt-BR")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
