import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function usePendingRegistrations(): number {
  const { isAdmin } = useAuth();

  const { data: count = 0 } = useQuery({
    queryKey: ["pending-registrations"],
    enabled: isAdmin,
    refetchInterval: 30000,
    queryFn: async () => {
      const { count: total } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      return total ?? 0;
    },
  });

  return count;
}
