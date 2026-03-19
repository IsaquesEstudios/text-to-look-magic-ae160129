import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, MapPin, Home, TreePine, Loader2, Building2, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  available: { label: "Disponível", variant: "default" },
  auctioned: { label: "Arrematado", variant: "secondary" },
  waiting_permit: { label: "Aguardando Alvará", variant: "outline" },
  renovation_in_progress: { label: "Reforma em Andamento", variant: "outline" },
  for_sale: { label: "À Venda", variant: "default" },
  under_contract: { label: "Sob Contrato", variant: "secondary" },
  sold: { label: "Vendido", variant: "outline" },
};

interface InvestorInfo {
  user_id: string;
  full_name: string | null;
  amount_paid: number;
}

interface Props {
  onEdit: (id: string) => void;
  filterType?: "house" | "land";
}

export function AdminPropertiesList({ onEdit, filterType }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [investors, setInvestors] = useState<InvestorInfo[]>([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);

  const { data: properties, isLoading } = useQuery({
    queryKey: ["admin-properties", filterType ?? "all"],
    queryFn: async () => {
      let query = supabase.from("properties").select("*");
      if (filterType) {
        query = query.eq("type", filterType);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchOnMount: "always",
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const { error } = await supabase.rpc("admin_delete_property", { p_property_id: propertyId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["user-properties"] });
      toast({ title: "Imóvel excluído com sucesso" });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  const handleDeleteClick = async (property: { id: string; title: string }) => {
    setLoadingInvestors(true);
    setDeleteTarget(property);

    // Fetch investors linked to this property
    const { data: shares } = await supabase
      .from("shares")
      .select("user_id, amount_paid")
      .eq("property_id", property.id);

    if (shares && shares.length > 0) {
      // Consolidate by user_id
      const userMap = new Map<string, number>();
      shares.forEach((s) => {
        userMap.set(s.user_id, (userMap.get(s.user_id) || 0) + Number(s.amount_paid));
      });

      // Get names
      const userIds = Array.from(userMap.keys());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const result: InvestorInfo[] = userIds.map((uid) => ({
        user_id: uid,
        full_name: profiles?.find((p) => p.user_id === uid)?.full_name || "Sem nome",
        amount_paid: userMap.get(uid) || 0,
      }));

      setInvestors(result);
    } else {
      setInvestors([]);
    }
    setLoadingInvestors(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!properties?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Building2 className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">Nenhum imóvel cadastrado</p>
      </div>
    );
  }

  const totalRefund = investors.reduce((sum, i) => sum + i.amount_paid, 0);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => {
          const status = statusLabels[property.status] || statusLabels.available;
          const auction = Number(property.estimated_auction_value || 0);
          const renovation = Number(property.estimated_renovation_cost || 0);
          const serviceFee = property.type === "house" ? 5000 : 500;
          const totalProject = auction + serviceFee + renovation + renovation * 0.12;
          const sale = Number(property.estimated_sale_value || 0);
          const roi = totalProject > 0 ? ((sale - totalProject) / totalProject) * 100 : 0;
          return (
            <Card
              key={property.id}
              className="group border-border/30 bg-card/40 overflow-hidden hover:bg-card/70 transition-all duration-300"
            >
              <div className="aspect-[16/10] relative bg-secondary/50">
                {property.cover_image_url ? (
                  <img
                    src={property.cover_image_url}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {property.type === "house" ? (
                      <Home className="h-10 w-10 text-muted-foreground/20" />
                    ) : (
                      <TreePine className="h-10 w-10 text-muted-foreground/20" />
                    )}
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant={status.variant} className="text-xs font-medium shadow-sm">
                    {status.label}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{property.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{property.location}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => onEdit(property.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteClick({ id: property.id, title: property.title })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-1">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Est. Arremate</p>
                    <p className="font-semibold text-foreground">
                      ${auction.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Est. Reforma</p>
                    <p className="font-semibold text-foreground">
                      ${renovation.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Est. Total</p>
                    <p className="font-semibold text-foreground">
                      ${totalProject.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Est. Venda</p>
                    <p className="font-semibold text-foreground">
                      ${sale.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Est. Retorno</p>
                    <p className={`font-semibold ${roi > 0 ? "text-primary" : roi < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {roi.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <Link
                  to={`/painel/imovel/${property.id}`}
                  className="block text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-1"
                >
                  Ver detalhes →
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir imóvel
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Tem certeza que deseja excluir <strong className="text-foreground">{deleteTarget?.title}</strong>?
                  Esta ação é irreversível.
                </p>

                {loadingInvestors ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verificando investidores...
                  </div>
                ) : investors.length > 0 ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                    <p className="text-sm font-medium text-destructive">
                      ⚠️ {investors.length} investidor(es) vinculado(s) serão reembolsados:
                    </p>
                    <ul className="space-y-1">
                      {investors.map((inv) => (
                        <li key={inv.user_id} className="text-sm flex justify-between">
                          <span className="text-foreground">{inv.full_name}</span>
                          <span className="font-mono font-medium text-foreground">
                            +${inv.amount_paid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-destructive/20 pt-2 flex justify-between text-sm font-semibold">
                      <span>Total a estornar</span>
                      <span className="font-mono text-foreground">
                        ${totalRefund.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O valor investido (sem taxas) será devolvido ao saldo de cada investidor.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum investidor vinculado a este imóvel.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending || loadingInvestors}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir imóvel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
