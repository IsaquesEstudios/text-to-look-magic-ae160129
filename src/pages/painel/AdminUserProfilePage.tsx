import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePanelTranslation } from "@/hooks/usePanelTranslation";
import {
  ArrowLeft,
  Upload,
  Loader2,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Gavel,
  UserX,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";

const MAX_CREDITS = 99_999_999.99;

const dateLocaleMap: Record<string, any> = { pt: ptBR, en: enUS, es };

export default function AdminUserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { p, lang } = usePanelTranslation();
  const queryClient = useQueryClient();
  const [creditRawAmount, setCreditRawAmount] = useState(0);
  const [creditDisplayAmount, setCreditDisplayAmount] = useState("");
  const [savingCredits, setSavingCredits] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    country: "",
    postal_code: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    person_type: "individual" as "individual" | "business",
    itin_ssn: "",
    passport: "",
    ein: "",
  });

  const dateLoc = dateLocaleMap[lang] || ptBR;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin-user-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!user && isAdmin,
    refetchOnMount: "always",
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: paymentImages, refetch: refetchImages } = useQuery({
    queryKey: ["payment-images", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_payment_images")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!user && isAdmin,
  });

  const { data: auctionInvestments } = useQuery({
    queryKey: ["admin-user-auctions", userId],
    queryFn: async () => {
      const { data: deposits, error } = await supabase
        .from("auction_deposits")
        .select("id, amount, created_at, auction_id")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!deposits || deposits.length === 0) return [];

      const auctionIds = [...new Set(deposits.map((d) => d.auction_id))];
      const { data: auctions } = await supabase
        .from("auctions")
        .select("id, title, status, scheduled_start")
        .in("id", auctionIds);

      const auctionMap = new Map((auctions ?? []).map((a) => [a.id, a]));

      const grouped = new Map<string, { auction: any; deposits: typeof deposits; total: number }>();
      for (const d of deposits) {
        if (!grouped.has(d.auction_id)) {
          grouped.set(d.auction_id, {
            auction: auctionMap.get(d.auction_id),
            deposits: [],
            total: 0,
          });
        }
        const g = grouped.get(d.auction_id)!;
        g.deposits.push(d);
        g.total += Number(d.amount);
      }
      return Array.from(grouped.values());
    },
    enabled: !!userId && !!user && isAdmin,
  });

  const { data: userShares } = useQuery({
    queryKey: ["admin-user-shares", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("id, property_id, amount_paid")
        .eq("user_id", userId!);
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const propertyIds = [...new Set(data.map(s => s.property_id))];
      const { data: props } = await supabase
        .from("properties")
        .select("id, title, type")
        .in("id", propertyIds);
      const propMap = new Map((props ?? []).map(p => [p.id, p]));
      return data.map(s => ({ ...s, property: propMap.get(s.property_id) }));
    },
    enabled: !!userId && !!user && isAdmin,
  });

  const receivedImages = paymentImages?.filter((img) => img.type === "received") ?? [];
  const sentImages = paymentImages?.filter((img) => img.type === "sent") ?? [];

  const handleAddCredits = async () => {
    if (!userId || creditRawAmount === 0 || !user) return;
    const amount = creditRawAmount / 100;
    if (amount <= 0) {
      toast({ title: p.invalidValue, variant: "destructive" });
      return;
    }
    if (amount > MAX_CREDITS) {
      toast({ title: p.maxValueExceeded, variant: "destructive" });
      return;
    }
    setSavingCredits(true);
    try {
      const currentCredits = Number(profile?.credits) || 0;
      const newTotal = currentCredits + amount;
      if (newTotal > MAX_CREDITS) {
        toast({ title: p.maxValueExceeded, variant: "destructive" });
        setSavingCredits(false);
        return;
      }
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ credits: newTotal })
        .eq("user_id", userId);
      if (profileError) throw profileError;

      const { error: txError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: userId,
          amount,
          type: "deposit",
          description: p.creditAddedByAdmin,
          created_by: user.id,
        });
      if (txError) throw txError;

      toast({ title: `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${p.creditsAdded}` });
      setCreditRawAmount(0);
      setCreditDisplayAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin-user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["investors-with-credits-linking"] });
      queryClient.invalidateQueries({ queryKey: ["investment-kpis"] });
    } catch (err: any) {
      toast({ title: p.error, description: p.unexpectedError, variant: "destructive" });
    } finally {
      setSavingCredits(false);
    }
  };

  const uploadImage = async (file: File, type: "received" | "sent") => {
    const ext = file.name.split(".").pop();
    const path = `payments/${userId}/${type}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("property-media")
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("property-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "received" | "sent"
  ) => {
    const files = e.target.files;
    if (!files || !user || !userId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImage(file, type);
        await supabase.from("user_payment_images").insert({
          user_id: userId,
          uploaded_by: user.id,
          type,
          image_url: url,
        });
      }
      refetchImages();
      toast({ title: p.imagesSent });
    } catch (err: any) {
      toast({ title: p.sendError, description: p.unexpectedError, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    const { error } = await supabase
      .from("user_payment_images")
      .delete()
      .eq("id", imageId);
    if (error) {
      toast({ title: p.removeError, variant: "destructive" });
    } else {
      refetchImages();
    }
  };

  const handleDeleteUser = async () => {
    if (!userId) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || p.error);
      toast({ title: p.userDeleted });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
      navigate("/painel/usuarios");
    } catch (err: any) {
      toast({ title: p.error, description: p.unexpectedError, variant: "destructive" });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const startEditingProfile = () => {
    if (!profile) return;
    const pr = profile as any;
    setProfileForm({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      whatsapp: profile.whatsapp || "",
      country: profile.country || "",
      postal_code: profile.postal_code || "",
      address_street: profile.address_street || "",
      address_number: profile.address_number || "",
      address_complement: profile.address_complement || "",
      address_neighborhood: profile.address_neighborhood || "",
      address_city: profile.address_city || "",
      address_state: profile.address_state || "",
      person_type: pr.person_type || "individual",
      itin_ssn: pr.itin_ssn || "",
      passport: pr.passport || "",
      ein: pr.ein || "",
    });
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileForm.full_name || null,
          phone: profileForm.phone || null,
          whatsapp: profileForm.whatsapp || null,
          country: profileForm.country || null,
          postal_code: profileForm.postal_code || null,
          address_street: profileForm.address_street || null,
          address_number: profileForm.address_number || null,
          address_complement: profileForm.address_complement || null,
          address_neighborhood: profileForm.address_neighborhood || null,
          address_city: profileForm.address_city || null,
          address_state: profileForm.address_state || null,
          person_type: profileForm.person_type,
          itin_ssn: profileForm.itin_ssn || null,
          passport: profileForm.passport || null,
          ein: profileForm.ein || null,
        } as any)
        .eq("user_id", userId);
      if (error) throw error;
      toast({ title: "Perfil atualizado" });
      setEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ["admin-user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch {
      toast({ title: p.error, description: p.unexpectedError, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const credits = Number(profile?.credits) || 0;

  // Consolidate multiple shares in the same property
  const consolidatedShares = (() => {
    const map = new Map<string, { property_id: string; total_paid: number; property?: { id: string; title: string; type: string } }>();
    for (const s of userShares ?? []) {
      const existing = map.get(s.property_id);
      if (existing) {
        existing.total_paid += Number(s.amount_paid);
      } else {
        map.set(s.property_id, { property_id: s.property_id, total_paid: Number(s.amount_paid), property: s.property });
      }
    }
    return Array.from(map.values());
  })();

  const hasBalance = credits > 0;
  const hasLinkedProperties = consolidatedShares.length > 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return <p className="text-center text-muted-foreground py-16">{p.userNotFound}</p>;

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate("/painel/usuarios")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {p.backToUsers}
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {profile.full_name || p.noName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{userId}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-primary/30 text-primary text-base px-4 py-1.5">
            <DollarSign className="h-4 w-4 mr-1" />
            {credits.toLocaleString("en-US")}
          </Badge>
          <Button variant="outline" size="sm" onClick={startEditingProfile} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
            onClick={() => setShowDeleteDialog(true)}
          >
            <UserX className="h-4 w-4" />
            {p.deleteUser}
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {p.deleteUserTitle}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {p.deleteUserConfirm}{" "}
                  <strong>{profile.full_name || p.noName}</strong>? {p.deleteUserIrreversible}
                </p>
                {hasBalance && (
                  <Alert variant="destructive" className="border-yellow-500/50 text-yellow-600 [&>svg]:text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{p.balanceWarningTitle}</AlertTitle>
                    <AlertDescription>
                      {p.balanceWarning.replace("{amount}", `$${credits.toLocaleString("en-US", { minimumFractionDigits: 2 })}`)}
                    </AlertDescription>
                  </Alert>
                )}
                 {hasLinkedProperties && (
                  <Alert variant="destructive" className="border-orange-500/50 text-orange-600 [&>svg]:text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{p.linkedPropertiesTitle}</AlertTitle>
                    <AlertDescription>
                      {p.linkedPropertiesWarning.replace("{count}", String(consolidatedShares.length))}
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        {consolidatedShares.map(s => (
                          <li key={s.property_id}>
                            {s.property?.title || p.propertiesLabel} — ${s.total_paid.toLocaleString("en-US")}
                          </li>
                        ))}
                      </ul>
                      {p.linkedPropertiesRemoved}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{p.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {p.deletePermanently}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{p.profileInfo}</CardTitle>
          {editingProfile && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingProfile(false)} disabled={savingProfile}>
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile} className="gap-1.5">
                {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editingProfile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {([
                ["full_name", p.fullName],
                ["phone", p.phone],
                ["whatsapp", "WhatsApp"],
                ["country", p.country],
                ["postal_code", p.postalCode],
                ["address_street", p.street],
                ["address_number", p.numberLabel],
                ["address_complement", p.complement],
                ["address_neighborhood", p.neighborhood],
                ["address_city", p.city],
                ["address_state", p.state],
              ] as [keyof typeof profileForm, string][]).map(([key, label]) => (
                <div key={key} className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  <Input
                    value={profileForm[key]}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="h-9"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">{p.registeredAt}</span>
                <span className="text-foreground mt-2">
                  {format(new Date(profile.created_at), "dd/MM/yyyy HH:mm", { locale: dateLoc })}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                [p.fullName, profile.full_name],
                [p.phone, profile.phone],
                ["WhatsApp", profile.whatsapp],
                [p.country, profile.country],
                [p.postalCode, profile.postal_code],
                [p.street, profile.address_street],
                [p.numberLabel, profile.address_number],
                [p.complement, profile.address_complement],
                [p.neighborhood, profile.address_neighborhood],
                [p.city, profile.address_city],
                [p.state, profile.address_state],
              ].map(([label, value]) => (
                <div key={label as string} className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground text-xs">{label}</span>
                  <span className="text-foreground">{(value as string) || "—"}</span>
                </div>
              ))}
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">{p.registeredAt}</span>
                <span className="text-foreground">
                  {format(new Date(profile.created_at), "dd/MM/yyyy HH:mm", { locale: dateLoc })}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base">{p.addCredits}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="credits">{p.valueLabel}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="credits"
                  type="text"
                  inputMode="numeric"
                  value={creditDisplayAmount}
                  onChange={(e) => {
                    const input = e.target.value.replace(/[^0-9]/g, "");
                    const cents = parseInt(input || "0", 10);
                    // Cap at max value in cents
                    const cappedCents = Math.min(cents, MAX_CREDITS * 100);
                    setCreditRawAmount(cappedCents);
                    if (cappedCents === 0) {
                      setCreditDisplayAmount("");
                    } else {
                      setCreditDisplayAmount((cappedCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                    }
                  }}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
            <Button
              onClick={handleAddCredits}
              disabled={savingCredits || creditRawAmount === 0}
              className="h-10"
            >
              {savingCredits && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {p.add}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gavel className="h-4 w-4 text-primary" />
            {p.auctionsInvested}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!auctionInvestments || auctionInvestments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {p.noAuctionInvestments}
            </p>
          ) : (
            <div className="space-y-4">
              {auctionInvestments.map((item) => (
                <div key={item.auction?.id || Math.random()} className="border border-border/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.auction?.title || p.auctionsTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.auction?.scheduled_start
                          ? format(new Date(item.auction.scheduled_start), "dd MMM yyyy", { locale: dateLoc })
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        Total: ${item.total.toLocaleString("en-US")}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {item.deposits.length} {p.depositsCount}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {item.deposits.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50">
                        <span className="text-muted-foreground">
                          {format(new Date(d.created_at), "dd/MM/yyyy HH:mm", { locale: dateLoc })}
                        </span>
                        <span className="font-medium text-foreground">${Number(d.amount).toLocaleString("en-US")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4 text-primary" />
            {p.paymentsReceived}
          </CardTitle>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <span>
                <Upload className="h-3.5 w-3.5" />
                {p.send}
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, "received")}
            />
          </label>
        </CardHeader>
        <CardContent>
          {receivedImages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {p.noReceipts}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {receivedImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-background/70 px-2 py-1">
                    <p className="text-[10px] text-muted-foreground truncate">
                      {new Date(img.created_at).toLocaleDateString(lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : "en-US")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            {p.paymentsSent}
          </CardTitle>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <span>
                <Upload className="h-3.5 w-3.5" />
                {p.send}
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, "sent")}
            />
          </label>
        </CardHeader>
        <CardContent>
          {sentImages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {p.noReceipts}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sentImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-background/70 px-2 py-1">
                    <p className="text-[10px] text-muted-foreground truncate">
                      {new Date(img.created_at).toLocaleDateString(lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : "en-US")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {p.uploadingImages}
        </div>
      )}

    </div>
  );
}
