import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import discoveryLogo from "@/assets/discovery-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ExcluirConta() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("account_deletion_requests" as any)
      .insert({ email: trimmed } as any);

    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar solicitação. Tente novamente.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <img src={discoveryLogo} alt="Discovery Investimentos" className="h-10" />
        </div>

        {submitted ? (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="text-xl font-semibold text-foreground">
                Solicitação enviada
              </h2>
              <p className="text-muted-foreground text-sm">
                Recebemos sua solicitação de exclusão de conta. Você receberá um
                e-mail de confirmação em até <strong>30 dias úteis</strong>.
              </p>
              <p className="text-muted-foreground text-sm">
                We received your account deletion request. You will receive a
                confirmation email within <strong>30 business days</strong>.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Exclusão de Conta</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Account Deletion Request</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                  <p>
                    Ao solicitar a exclusão da conta, <strong>todos os seus dados pessoais</strong> serão
                    permanentemente removidos, incluindo perfil, histórico de transações e documentos enviados.
                  </p>
                </div>
                <p>
                  By requesting account deletion, <strong>all your personal data</strong> will be
                  permanently removed, including profile, transaction history, and uploaded documents.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Prazo: até <strong>30 dias úteis</strong> / Timeline: up to <strong>30 business days</strong></li>
                  <li>Você receberá um e-mail confirmando a exclusão / You will receive a confirmation email</li>
                  <li>A ação é <strong>irreversível</strong> / This action is <strong>irreversible</strong></li>
                </ul>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    E-mail da conta / Account email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                  />
                </div>
                <Button
                  type="submit"
                  variant="destructive"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Solicitar exclusão / Request deletion"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Discovery Investimentos © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
