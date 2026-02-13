import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PainelLayout } from "@/components/painel/PainelLayout";
import { PropertyCommunity } from "@/components/painel/property/PropertyCommunity";
import { PropertyExpenses } from "@/components/painel/property/PropertyExpenses";
import { PropertyShareAssignment } from "@/components/painel/property/PropertyShareAssignment";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  MessageSquare,
  Receipt,
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

  // Combine cover + gallery for lightbox
  const allImages = [
    ...(property.cover_image_url ? [{ id: "cover", image_url: property.cover_image_url }] : []),
    ...(images ?? []),
  ];

  return (
    <PainelLayout>
      <div className="space-y-8">
        {/* Back */}
        <Link
          to="/painel"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        {/* Hero Cover */}
        <div
          className="relative w-full rounded-2xl overflow-hidden bg-secondary/50 cursor-pointer group"
          style={{ aspectRatio: "21/9" }}
          onClick={() => setLightboxIndex(0)}
        >
          {property.cover_image_url ? (
            <img
              src={property.cover_image_url}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
              Sem foto de capa
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{property.title}</h1>
                  <Badge className={`${status.color} border-0 text-xs`}>{status.label}</Badge>
                </div>
                <p className="text-sm text-foreground/70 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {property.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border/30 bg-card/40 p-4 text-center">
            <DollarSign className="h-4 w-4 text-muted-foreground/50 mx-auto mb-1" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Preço Total</p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              ${Number(property.purchase_price).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card/40 p-4 text-center">
            <TrendingUp className="h-4 w-4 text-primary/50 mx-auto mb-1" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Retorno Est.</p>
            <p className="text-lg font-bold text-primary mt-0.5">
              {Number(property.estimated_return_pct)}%
            </p>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card/40 p-4 text-center">
            <Users className="h-4 w-4 text-muted-foreground/50 mx-auto mb-1" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Cotas</p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {soldShares}/{property.total_shares}
            </p>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card/40 p-4 text-center">
            <DollarSign className="h-4 w-4 text-muted-foreground/50 mx-auto mb-1" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Preço/Cota</p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              ${Number(property.share_price).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Gallery Thumbnails */}
        {images && images.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">Galeria</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {images.map((img, i) => (
                <div
                  key={img.id}
                  className="aspect-square rounded-xl overflow-hidden bg-secondary/50 cursor-pointer group"
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

        {/* Admin: Share Assignment */}
        {isAdmin && (
          <PropertyShareAssignment
            propertyId={property.id}
            sharePrice={Number(property.share_price)}
            availableShares={property.available_shares}
          />
        )}

        {/* Tabs */}
        <Tabs defaultValue="community">
          <TabsList className="bg-secondary/50 border-0 p-1 rounded-xl h-auto">
            <TabsTrigger
              value="community"
              className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2 text-sm"
            >
              <MessageSquare className="h-4 w-4" />
              Comunidade
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2 text-sm"
            >
              <Receipt className="h-4 w-4" />
              Gastos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="community" className="mt-4">
            <PropertyCommunity propertyId={property.id} />
          </TabsContent>
          <TabsContent value="expenses" className="mt-4">
            <PropertyExpenses propertyId={property.id} />
          </TabsContent>
        </Tabs>
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
