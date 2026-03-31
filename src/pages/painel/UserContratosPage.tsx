import { useState } from "react";
import { useDemoGuard } from "@/hooks/useDemoGuard";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, CheckCircle2, Clock, ExternalLink, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { AdminContractForm } from "@/components/painel/admin/AdminContractForm";
import { UserContractUploadForm } from "@/components/painel/UserContractUploadForm";

export default function UserContratosPage() {
  const { user, isAdmin, isDemoUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isDemoBlocked = useDemoGuard();
  const [signing, setSigning] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [signDialog, setSignDialog] = useState<{ id: string; title: string; type: "user" | "admin" } | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["user-contracts", user?.id],
    queryFn: async () => {
      const query = supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query.eq("user_id", user!.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch profile names for admin view
  const { data: profiles } = useQuery({
    queryKey: ["contract-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data || [];
    },
    enabled: !!user && isAdmin,
  });

  const getProfileName = (userId: string) => {
    return profiles?.find((p) => p.user_id === userId)?.full_name || "—";
  };

  const openSignDialog = (contractId: string, title: string, type: "user" | "admin") => {
    setAgreed(false);
    setSignDialog({ id: contractId, title, type });
  };

  const handleConfirmSign = async () => {
    if (!signDialog) return;
    if (isDemoBlocked()) return;
    setSigning(signDialog.id);
    const updateField = signDialog.type === "user" ? "user_signed_at" : "admin_signed_at";
    const { error } = await supabase
      .from("contracts")
      .update({ [updateField]: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", signDialog.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["user-contracts"] });
      toast({ title: signDialog.type === "user" ? "Contrato assinado com sucesso!" : "Contrato assinado pelo admin!" });
    }
    setSigning(null);
    setSignDialog(null);
  };

  const handleDelete = async (contractId: string) => {
    if (isDemoBlocked()) return;
    const { error } = await supabase.from("contracts").delete().eq("id", contractId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["user-contracts"] });
      toast({ title: "Contrato removido" });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const getStatus = (c: any) => {
    if (c.user_signed_at && c.admin_signed_at) return "complete";
    if (c.user_signed_at) return "awaiting_admin";
    return "awaiting_user";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Contratos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? "Gerencie contratos dos investidores" : "Contratos de investimento para assinatura"}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl">
          <PlusCircle className="h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      {showForm && (
        isAdmin ? (
          <AdminContractForm onClose={() => setShowForm(false)} />
        ) : (
          <UserContractUploadForm userId={user!.id} onClose={() => setShowForm(false)} />
        )
      )}

      {!contracts?.length ? (
        <div className="rounded-2xl border border-dashed border-border/40 flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FileText className="h-9 w-9 mb-3 opacity-25" />
          <p className="text-sm">Nenhum contrato disponível</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => {
            const status = getStatus(contract);
            return (
              <Card key={contract.id} className="bg-card/50 border-border/50">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground">{contract.title}</h3>
                        {isAdmin && (
                          <p className="text-xs text-muted-foreground">
                            Investidor: {getProfileName(contract.user_id)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(contract.created_at), "dd MMM yyyy", { locale: ptBR })}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {contract.user_signed_at ? (
                            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Investidor assinou • {format(new Date(contract.user_signed_at), "dd/MM/yyyy", { locale: ptBR })}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 gap-1">
                              <Clock className="h-3 w-3" />
                              Aguardando assinatura do investidor
                            </Badge>
                          )}
                          {contract.admin_signed_at ? (
                            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Discovery assinou • {format(new Date(contract.admin_signed_at), "dd/MM/yyyy", { locale: ptBR })}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground gap-1">
                              <Clock className="h-3 w-3" />
                              Aguardando assinatura da Discovery
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setPdfViewer({ url: contract.pdf_url, title: contract.title })}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver PDF
                      </Button>

                      {!isAdmin && !contract.user_signed_at && (
                        <Button
                          variant="cta"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => openSignDialog(contract.id, contract.title, "user")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Assinar
                        </Button>
                      )}

                      {isAdmin && !contract.admin_signed_at && (
                        <Button
                          variant="cta"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => openSignDialog(contract.id, contract.title, "admin")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Assinar
                        </Button>
                      )}

                      {(isAdmin || contract.user_id === user?.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(contract.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {status === "complete" && (
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Concluído
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!signDialog} onOpenChange={(open) => { if (!open) setSignDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assinar Contrato</DialogTitle>
            <DialogDescription className="pt-2">
              Você está prestes a assinar o contrato: <strong className="text-foreground">{signDialog?.title}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Antes de assinar, certifique-se de que leu o documento PDF completo. Ao marcar a caixa abaixo e confirmar, sua assinatura digital será registrada com data e hora.
            </p>

            <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/30 p-4">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="agree" className="text-sm leading-relaxed cursor-pointer select-none">
                Declaro que li integralmente o contrato e concordo com todos os termos e condições nele estabelecidos.
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSignDialog(null)}>Cancelar</Button>
            <Button
              variant="cta"
              disabled={!agreed || signing === signDialog?.id}
              onClick={handleConfirmSign}
              className="gap-1.5"
            >
              {signing === signDialog?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirmar Assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pdfViewer} onOpenChange={(open) => { if (!open) setPdfViewer(null); }}>
        <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{pdfViewer?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 px-6 pb-6">
            <iframe
              src={pdfViewer?.url}
              className="w-full h-full rounded-lg border border-border/50"
              title="Visualizador de contrato"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
