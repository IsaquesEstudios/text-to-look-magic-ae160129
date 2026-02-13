import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PainelLayout } from "@/components/painel/PainelLayout";
import { PropertyCommunity } from "@/components/painel/property/PropertyCommunity";
import { PropertyExpenses } from "@/components/painel/property/PropertyExpenses";
import { PropertyShareAssignment } from "@/components/painel/property/PropertyShareAssignment";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, DollarSign, TrendingUp, Users, MessageSquare, Receipt, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const statusLabels: Record<string, string> = {
  available: "Disponível",
  purchased: "Comprado",
  renovating: "Em Reforma",
  selling: "Vendendo",
  sold: "Vendido",
};

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

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
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PainelLayout>
    );
  }

  if (!property) {
    return (
      <PainelLayout>
        <p className="text-center text-muted-foreground py-12">Imóvel não encontrado.</p>
      </PainelLayout>
    );
  }

  const soldShares = property.total_shares - property.available_shares;

  return (
    <PainelLayout>
      <div className="space-y-6">
        <Link
          to="/painel"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-80 aspect-video rounded-xl overflow-hidden bg-muted flex-shrink-0">
            {property.cover_image_url ? (
              <img src={property.cover_image_url} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                Sem foto
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <h1 className="text-2xl font-bold text-foreground">{property.title}</h1>
              <Badge variant="outline" className="border-primary/30 text-primary">
                {statusLabels[property.status] || property.status}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {property.location}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Preço
                </p>
                <p className="font-bold text-foreground">${Number(property.purchase_price).toLocaleString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Retorno
                </p>
                <p className="font-bold text-primary">{Number(property.estimated_return_pct)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> Cotas
                </p>
                <p className="font-bold text-foreground">
                  {soldShares}/{property.total_shares}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preço/Cota</p>
                <p className="font-bold text-foreground">${Number(property.share_price).toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        {images && images.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Galeria</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {images.map((img) => (
                <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Assignment (Admin only) */}
        {isAdmin && (
          <PropertyShareAssignment
            propertyId={property.id}
            sharePrice={Number(property.share_price)}
            availableShares={property.available_shares}
          />
        )}

        {/* Tabs */}
        <Tabs defaultValue="community">
          <TabsList className="bg-card border border-border/50">
            <TabsTrigger value="community" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Comunidade
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <Receipt className="h-4 w-4" />
              Gastos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="community">
            <PropertyCommunity propertyId={property.id} />
          </TabsContent>
          <TabsContent value="expenses">
            <PropertyExpenses propertyId={property.id} />
          </TabsContent>
        </Tabs>
      </div>
    </PainelLayout>
  );
}
