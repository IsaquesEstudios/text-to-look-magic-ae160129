import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Loader2, Clock, UserCheck, UserX, Phone, MapPin, Globe, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Registration = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  country: string | null;
  address_city: string | null;
  address_state: string | null;
  postal_code: string | null;
  preferred_language: string;
  status: string;
  created_at: string;
};

export default function AdminRegistrosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["admin-registrations"],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, phone, whatsapp, country, address_city, address_state, postal_code, preferred_language, status, created_at, registration_dismissed")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get emails from auth via edge function or just show user_id
      // We'll get emails from a simple approach: check user_roles for admin exclusion
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin" as any);
      const adminIds = new Set((adminRoles ?? []).map(r => r.user_id));

      // Filter out admin users
      const nonAdminProfiles = (profiles ?? []).filter(p => !adminIds.has(p.user_id) && !p.registration_dismissed);

      return nonAdminProfiles.map(p => ({
        ...p,
        email: "", // We'll show user_id since we can't access auth.users directly
      })) as Registration[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status } as any)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: status === "approved" ? "Usuário aprovado" : "Usuário rejeitado",
        description: status === "approved"
          ? "O usuário agora pode acessar a plataforma."
          : "O acesso do usuário foi negado.",
      });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const dismissRegistration = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ registration_dismissed: true } as any)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
      toast({ title: "Registro ocultado", description: "O registro foi removido da lista." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const pending = registrations?.filter(r => r.status === "pending") ?? [];
  const approved = registrations?.filter(r => r.status === "approved") ?? [];
  const rejected = registrations?.filter(r => r.status === "rejected") ?? [];

  const langLabel = (code: string) => {
    switch (code) {
      case "pt": return "🇧🇷 Português";
      case "en": return "🇺🇸 English";
      case "es": return "🇪🇸 Español";
      default: return code;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case "approved":
        return <Badge variant="outline" className="text-green-500 border-green-500/30 gap-1"><UserCheck className="h-3 w-3" /> Aprovado</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-500 border-red-500/30 gap-1"><UserX className="h-3 w-3" /> Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const RegistrationCard = ({ reg, showActions }: { reg: Registration; showActions: boolean }) => (
    <Card className="border-border/50 bg-card/80">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {(reg.full_name || "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="font-semibold text-foreground text-sm break-words">
              {reg.full_name || "Sem nome"}
            </p>
            {statusBadge(reg.status)}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {reg.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 shrink-0" /> {reg.phone}
                </span>
              )}
              {reg.country && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3 shrink-0" /> {reg.country}
                </span>
              )}
              {(reg.address_city || reg.address_state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" /> {[reg.address_city, reg.address_state].filter(Boolean).join(", ")}
                </span>
              )}
              <span>{langLabel(reg.preferred_language)}</span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              Cadastrado {formatDistanceToNow(new Date(reg.created_at), { addSuffix: true, locale: ptBR })}
            </p>
            {showActions && (
              <div className="flex items-center gap-2 pt-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-500 border-green-500/30 hover:bg-green-500/10 gap-1 h-8 text-xs"
                  onClick={() => updateStatus.mutate({ userId: reg.user_id, status: "approved" })}
                  disabled={updateStatus.isPending}
                >
                  <Check className="h-3.5 w-3.5" /> Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 border-red-500/30 hover:bg-red-500/10 gap-1 h-8 text-xs"
                  onClick={() => updateStatus.mutate({ userId: reg.user_id, status: "rejected" })}
                  disabled={updateStatus.isPending}
                >
                  <X className="h-3.5 w-3.5" /> Rejeitar
                </Button>
              </div>
            )}
            {!showActions && reg.status === "rejected" && (
              <div className="flex items-center gap-2 pt-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-500 border-green-500/30 hover:bg-green-500/10 gap-1 h-8 text-xs"
                  onClick={() => updateStatus.mutate({ userId: reg.user_id, status: "approved" })}
                  disabled={updateStatus.isPending}
                >
                  <Check className="h-3.5 w-3.5" /> Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-muted-foreground border-border/50 hover:bg-secondary gap-1 h-8 text-xs"
                  onClick={() => dismissRegistration.mutate(reg.user_id)}
                  disabled={dismissRegistration.isPending}
                >
                  <EyeOff className="h-3.5 w-3.5" /> Ocultar
                </Button>
              </div>
            )}
            {!showActions && reg.status === "approved" && (
              <div className="pt-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-muted-foreground border-border/50 hover:bg-secondary gap-1 h-8 text-xs"
                  onClick={() => dismissRegistration.mutate(reg.user_id)}
                  disabled={dismissRegistration.isPending}
                >
                  <EyeOff className="h-3.5 w-3.5" /> Ocultar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Registros</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie as solicitações de acesso à plataforma</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="pending" className="gap-1 text-xs px-1.5">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">Pendentes</span>
            {pending.length > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] leading-none">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1 text-xs px-1.5">
            <UserCheck className="h-3 w-3 shrink-0" />
            <span className="truncate">Aprovados</span>
            <span className="text-[10px]">({approved.length})</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1 text-xs px-1.5">
            <UserX className="h-3 w-3 shrink-0" />
            <span className="truncate">Rejeitados</span>
            <span className="text-[10px]">({rejected.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum registro pendente</p>
            </div>
          ) : (
            pending.map(reg => <RegistrationCard key={reg.id} reg={reg} showActions />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3 mt-4">
          {approved.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Nenhum usuário aprovado ainda</p>
            </div>
          ) : (
            approved.map(reg => <RegistrationCard key={reg.id} reg={reg} showActions={false} />)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-3 mt-4">
          {rejected.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Nenhum usuário rejeitado</p>
            </div>
          ) : (
            rejected.map(reg => <RegistrationCard key={reg.id} reg={reg} showActions={false} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
