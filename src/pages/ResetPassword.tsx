import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import discoveryLogo from "@/assets/discovery-logo.png";
import { translations } from "@/i18n";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const a = translations.pt.auth;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for recovery session from URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (type === "recovery" && accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "",
      }).then(({ error }) => {
        setValidSession(!error);
      });
    } else {
      // Also check if there's already a valid session (user clicked link and was auto-logged in)
      supabase.auth.getSession().then(({ data: { session } }) => {
        setValidSession(!!session);
      });
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: (a as any).error, description: (a as any).passwordsMismatch, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => {
        window.location.href = "https://app.discoveryinvestimentos.com/";
      }, 2500);
    } catch (error: any) {
      toast({ title: (a as any).error, description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (validSession === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <img src={discoveryLogo} alt="Discovery" className="h-12 mb-6" />
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={discoveryLogo} alt="Discovery" className="h-12" />
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          {success ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl text-foreground">{(a as any).passwordResetSuccess}</CardTitle>
                <CardDescription>{(a as any).passwordResetSuccessDescription}</CardDescription>
              </CardHeader>
            </>
          ) : !validSession ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                </div>
                <CardTitle className="text-xl text-foreground">{(a as any).error}</CardTitle>
                <CardDescription>{(a as any).invalidResetLink}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button variant="outline" onClick={() => navigate("/", { replace: true })}>
                  {(a as any).backToLogin}
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-foreground">{(a as any).resetPasswordTitle}</CardTitle>
                <CardDescription>{(a as any).resetPasswordDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{(a as any).newPassword}</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{(a as any).confirmPassword}</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" variant="cta" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="animate-spin" />}
                    {(a as any).resetPassword}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
