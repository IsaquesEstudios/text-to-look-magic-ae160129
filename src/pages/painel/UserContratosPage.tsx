import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePanelTranslation } from "@/hooks/usePanelTranslation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const dateFnsLocales: Record<string, any> = { pt: ptBR, en: enUS, es };

export default function UserContratosPage() {
  const { user, isAdmin } = useAuth();
  const { p, lang } = usePanelTranslation();
  const dateLocale = dateFnsLocales[lang] || ptBR;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [signing, setSigning] = useState<string | null>(null);

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

  const handleUserSign = async (contractId: string) => {
    setSigning(contractId);
    const { error } = await supabase
      .from("contracts")
      .update({ user_signed_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
      .eq("id", contractId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["user-contracts"] });
      toast({ title: "Contrato assinado com sucesso!" });
    }
    setSigning(null);
  };

  const handleAdminSign = async (contractId: string) => {
    setSigning(contractId);
    const { error } = await supabase
      .from("contracts")
      .update({ admin_signed_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
      .eq("id", contractId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["user-contracts"] });
      toast({ title: "Contrato assinado pelo admin!" });
    }
    setSigning(null);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Contratos</h1>
        <p className="text-sm text-muted-foreground mt-1">Contratos de investimento para assinatura</p>
      </div>

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
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(contract.created_at), "dd MMM yyyy", { locale: dateLocale })}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {/* User signature status */}
                          <div className="flex items-center gap-1.5">
                            {contract.user_signed_at ? (
                              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Investidor assinou • {format(new Date(contract.user_signed_at), "dd/MM/yyyy", { locale: dateLocale })}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 gap-1">
                                <Clock className="h-3 w-3" />
                                Aguardando assinatura do investidor
                              </Badge>
                            )}
                          </div>
                          {/* Admin signature status */}
                          <div className="flex items-center gap-1.5">
                            {contract.admin_signed_at ? (
                              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Discovery assinou • {format(new Date(contract.admin_signed_at), "dd/MM/yyyy", { locale: dateLocale })}
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
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => window.open(contract.pdf_url, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver PDF
                      </Button>

                      {/* User can sign if not yet signed */}
                      {!isAdmin && !contract.user_signed_at && (
                        <Button
                          variant="cta"
                          size="sm"
                          className="gap-1.5"
                          disabled={signing === contract.id}
                          onClick={() => handleUserSign(contract.id)}
                        >
                          {signing === contract.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Assinar
                        </Button>
                      )}

                      {/* Admin can sign if user has signed */}
                      {isAdmin && contract.user_signed_at && !contract.admin_signed_at && (
                        <Button
                          variant="cta"
                          size="sm"
                          className="gap-1.5"
                          disabled={signing === contract.id}
                          onClick={() => handleAdminSign(contract.id)}
                        >
                          {signing === contract.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Assinar (Admin)
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
    </div>
  );
}
