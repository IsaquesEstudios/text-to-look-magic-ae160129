import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PainelLayout } from "@/components/painel/PainelLayout";
import { PropertySubNav } from "@/components/painel/property/PropertySubNav";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const statusLabels: Record<string, { label: string; color: string }> = {
  available: { label: "Disponível", color: "bg-primary/90 text-primary-foreground" },
  purchased: { label: "Comprado", color: "bg-accent/90 text-accent-foreground" },
  renovating: { label: "Em Reforma", color: "bg-secondary text-foreground" },
  selling: { label: "Vendendo", color: "bg-secondary text-foreground" },
  sold: { label: "Vendido", color: "bg-muted text-muted-foreground" },
};

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: images } = useQuery({
    queryKey: ["property-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: shares } = useQuery({
    queryKey: ["property-shares", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("*")
        .eq("property_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user && isAdmin,
  });

  const { data: userShares } = useQuery({
    queryKey: ["user-shares", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("id")
        .eq("property_id", id!)
        .eq("user_id", user!.id)
        .limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  if (authLoading || isLoading) {
    return (
      <PainelLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PainelLayout>
    );
  }

  if (!property) {
    return (
      <PainelLayout>
        <p className="text-center text-muted-foreground py-16">Imóvel não encontrado.</p>
      </PainelLayout>
    );
  }

  const status = statusLabels[property.status] || statusLabels.available;
  const soldShares = property.total_shares - property.available_shares;
  const userHasShares = isAdmin || (userShares && userShares.length > 0);
  const canPurchase = property.available_shares > 0 && property.status === "available" && !isAdmin;

  const handlePurchase = async () => {
    if (!user || !id) return;
    setPurchasing(true);
    try {
      const { error } = await supabase.rpc("purchase_share", {
        p_property_id: id,
        p_user_id: user.id,
      });
      if (error) throw error;
      toast.success("Cota adquirida com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["property-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["user-shares", id] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao adquirir cota");
    } finally {
      setPurchasing(false);
    }
  };

  // Combine cover + gallery for lightbox
  const allImages = [
    ...(property.cover_image_url ? [{ id: "cover", image_url: property.cover_image_url }] : []),
    ...(images ?? []),
  ];

  return (
    <PainelLayout>
      <div className="space-y-6">
        <PropertySubNav propertyId={property.id} propertyTitle={property.title} active="overview" />
        {/* Badge + Location */}
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1.5">
            <Badge className={`${status.color} border-0 text-xs font-medium`}>{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground/80 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {property.location}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: DollarSign, label: "Preço Total", value: `$${Number(property.purchase_price).toLocaleString("pt-BR")}`, iconClass: "text-muted-foreground/60" },
            { icon: TrendingUp, label: "Retorno Est.", value: `${Number(property.estimated_return_pct)}%`, iconClass: "text-primary", valueClass: "text-primary" },
            { icon: Users, label: "Cotas", value: `${soldShares}/${property.total_shares}`, iconClass: "text-muted-foreground/60" },
            { icon: DollarSign, label: "Preço/Cota", value: `$${Number(property.share_price).toLocaleString("pt-BR")}`, iconClass: "text-muted-foreground/60" },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-5 text-center space-y-1.5 shadow-sm hover:shadow-md transition-shadow">
              <stat.icon className={`h-5 w-5 mx-auto ${stat.iconClass}`} />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.valueClass || "text-foreground"}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Share Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{soldShares} de {property.total_shares} cotas preenchidas</span>
            <span className="font-medium text-foreground">{Math.round((soldShares / property.total_shares) * 100)}%</span>
          </div>
          <div className="flex gap-1 w-full">
            {Array.from({ length: property.total_shares }).map((_, i) => (
              <div
                key={i}
                className={`h-3 flex-1 rounded-sm transition-colors ${
                  i < soldShares
                    ? "bg-primary"
                    : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Participate Button */}
        {canPurchase && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="lg" className="w-full sm:w-auto text-base font-semibold px-8">
                Participar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar participação</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">
                    Ao confirmar, você estará adquirindo <strong>1 cota</strong> do imóvel{" "}
                    <strong>{property.title}</strong>.
                  </span>
                  <span className="block text-lg font-bold text-foreground">
                    Valor: ${Number(property.share_price).toLocaleString("pt-BR")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Ao confirmar, você declara estar de acordo com os termos de investimento.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handlePurchase} disabled={purchasing}>
                  {purchasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <div
          className="relative w-full rounded-2xl overflow-hidden bg-secondary/30 cursor-pointer group"
          style={{ aspectRatio: "2/1" }}
          onClick={() => setLightboxIndex(0)}
        >
          {property.cover_image_url ? (
            <img
              src={property.cover_image_url}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 text-sm">
              Sem foto de capa
            </div>
          )}
        </div>

        {/* Gallery Thumbnails */}
        {images && images.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">Galeria</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div
                  key={img.id}
                  className="aspect-[4/3] rounded-xl overflow-hidden bg-secondary/50 cursor-pointer group"
                  onClick={() => setLightboxIndex(property.cover_image_url ? i + 1 : i)}
                >
                  <img
                    src={img.image_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </section>
        )}


      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-secondary/80 flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-5 w-5" />
          </button>

          {allImages.length > 1 && (
            <>
              <button
                className="absolute left-4 h-10 w-10 rounded-full bg-secondary/80 flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex - 1 + allImages.length) % allImages.length);
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                className="absolute right-4 h-10 w-10 rounded-full bg-secondary/80 flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex + 1) % allImages.length);
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <img
            src={allImages[lightboxIndex]?.image_url}
            alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 text-sm text-muted-foreground">
            {lightboxIndex + 1} / {allImages.length}
          </div>
        </div>
      )}
    </PainelLayout>
  );
}
