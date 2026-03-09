import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, ArrowLeft, Check } from "lucide-react";
import discoveryLogo from "@/assets/discovery-logo.png";
import { PhonePrefixSelect, getPhoneFormat } from "@/components/PhonePrefixSelect";
import { languages, Language, translations } from "@/i18n";

const countries = [
  { code: "BR", name: "Brasil", labels: { state: "Estado", postal: "CEP", statePlaceholder: "SP", postalPlaceholder: "00000-000" } },
  { code: "US", name: "United States", labels: { state: "State", postal: "ZIP Code", statePlaceholder: "FL", postalPlaceholder: "33101" } },
  { code: "PT", name: "Portugal", labels: { state: "Distrito", postal: "Código Postal", statePlaceholder: "Lisboa", postalPlaceholder: "1000-001" } },
  { code: "OTHER", name: "Outro / Other", labels: { state: "State / Province", postal: "Postal Code", statePlaceholder: "State", postalPlaceholder: "Postal code" } },
];

function getCountryLabels(code: string) {
  return countries.find((c) => c.code === code)?.labels ?? countries[3].labels;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 2 fields
  const [phonePrefix, setPhonePrefix] = useState("");
  const [phone, setPhone] = useState("");
  const [differentWhatsapp, setDifferentWhatsapp] = useState(false);
  const [whatsappPrefix, setWhatsappPrefix] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [country, setCountry] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<Language>("pt");

  const navigate = useNavigate();
  const { toast } = useToast();
  const a = translations[preferredLanguage].auth;
  const labels = getCountryLabels(country);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      handleLogin();
    } else {
      setStep(2);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/painel");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, preferred_language: preferredLanguage },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      // Save profile data if user was created
      if (data.user) {
        const fullPhone = [phonePrefix.trim(), phone.trim()].filter(Boolean).join(" ");
        const fullWhatsapp = differentWhatsapp
          ? [whatsappPrefix.trim(), whatsapp.trim()].filter(Boolean).join(" ")
          : fullPhone;
        await supabase.from("profiles").update({
          phone: fullPhone || null,
          whatsapp: fullWhatsapp || null,
          country: country || null,
          address_street: addressStreet.trim() || null,
          address_number: addressNumber.trim() || null,
          address_complement: addressComplement.trim() || null,
          address_neighborhood: addressNeighborhood.trim() || null,
          address_city: addressCity.trim() || null,
          address_state: addressState.trim() || null,
          postal_code: postalCode.trim() || null,
          preferred_language: preferredLanguage,
        } as any).eq("user_id", data.user.id);
      }

      toast({
        title: a.accountCreated,
        description: a.checkEmail,
      });
      setStep(1);
      setIsLogin(true);
    } catch (error: any) {
      toast({ title: a.error, description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={discoveryLogo} alt="Discovery" className="h-12" />
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">
              {isLogin ? a.login : step === 1 ? a.createAccount : step === 2 ? a.chooseLanguage : a.yourInfo}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? a.accessAccount
                : step === 1
                  ? a.signupDescription
                  : step === 2
                    ? a.chooseLanguageDescription
                    : a.completeProfile}
            </CardDescription>
            {!isLogin && (
              <div className="flex justify-center gap-2 pt-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-1.5 w-8 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Step 1: credentials */}
            {(isLogin || step === 1) && (
              <form onSubmit={handleStep1} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{a.fullName}</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={a.fullNamePlaceholder} required={!isLogin} maxLength={100} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">{a.email}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required maxLength={255} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{a.password}</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="cta" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="animate-spin" />}
                  {isLogin ? a.login : a.next}
                </Button>
              </form>
            )}

            {/* Step 2: language selection */}
            {!isLogin && step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setPreferredLanguage(lang.code)}
                      className={`flex items-center gap-3 w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                        preferredLanguage === lang.code
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-transparent text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="flex-1">{lang.name}</span>
                      {preferredLanguage === lang.code && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> {a.back}
                  </Button>
                  <Button type="button" variant="cta" className="flex-1" onClick={() => setStep(3)}>
                    {a.next}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: profile info */}
            {!isLogin && step === 3 && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="s2-phone">{a.phone}</Label>
                  <div className="flex gap-2">
                    <PhonePrefixSelect id="s2-phone-prefix" value={phonePrefix} onValueChange={setPhonePrefix} />
                    <Input id="s2-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={getPhoneFormat(phonePrefix)} required maxLength={20} minLength={4} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch id="s2-diff-whatsapp" checked={differentWhatsapp} onCheckedChange={setDifferentWhatsapp} />
                  <Label htmlFor="s2-diff-whatsapp" className="cursor-pointer text-sm text-muted-foreground">
                    Meu WhatsApp é diferente do telefone
                  </Label>
                </div>
                {differentWhatsapp && (
                  <div className="space-y-2">
                    <Label htmlFor="s2-whatsapp">WhatsApp</Label>
                    <div className="flex gap-2">
                      <PhonePrefixSelect id="s2-whatsapp-prefix" value={whatsappPrefix} onValueChange={setWhatsappPrefix} />
                      <Input id="s2-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder={getPhoneFormat(whatsappPrefix)} required maxLength={20} minLength={4} />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>País / Country</Label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Brasil, United States..." maxLength={60} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label>Rua / Street</Label>
                    <Input value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} placeholder="Street name" maxLength={200} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nº</Label>
                    <Input value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} placeholder="Nº" maxLength={20} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Complemento / Unit</Label>
                    <Input value={addressComplement} onChange={(e) => setAddressComplement(e.target.value)} placeholder="Apt, suite..." maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro / Neighborhood</Label>
                    <Input value={addressNeighborhood} onChange={(e) => setAddressNeighborhood(e.target.value)} placeholder="Neighborhood" maxLength={100} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>{labels.postal}</Label>
                    <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder={labels.postalPlaceholder} maxLength={15} minLength={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade / City</Label>
                    <Input value={addressCity} onChange={(e) => setAddressCity(e.target.value)} placeholder="City" maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>{labels.state}</Label>
                    <Input value={addressState} onChange={(e) => setAddressState(e.target.value)} placeholder={labels.statePlaceholder} maxLength={50} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </Button>
                  <Button type="submit" variant="cta" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="animate-spin" />}
                    Criar Conta
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsLogin(!isLogin); setStep(1); }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
