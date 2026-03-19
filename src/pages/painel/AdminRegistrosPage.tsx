import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Loader2, Clock, UserCheck, UserX, Phone, MapPin, Globe, Search } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
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
  const [searchPending, setSearchPending] = useState("");
  const [searchApproved, setSearchApproved] = useState("");
  const [searchRejected, setSearchRejected] = useState("");

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["admin-registrations"],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, phone, whatsapp, country, address_city, address_state, postal_code, preferred_language, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin" as any);
      const adminIds = new Set((adminRoles ?? []).map(r => r.user_id));

      const nonAdminProfiles = (profiles ?? []).filter(p => !adminIds.has(p.user_id));

      return nonAdminProfiles.map(p => ({
        ...p,
        email: "",
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

  const filterBySearch = (list: Registration[], query: string) => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(r =>
      (r.full_name || "").toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q) ||
      (r.country || "").toLowerCase().includes(q) ||
      (r.address_city || "").toLowerCase().includes(q) ||
      (r.address_state || "").toLowerCase().includes(q)
    );
  };

  // Group by date
  const groupByDate = (list: Registration[]) => {
    const groups: Record<string, Registration[]> = {};
    list.forEach(r => {
      const dateKey = format(new Date(r.created_at), "dd/MM/yyyy");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(r);
    });
    return Object.entries(groups);
  };

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
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || "Buscar por nome, cidade, país..."}
        className="pl-9 h-9 text-sm bg-secondary/30 border-border/30"
      />
    </div>
  );

  const DateGroupedList = ({ items, showActions }: { items: Registration[]; showActions: boolean }) => {
    const groups = groupByDate(items);
    if (groups.length === 0) return null;
    return (
      <div className="space-y-5">
        {groups.map(([date, regs]) => (
          <div key={date} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider px-1">{date}</p>
            <div className="space-y-2">
              {regs.map(reg => <RegistrationCard key={reg.id} reg={reg} showActions={showActions} />)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredPending = filterBySearch(pending, searchPending);
  const filteredApproved = filterBySearch(approved, searchApproved);
  const filteredRejected = filterBySearch(rejected, searchRejected);

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
          {pending.length > 0 && <SearchInput value={searchPending} onChange={setSearchPending} />}
          {filteredPending.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{searchPending ? "Nenhum resultado encontrado" : "Nenhum registro pendente"}</p>
            </div>
          ) : (
            <DateGroupedList items={filteredPending} showActions />
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3 mt-4">
          {approved.length > 0 && <SearchInput value={searchApproved} onChange={setSearchApproved} />}
          {filteredApproved.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">{searchApproved ? "Nenhum resultado encontrado" : "Nenhum usuário aprovado ainda"}</p>
            </div>
          ) : (
            <DateGroupedList items={filteredApproved} showActions={false} />
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-3 mt-4">
          {rejected.length > 0 && <SearchInput value={searchRejected} onChange={setSearchRejected} />}
          {filteredRejected.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">{searchRejected ? "Nenhum resultado encontrado" : "Nenhum usuário rejeitado"}</p>
            </div>
          ) : (
            <DateGroupedList items={filteredRejected} showActions={false} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
