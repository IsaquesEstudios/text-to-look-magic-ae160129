import { useState, useEffect } from "react";
import { useDemoGuard } from "@/hooks/useDemoGuard";
import { useAuth } from "@/hooks/useAuth";
import { usePanelTranslation } from "@/hooks/usePanelTranslation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Phone, MapPin, Save, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { languages } from "@/i18n";
import { PhonePrefixSelect, MaskedPhoneInput } from "@/components/PhonePrefixSelect";
import { CountryAutocomplete } from "@/components/CountryAutocomplete";

export default function UserProfilePage() {
  const { user, refreshProfile, isDemoUser } = useAuth();
  const { p } = usePanelTranslation();
  const { toast } = useToast();
  const isDemoBlocked = useDemoGuard();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile-full", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchOnMount: "always",
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const [form, setForm] = useState({
    full_name: "", phone_prefix: "", phone: "", whatsapp_prefix: "", whatsapp: "",
    country: "", address_street: "", address_number: "", address_complement: "",
    address_neighborhood: "", address_city: "", address_state: "", postal_code: "",
    preferred_language: "pt",
    person_type: "individual" as "individual" | "business",
    itin_ssn: "", passport: "", ein: "",
  });
  const [differentWhatsapp, setDifferentWhatsapp] = useState(false);

  function splitPhone(val: string) {
    const trimmed = (val ?? "").trim();
    const match = trimmed.match(/^(\+\d{1,4})\s*(.*)$/);
    if (match) return { prefix: match[1], number: match[2] };
    return { prefix: "", number: trimmed };
  }
  function joinPhone(prefix: string, number: string) {
    const pp = prefix.trim(), n = number.trim();
    if (!pp && !n) return "";
    return pp ? `${pp} ${n}`.trim() : n;
  }

  useEffect(() => {
    if (profile) {
      const pr = profile as any;
      const phoneParts = splitPhone(pr.phone ?? "");
      const whatsappParts = splitPhone(pr.whatsapp ?? "");
      setForm({
        full_name: profile.full_name ?? "",
        phone_prefix: phoneParts.prefix, phone: phoneParts.number,
        whatsapp_prefix: whatsappParts.prefix, whatsapp: whatsappParts.number,
        country: pr.country ?? "", address_street: pr.address_street ?? "",
        address_number: pr.address_number ?? "", address_complement: pr.address_complement ?? "",
        address_neighborhood: pr.address_neighborhood ?? "", address_city: pr.address_city ?? "",
        address_state: pr.address_state ?? "", postal_code: pr.postal_code ?? "",
        preferred_language: pr.preferred_language ?? "pt",
        person_type: pr.person_type ?? "individual",
        itin_ssn: pr.itin_ssn ?? "", passport: pr.passport ?? "", ein: pr.ein ?? "",
      });
      const rawPhone = (pr.phone ?? "").trim();
      const rawWhatsapp = (pr.whatsapp ?? "").trim();
      setDifferentWhatsapp(!!rawWhatsapp && rawWhatsapp !== rawPhone);
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () => {
      const fullPhone = joinPhone(form.phone_prefix, form.phone);
      const fullWhatsapp = differentWhatsapp ? joinPhone(form.whatsapp_prefix, form.whatsapp) : fullPhone;
      const { error } = await supabase.from("profiles").update({
        full_name: form.full_name.trim() || null,
        phone: fullPhone || null, whatsapp: fullWhatsapp || null,
        country: form.country || null, address_street: form.address_street.trim() || null,
        address_number: form.address_number.trim() || null, address_complement: form.address_complement.trim() || null,
        address_neighborhood: form.address_neighborhood.trim() || null, address_city: form.address_city.trim() || null,
        address_state: form.address_state.trim() || null, postal_code: form.postal_code.trim() || null,
        preferred_language: form.preferred_language,
        person_type: form.person_type,
        itin_ssn: form.itin_ssn.trim() || null,
        passport: form.passport.trim() || null,
        ein: form.ein.trim() || null,
      } as any).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-profile-full"] }); refreshProfile(); toast({ title: p.profileUpdated }); },
    onError: (err: any) => { toast({ title: p.saveError, description: err.message, variant: "destructive" }); },
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  if (!user) return null;
  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <fieldset disabled={isDemoUser} className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">{p.myInfo}</h1>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" />{p.personalData}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{p.fullName}</Label>
            <Input id="fullName" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder={p.fullNamePlaceholder} maxLength={120} minLength={2} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />Email</Label>
            <Input value={user.email ?? ""} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">{p.emailCannotChange}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />{p.preferredLanguage}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={form.preferred_language} onValueChange={(v) => update("preferred_language", v)}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />{p.contact}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">{p.phone}</Label>
            <div className="flex gap-2">
              <PhonePrefixSelect id="phone-prefix" value={form.phone_prefix} onValueChange={(v) => { update("phone_prefix", v); update("phone", ""); }} />
              <MaskedPhoneInput id="phone" prefix={form.phone_prefix} value={form.phone} onChange={(v) => update("phone", v)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="diff-whatsapp" checked={differentWhatsapp} onCheckedChange={setDifferentWhatsapp} />
            <Label htmlFor="diff-whatsapp" className="cursor-pointer text-sm text-muted-foreground">{p.whatsappDifferent}</Label>
          </div>
          {differentWhatsapp && (
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <div className="flex gap-2">
                <PhonePrefixSelect id="whatsapp-prefix" value={form.whatsapp_prefix} onValueChange={(v) => { update("whatsapp_prefix", v); update("whatsapp", ""); }} />
                <MaskedPhoneInput id="whatsapp" prefix={form.whatsapp_prefix} value={form.whatsapp} onChange={(v) => update("whatsapp", v)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{p.address}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{p.country}</Label>
            <CountryAutocomplete value={form.country} onValueChange={(v) => update("country", v)} placeholder={p.countryPlaceholder} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <Label>{p.street}</Label>
              <Input value={form.address_street} onChange={(e) => update("address_street", e.target.value)} placeholder={p.streetPlaceholder} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>{p.numberLabel}</Label>
              <Input value={form.address_number} onChange={(e) => update("address_number", e.target.value)} placeholder="Nº" maxLength={20} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{p.complement}</Label>
              <Input value={form.address_complement} onChange={(e) => update("address_complement", e.target.value)} placeholder={p.complementPlaceholder} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>{p.neighborhood}</Label>
              <Input value={form.address_neighborhood} onChange={(e) => update("address_neighborhood", e.target.value)} placeholder={p.neighborhoodPlaceholder} maxLength={100} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{p.postalCode}</Label>
              <Input value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} placeholder={p.postalCodePlaceholder} maxLength={15} minLength={3} />
            </div>
            <div className="space-y-2">
              <Label>{p.city}</Label>
              <Input value={form.address_city} onChange={(e) => update("address_city", e.target.value)} placeholder={p.cityPlaceholder} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>{p.state}</Label>
              <Input value={form.address_state} onChange={(e) => update("address_state", e.target.value)} placeholder={p.statePlaceholder} maxLength={50} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" />Tipo de Pessoa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={form.person_type} onValueChange={(v: "individual" | "business") => update("person_type", v)}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Pessoa Física</SelectItem>
              <SelectItem value="business">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>

          {form.person_type === "individual" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ITIN/SSN</Label>
                <Input value={form.itin_ssn} onChange={(e) => update("itin_ssn", e.target.value)} placeholder="000-00-0000" maxLength={20} />
              </div>
              <div className="space-y-2">
                <Label>Passaporte</Label>
                <Input value={form.passport} onChange={(e) => update("passport", e.target.value)} placeholder="Nº do passaporte" maxLength={30} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>EIN</Label>
                <Input value={form.ein} onChange={(e) => update("ein", e.target.value)} placeholder="00-0000000" maxLength={20} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isDemoUser && (
      <Button onClick={() => { mutation.mutate(); }} disabled={mutation.isPending} className="gap-2">
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {p.saveChanges}
      </Button>
      )}
    </fieldset>
  );
}
