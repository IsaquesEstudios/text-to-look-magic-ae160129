import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShoppingCart, UserPlus, Clock, DollarSign, Landmark, Receipt, MessageSquare, Gavel, Building2, ImagePlus, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ActivityType =
  | "share_purchase"
  | "user_registration"
  | "credit_transaction"
  | "auction_deposit"
  | "property_expense"
  | "property_message"
  | "auction_created"
  | "property_created"
  | "payment_image";

type ActivityItem = {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  icon: typeof ShoppingCart;
  category: string;
};

const TYPE_LABELS: Record<ActivityType, string> = {
  share_purchase: "Vinculação",
  user_registration: "Registro",
  credit_transaction: "Créditos",
  auction_deposit: "Depósito",
  property_expense: "Gasto",
  property_message: "Novidade",
  auction_created: "Leilão",
  property_created: "Imóvel",
  payment_image: "Comprovante",
};

const TYPE_COLORS: Record<ActivityType, string> = {
  share_purchase: "bg-blue-500/10 text-blue-500",
  user_registration: "bg-green-500/10 text-green-500",
  credit_transaction: "bg-yellow-500/10 text-yellow-500",
  auction_deposit: "bg-purple-500/10 text-purple-500",
  property_expense: "bg-orange-500/10 text-orange-500",
  property_message: "bg-cyan-500/10 text-cyan-500",
  auction_created: "bg-red-500/10 text-red-500",
  property_created: "bg-emerald-500/10 text-emerald-500",
  payment_image: "bg-pink-500/10 text-pink-500",
};

