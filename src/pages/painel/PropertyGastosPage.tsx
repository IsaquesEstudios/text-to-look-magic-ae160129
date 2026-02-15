import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PainelLayout } from "@/components/painel/PainelLayout";
import { PropertyExpenses } from "@/components/painel/property/PropertyExpenses";
import { PropertySubNav } from "@/components/painel/property/PropertySubNav";
import { Loader2 } from "lucide-react";

export default function PropertyGastosPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // Mark expenses as read
  useEffect(() => {
    if (user && id) {
      supabase
        .from("property_expense_reads")
        .upsert(
          { user_id: user.id, property_id: id, last_read_at: new Date().toISOString() },
          { onConflict: "user_id,property_id" }
        )
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["property-unread-counts"] });
          queryClient.invalidateQueries({ queryKey: ["multi-property-unread"] });
          queryClient.invalidateQueries({ queryKey: ["total-unread-news"] });
          queryClient.invalidateQueries({ queryKey: ["property-news"] });
        });
    }
  }, [user, id, queryClient]);

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
    enabled: !!id && !!user,
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

  const hasAccess = isAdmin || (userShares && userShares.length > 0);

  if (!property || !hasAccess) {
    return (
      <PainelLayout>
        <p className="text-center text-muted-foreground py-16">Acesso não permitido.</p>
      </PainelLayout>
    );
  }

  return (
    <PainelLayout>
      <div className="space-y-6">
        <PropertySubNav propertyId={property.id} propertyTitle={property.title} active="gastos" hasShares={!!(userShares && userShares.length > 0)} />
        <PropertyExpenses propertyId={property.id} />
      </div>
    </PainelLayout>
  );
}
