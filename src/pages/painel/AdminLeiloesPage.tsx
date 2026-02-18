import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { markAuctionsRead } from "@/hooks/useUnreadAuctions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Clock, CheckCircle, Eye, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { AuctionPropertyForm, AuctionPropertyData, emptyPropertyData } from "@/components/painel/admin/AuctionPropertyForm";

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
  const [propertyForms, setPropertyForms] = useState<AuctionPropertyData[]>([]);

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

      // Create each property + link to auction
      for (const pForm of propertyForms) {
        const totalProjeto = (parseFloat(pForm.estimated_auction_value) || 0) + (parseFloat(pForm.estimated_renovation_cost) || 0);

        const { data: prop, error: propError } = await supabase
          .from("properties")
          .insert({
            type: pForm.type,
            title: pForm.title.trim(),
            location: pForm.location.trim(),
            state_code: pForm.state_code || null,
            purchase_price: totalProjeto,
            estimated_auction_value: parseFloat(pForm.estimated_auction_value) || 0,
            estimated_renovation_cost: parseFloat(pForm.estimated_renovation_cost) || 0,
            estimated_return_pct: parseFloat(pForm.estimated_return_pct) || 0,
            estimated_sale_value: parseFloat(pForm.estimated_sale_value) || 0,
            total_shares: parseInt(pForm.total_shares) || 1,
            share_price: parseFloat(pForm.share_price) || 0,
            available_shares: parseInt(pForm.total_shares) || 1,
            status: pForm.status,
            cover_image_url: pForm.coverImage,
            estimated_timeline: pForm.estimated_timeline.trim(),
            created_by: user!.id,
          })
          .select("id")
          .single();
        if (propError) throw propError;

        // Gallery images
        if (pForm.galleryImages.length > 0) {
          await supabase.from("property_images").insert(
            pForm.galleryImages.map((url, i) => ({
              property_id: prop.id,
              image_url: url,
              sort_order: i,
            }))
          );
        }

        // Link to auction
        const { error: itemError } = await supabase.from("auction_items").insert({
          auction_id: auction.id,
          property_id: prop.id,
          title: pForm.title.trim(),
          type: pForm.type === "house" ? "casa" : "terreno",
          location: `${pForm.location.trim()}${pForm.state_code ? `, ${pForm.state_code}` : ""}`,
          description: pForm.estimated_timeline.trim() || null,
          image_url: pForm.coverImage,
        });
        if (itemError) throw itemError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      toast({ title: "Leilão criado com sucesso!" });
      setShowForm(false);
      setForm({ title: "", description: "", scheduled_start: "" });
      setPropertyForms([]);
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

        {/* Property forms */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Imóveis / Terrenos</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setPropertyForms((prev) => [...prev, { ...emptyPropertyData }])}
            >
              <Plus className="h-4 w-4" /> Adicionar Imóvel
            </Button>
          </div>

          {propertyForms.length === 0 && (
            <div className="text-center py-10 border border-dashed border-border rounded-xl text-muted-foreground">
              <p className="text-sm">Nenhum imóvel adicionado</p>
              <p className="text-xs mt-1">Clique em "Adicionar Imóvel" para incluir propriedades ao leilão</p>
            </div>
          )}

          {propertyForms.map((pData, idx) => (
            <AuctionPropertyForm
              key={idx}
              index={idx}
              data={pData}
              onChange={(updated) => {
                const copy = [...propertyForms];
                copy[idx] = updated;
                setPropertyForms(copy);
              }}
              onRemove={() => setPropertyForms((prev) => prev.filter((_, i) => i !== idx))}
            />
          ))}
        </div>

        <Button
          onClick={() => createMutation.mutate()}
          disabled={!form.title || !form.scheduled_start || createMutation.isPending}
          className="w-full sm:w-auto"
        >
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