export default function AdminAtividadesPage() {
  const { user, isAdmin } = useAuth();
  const [filter, setFilter] = useState<string>("all");

  const { data: activities, isLoading } = useQuery({
    queryKey: ["admin-activity-full"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      // Fetch all data sources in parallel
      const [
        sharesRes,
        profilesRes,
        creditsRes,
        depositsRes,
        expensesRes,
        messagesRes,
        auctionsRes,
        propertiesRes,
        paymentImagesRes,
      ] = await Promise.all([
        supabase.from("shares").select("id, quantity, amount_paid, purchased_at, property_id, user_id").order("purchased_at", { ascending: false }).limit(200),
        supabase.from("profiles").select("id, user_id, full_name, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("credit_transactions").select("id, user_id, amount, type, description, created_at, created_by").order("created_at", { ascending: false }).limit(200),
        supabase.from("auction_deposits").select("id, auction_id, user_id, amount, service_fee, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("property_expenses").select("id, property_id, product, category, price, quantity, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("property_messages").select("id, property_id, user_id, content, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("auctions").select("id, title, created_at, status").order("created_at", { ascending: false }).limit(200),
        supabase.from("properties").select("id, title, type, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("user_payment_images").select("id, user_id, type, description, created_at, uploaded_by").order("created_at", { ascending: false }).limit(200),
      ]);

      // Build name map from profiles
      const allProfiles = profilesRes.data ?? [];
      const nameMap = new Map(allProfiles.map((p) => [p.user_id, p.full_name || "Usuário"]));

      // Build property title map
      const allProperties = propertiesRes.data ?? [];
      const propertyMap = new Map(allProperties.map((p) => [p.id, p.title]));

      // Build auction title map
      const allAuctions = auctionsRes.data ?? [];
      const auctionMap = new Map(allAuctions.map((a) => [a.id, a.title]));

      // Fetch missing user names
      const allUserIds = new Set<string>();
      (sharesRes.data ?? []).forEach((s) => allUserIds.add(s.user_id));
      (creditsRes.data ?? []).forEach((c) => { allUserIds.add(c.user_id); if (c.created_by) allUserIds.add(c.created_by); });
      (depositsRes.data ?? []).forEach((d) => allUserIds.add(d.user_id));
      (messagesRes.data ?? []).forEach((m) => allUserIds.add(m.user_id));
      (paymentImagesRes.data ?? []).forEach((p) => { allUserIds.add(p.user_id); allUserIds.add(p.uploaded_by); });

      const missingIds = [...allUserIds].filter((id) => !nameMap.has(id));
      if (missingIds.length > 0) {
        const { data: extra } = await supabase.from("profiles").select("user_id, full_name").in("user_id", missingIds);
        (extra ?? []).forEach((p) => nameMap.set(p.user_id, p.full_name || "Usuário"));
      }

      const getName = (id: string) => nameMap.get(id) || "Usuário";
      const getProp = (id: string) => propertyMap.get(id) || "Imóvel";
      const getAuction = (id: string) => auctionMap.get(id) || "Leilão";
      const fmtMoney = (v: number) => `$ ${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

      const items: ActivityItem[] = [];

      // Shares
      (sharesRes.data ?? []).forEach((s) => {
        items.push({
          id: `share-${s.id}`,
          type: "share_purchase",
          description: `${getName(s.user_id)} foi vinculado ao imóvel "${getProp(s.property_id)}" — ${fmtMoney(s.amount_paid)}`,
          timestamp: s.purchased_at,
          icon: ShoppingCart,
          category: "Vinculação",
        });
      });

      // User registrations
      allProfiles.forEach((p) => {
        items.push({
          id: `profile-${p.id}`,
          type: "user_registration",
          description: `${p.full_name || "Novo usuário"} se registrou na plataforma`,
          timestamp: p.created_at,
          icon: UserPlus,
          category: "Registro",
        });
      });

      // Credit transactions
      (creditsRes.data ?? []).forEach((c) => {
        const byAdmin = c.created_by && c.created_by !== c.user_id;
        const actor = byAdmin ? `Admin (${getName(c.created_by!)})` : getName(c.user_id);
        const isNeg = Number(c.amount) < 0;
        items.push({
          id: `credit-${c.id}`,
          type: "credit_transaction",
          description: `${actor} ${isNeg ? "debitou" : "creditou"} ${fmtMoney(Math.abs(Number(c.amount)))} ${byAdmin ? `para ${getName(c.user_id)}` : ""}${c.description ? ` — ${c.description}` : ""}`.trim(),
          timestamp: c.created_at,
          icon: DollarSign,
          category: "Créditos",
        });
      });

      // Auction deposits
      (depositsRes.data ?? []).forEach((d) => {
        items.push({
          id: `deposit-${d.id}`,
          type: "auction_deposit",
          description: `${getName(d.user_id)} depositou ${fmtMoney(d.amount)} no leilão "${getAuction(d.auction_id)}" (taxa: ${fmtMoney(d.service_fee)})`,
          timestamp: d.created_at,
          icon: Landmark,
          category: "Depósito",
        });
      });

      // Property expenses
      (expensesRes.data ?? []).forEach((e) => {
        const total = Number(e.price) * Number(e.quantity);
        items.push({
          id: `expense-${e.id}`,
          type: "property_expense",
          description: `Gasto adicionado em "${getProp(e.property_id)}": ${e.product} (${e.category}) — ${fmtMoney(total)}`,
          timestamp: e.created_at,
          icon: Receipt,
          category: "Gasto",
        });
      });

      // Property messages (novidades)
      (messagesRes.data ?? []).forEach((m) => {
        const preview = m.content ? (m.content.length > 60 ? m.content.slice(0, 60) + "…" : m.content) : "mídia enviada";
        items.push({
          id: `msg-${m.id}`,
          type: "property_message",
          description: `${getName(m.user_id)} postou novidade em "${getProp(m.property_id)}": ${preview}`,
          timestamp: m.created_at,
          icon: MessageSquare,
          category: "Novidade",
        });
      });

      // Auctions created
      allAuctions.forEach((a) => {
        items.push({
          id: `auction-${a.id}`,
          type: "auction_created",
          description: `Leilão "${a.title}" foi criado (status: ${a.status})`,
          timestamp: a.created_at,
          icon: Gavel,
          category: "Leilão",
        });
      });

      // Properties created
      allProperties.forEach((p) => {
        items.push({
          id: `property-${p.id}`,
          type: "property_created",
          description: `Imóvel "${p.title}" (${p.type === "house" ? "Casa" : "Terreno"}) foi cadastrado`,
          timestamp: p.created_at,
          icon: Building2,
          category: "Imóvel",
        });
      });

      // Payment images
      (paymentImagesRes.data ?? []).forEach((pi) => {
        const uploader = getName(pi.uploaded_by);
        items.push({
          id: `payment-${pi.id}`,
          type: "payment_image",
          description: `${uploader} enviou comprovante (${pi.type}) para ${getName(pi.user_id)}${pi.description ? ` — ${pi.description}` : ""}`,
          timestamp: pi.created_at,
          icon: ImagePlus,
          category: "Comprovante",
        });
      });

      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
  });

  const filtered = useMemo(() => {
    if (!activities) return [];
    if (filter === "all") return activities;
    return activities.filter((a) => a.type === filter);
  }, [activities, filter]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Histórico de Atividades</h1>
        <p className="text-sm text-muted-foreground mt-1">Todas as movimentações realizadas na plataforma</p>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">
                Atividades
                {filtered.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">({filtered.length})</span>
                )}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="share_purchase">Vinculações</SelectItem>
                  <SelectItem value="user_registration">Registros</SelectItem>
                  <SelectItem value="credit_transaction">Créditos</SelectItem>
                  <SelectItem value="auction_deposit">Depósitos</SelectItem>
                  <SelectItem value="property_expense">Gastos</SelectItem>
                  <SelectItem value="property_message">Novidades</SelectItem>
                  <SelectItem value="auction_created">Leilões</SelectItem>
                  <SelectItem value="property_created">Imóveis</SelectItem>
                  <SelectItem value="payment_image">Comprovantes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atividade encontrada</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 py-2.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-0.5 ${TYPE_COLORS[activity.type]}`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        {" · "}
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ptBR })}
                      </p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {TYPE_LABELS[activity.type]}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
