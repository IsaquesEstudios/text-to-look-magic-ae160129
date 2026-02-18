import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { markAuctionsRead } from "@/hooks/useUnreadAuctions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Clock, CheckCircle, Eye, X, Search, MapPin, Home, TreePine, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

/* ─── Property Picker Component ─── */
function PropertyPicker({
  selectedIds,
  onAdd,
  onRemove,
}: {
  selectedIds: string[];
  onAdd: (property: any) => void;
  onRemove: (id: string) => void;
}) {
  const [search, setSearch] = useState("");

  const { data: properties } = useQuery({
    queryKey: ["all-properties-for-auction"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const available = properties?.filter(
    (p) =>
      !selectedIds.includes(p.id) &&
      (search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase()))
  );

  const selected = properties?.filter((p) => selectedIds.includes(p.id)) ?? [];

  const fmt = (v: number) =>
    v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="space-y-4">
      {/* Selected properties */}
      {selected.length > 0 && (
        <div className="space-y-2">
          {selected.map((p) => {
            const total = (p.estimated_auction_value ?? 0) + (p.estimated_renovation_cost ?? 0);
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt="" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {p.type === "house" ? <Home className="h-5 w-5 text-muted-foreground" /> : <TreePine className="h-5 w-5 text-muted-foreground" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{p.title}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {p.type === "house" ? "Casa" : "Terreno"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {p.location}{p.state_code ? `, ${p.state_code}` : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {fmt(total)}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => onRemove(p.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Search & add */}
      <div className="p-4 border border-dashed border-border rounded-xl space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar imóvel por nome ou cidade..."
            className="pl-9"
          />
        </div>

        {available && available.length > 0 ? (
          <div className="max-h-60 overflow-y-auto space-y-1">
            {available.map((p) => {
              const total = (p.estimated_auction_value ?? 0) + (p.estimated_renovation_cost ?? 0);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onAdd(p)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                >
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt="" className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {p.type === "house" ? <Home className="h-4 w-4 text-muted-foreground" /> : <TreePine className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{p.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.location}{p.state_code ? `, ${p.state_code}` : ""} • {fmt(total)}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">
                    {p.type === "house" ? "Casa" : "Terreno"}
                  </Badge>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            {search ? "Nenhum imóvel encontrado" : "Todos os imóveis já foram adicionados"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminLeiloesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduled_start: "",
  });
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);

  const { data: auctions, isLoading } = useQuery({
    queryKey: ["admin-auctions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auctions")
        .select("*")
        .order("scheduled_start", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (user && auctions) {
      markAuctionsRead(user.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ["unread-auctions"] });
      });
    }
  }, [user, auctions, queryClient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: auction, error } = await supabase
        .from("auctions")
        .insert({
          title: form.title,
          description: form.description || null,
          scheduled_start: new Date(form.scheduled_start).toISOString(),
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;

      if (selectedPropertyIds.length > 0) {
        // Fetch property data to populate auction_items
        const { data: props } = await supabase
          .from("properties")
          .select("*")
          .in("id", selectedPropertyIds);

        if (props && props.length > 0) {
          const { error: itemsError } = await supabase.from("auction_items").insert(
            props.map((p) => ({
              auction_id: auction.id,
              property_id: p.id,
              title: p.title,
              type: p.type === "house" ? "casa" : "terreno",
              location: `${p.location}${p.state_code ? `, ${p.state_code}` : ""}`,
              description: p.estimated_timeline || null,
              image_url: p.cover_image_url || null,
            }))
          );
          if (itemsError) throw itemsError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      toast({ title: "Leilão criado com sucesso!" });
      setShowForm(false);
      setForm({ title: "", description: "", scheduled_start: "" });
      setSelectedPropertyIds([]);
    },
    onError: (e: Error) => toast({ title: "Erro ao criar leilão", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("auctions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      toast({ title: "Leilão removido" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("auctions").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      toast({ title: "Status atualizado" });
    },
  });

  const getStatusBadge = (status: string, scheduledStart: string) => {
    const now = new Date();
    const start = new Date(scheduledStart);
    if (status === "finished") return <Badge variant="secondary">Encerrado</Badge>;
    if (status === "active" || (status === "upcoming" && start <= now))
      return <Badge className="bg-discovery-green text-primary-foreground">Ativo</Badge>;
    return <Badge variant="outline">Programado</Badge>;
  };

  const upcoming = auctions?.filter((a) => a.status !== "finished") ?? [];
  const finished = auctions?.filter((a) => a.status === "finished") ?? [];

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Novo Leilão</h1>
          <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Título do Leilão *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Leilão Março 2026" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes do leilão..." />
            </div>
            <div>
              <Label>Data e Hora de Início *</Label>
              <Input type="datetime-local" value={form.scheduled_start} onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Imóveis do Leilão</CardTitle>
            <p className="text-sm text-muted-foreground">Selecione os imóveis cadastrados que farão parte deste leilão</p>
          </CardHeader>
          <CardContent>
            <PropertyPicker
              selectedIds={selectedPropertyIds}
              onAdd={(p) => setSelectedPropertyIds((prev) => [...prev, p.id])}
              onRemove={(id) => setSelectedPropertyIds((prev) => prev.filter((pid) => pid !== id))}
            />
          </CardContent>
        </Card>

        <Button onClick={() => createMutation.mutate()} disabled={!form.title || !form.scheduled_start || createMutation.isPending} className="w-full sm:w-auto">
          {createMutation.isPending ? "Criando..." : "Criar Leilão"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leilões</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os leilões programados</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl h-10 px-5 font-medium">
          <PlusCircle className="h-4 w-4" /> Novo Leilão
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground animate-pulse">Carregando...</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Ativos & Programados</h2>
              <div className="grid gap-4">
                {upcoming.map((auction) => (
                  <Card key={auction.id}>
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground truncate">{auction.title}</span>
                          {getStatusBadge(auction.status, auction.scheduled_start)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {format(new Date(auction.scheduled_start), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={`/painel/leilao/${auction.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Eye className="h-4 w-4" /> Ver
                          </Button>
                        </Link>
                        {auction.status === "upcoming" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: auction.id, status: "active" })}>
                            Iniciar
                          </Button>
                        )}
                        {auction.status === "active" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: auction.id, status: "finished" })}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Encerrar
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(auction.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {finished.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">Encerrados</h2>
              <div className="grid gap-3">
                {finished.map((auction) => (
                  <Card key={auction.id} className="opacity-70">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-medium text-sm">{auction.title}</span>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(auction.scheduled_start), "dd MMM yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/painel/leilao/${auction.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            <Eye className="h-4 w-4" /> Detalhes
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(auction.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {auctions?.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p>Nenhum leilão cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo Leilão" para começar</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}