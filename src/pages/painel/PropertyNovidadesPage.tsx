import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCommunity } from "@/components/painel/property/PropertyCommunity";
import { PropertySubNav } from "@/components/painel/property/PropertySubNav";
import { PropertyPageSkeleton } from "@/components/painel/property/PropertyPageSkeleton";
import { isDemoPropertyId, getDemoProperty, getDemoMessages } from "@/data/demoData";
import { Card, CardContent } from "@/components/ui/card";

export default function PropertyNovidadesPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, isDemoUser } = useAuth();
  const queryClient = useQueryClient();

  const isDemo = isDemoUser && id && isDemoPropertyId(id);

  // Mark as read (skip for demo)
  useEffect(() => {
    if (user && id && !isDemo) {
      supabase
        .from("property_message_reads")
        .upsert(
          { user_id: user.id, property_id: id, last_read_at: new Date().toISOString() },
          { onConflict: "user_id,property_id" }
        )
        .then(({ error }) => {
          if (error) {
            console.error("Failed to mark messages as read:", error);
            return;
          }
          queryClient.invalidateQueries({ queryKey: ["property-news"] });
          queryClient.invalidateQueries({ queryKey: ["property-unread-counts"] });
          queryClient.invalidateQueries({ queryKey: ["multi-property-unread"] });
          queryClient.invalidateQueries({ queryKey: ["total-unread-news"] });
        });
    }
  }, [user, id, queryClient, isDemo]);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user && !isDemo,
  });

  const { data: userShares, isLoading: isSharesLoading } = useQuery({
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
    enabled: !!id && !!user && !isDemo,
  });

  // Demo property
  if (isDemo) {
    const demoProp = getDemoProperty(id!);
    if (!demoProp) return <p className="text-center text-muted-foreground py-16">Acesso não permitido.</p>;
    const messages = getDemoMessages(id!);
    return (
      <div className="space-y-4">
        <PropertySubNav propertyId={demoProp.id} propertyTitle={demoProp.title} active="novidades" hasShares={true} />
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="h-96 overflow-y-auto space-y-3 pr-2">
              {messages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-xl bg-secondary/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">Admin</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {msg.content && <p className="text-sm text-foreground">{msg.content}</p>}
                  {msg.media_url && msg.media_type === "image" && (
                    <img src={msg.media_url} alt="" className="rounded-lg max-h-64 object-cover" loading="lazy" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || isSharesLoading) {
    return <PropertyPageSkeleton />;
  }

  const hasAccess = isAdmin || (userShares && userShares.length > 0);

  if (!property || !hasAccess) {
    return <p className="text-center text-muted-foreground py-16">Acesso não permitido.</p>;
  }

  return (
    <div className="space-y-4">
      <PropertySubNav propertyId={property.id} propertyTitle={property.title} active="novidades" hasShares={!!(userShares && userShares.length > 0)} />
      <PropertyCommunity propertyId={property.id} />
    </div>
  );
}
