import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PropertySubNav } from "@/components/painel/property/PropertySubNav";

import { Badge } from "@/components/ui/badge";
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
  auctioned: { label: "Arrematado", color: "bg-accent/90 text-accent-foreground" },
  waiting_permit: { label: "Aguardando Alvará", color: "bg-secondary text-foreground" },
  renovation_in_progress: { label: "Reforma em Andamento", color: "bg-secondary text-foreground" },
  for_sale: { label: "À Venda", color: "bg-primary/90 text-primary-foreground" },
  under_contract: { label: "Sob Contrato", color: "bg-accent/90 text-accent-foreground" },
  sold: { label: "Vendido", color: "bg-muted text-muted-foreground" },
};

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  const { data: userShares } = useQuery({
    queryKey: ["user-shares", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("id, quantity")
        .eq("property_id", id!)
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const authLoading = !user;

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!property) {
    return <p className="text-center text-muted-foreground py-16">Imóvel não encontrado.</p>;
  }

  const status = statusLabels[property.status] || statusLabels.available;
  const purchasePrice = Number(property.purchase_price) || 0;
  const marketValue = Number(property.purchase_price) * (1 + (Number(property.estimated_return_pct) || 0) / 100);
  const calculatedReturn = purchasePrice > 0 ? ((marketValue - purchasePrice) / purchasePrice) * 100 : 0;

  const allImages = [
    ...(property.cover_image_url ? [{ id: "cover", image_url: property.cover_image_url }] : []),
    ...(images ?? []),
  ];

  return (
    <>
      <div className="space-y-6">
        <PropertySubNav propertyId={property.id} propertyTitle={property.title} active="overview" hasShares={!!(userShares && userShares.length > 0)} />
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1.5">
            <Badge className={`${status.color} border-0 text-xs font-medium`}>{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground/80 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {property.location}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium mb-2">Estimativas do Projeto</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { icon: DollarSign, label: "Arremate", value: `$${(Number(property.estimated_auction_value) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, iconClass: "text-muted-foreground/60" },
              { icon: DollarSign, label: "Reforma", value: `$${(Number(property.estimated_renovation_cost) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, iconClass: "text-muted-foreground/60" },
              { icon: DollarSign, label: "Total do Projeto", value: `$${purchasePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, iconClass: "text-muted-foreground/60" },
              { icon: DollarSign, label: "Valor de Mercado", value: `$${marketValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, iconClass: "text-muted-foreground/60" },
              { icon: TrendingUp, label: "Retorno Est.", value: `${calculatedReturn.toFixed(1)}%`, iconClass: "text-primary", valueClass: "text-primary" },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card p-5 text-center space-y-1.5 shadow-sm hover:shadow-md transition-shadow">
                <stat.icon className={`h-5 w-5 mx-auto ${stat.iconClass}`} />
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.valueClass || "text-foreground"}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

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
    </>
  );
}
