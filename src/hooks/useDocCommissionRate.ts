import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDocCommissionRate() {
  const { data: rate = 10, isLoading } = useQuery({
    queryKey: ["doc-commission-rate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings" as any)
        .select("value")
        .eq("key", "doc_commission_rate")
        .maybeSingle();
      if (error) throw error;
      return data ? parseFloat((data as any).value) : 10;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { rate, isLoading };
}
