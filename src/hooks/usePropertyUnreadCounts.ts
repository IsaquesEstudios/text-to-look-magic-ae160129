import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UnreadCounts {
  novidades: number;
  gastos: number;
}

export function usePropertyUnreadCounts(propertyId: string | undefined) {
  const { user, isAdmin } = useAuth();

  return useQuery<UnreadCounts>({
    queryKey: ["property-unread-counts", propertyId, user?.id],
    queryFn: async () => {
      if (!propertyId || !user) return { novidades: 0, gastos: 0 };

      // Get novidades read timestamp
      const { data: msgRead } = await supabase
        .from("property_message_reads")
        .select("last_read_at")
        .eq("user_id", user.id)
        .eq("property_id", propertyId)
        .maybeSingle();

      let msgQuery = supabase
        .from("property_messages")
        .select("id", { count: "exact", head: true })
        .eq("property_id", propertyId);
      if (msgRead?.last_read_at) msgQuery = msgQuery.gt("created_at", msgRead.last_read_at);
      const { count: novidadesCount } = await msgQuery;

      // Get gastos read timestamp
      const { data: expRead } = await supabase
        .from("property_expense_reads")
        .select("last_read_at")
        .eq("user_id", user.id)
        .eq("property_id", propertyId)
        .maybeSingle();

      let expQuery = supabase
        .from("property_expenses")
        .select("id", { count: "exact", head: true })
        .eq("property_id", propertyId);
      if (expRead?.last_read_at) expQuery = expQuery.gt("created_at", expRead.last_read_at);
      const { count: gastosCount } = await expQuery;

      return {
        novidades: novidadesCount ?? 0,
        gastos: gastosCount ?? 0,
      };
    },
    enabled: !!propertyId && !!user && !isAdmin,
  });
}

/** Hook to get unread counts for multiple properties at once */
export function useMultiPropertyUnreadCounts(propertyIds: string[]) {
  const { user, isAdmin } = useAuth();

  return useQuery<Map<string, UnreadCounts>>({
    queryKey: ["multi-property-unread", propertyIds.sort().join(","), user?.id],
    queryFn: async () => {
      const result = new Map<string, UnreadCounts>();
      if (!user || !propertyIds.length) return result;

      // Batch fetch reads
      const { data: msgReads } = await supabase
        .from("property_message_reads")
        .select("property_id, last_read_at")
        .eq("user_id", user.id)
        .in("property_id", propertyIds);

      const { data: expReads } = await supabase
        .from("property_expense_reads")
        .select("property_id, last_read_at")
        .eq("user_id", user.id)
        .in("property_id", propertyIds);

      const msgReadMap = new Map(msgReads?.map((r) => [r.property_id, r.last_read_at]) ?? []);
      const expReadMap = new Map(expReads?.map((r) => [r.property_id, r.last_read_at]) ?? []);

      for (const pid of propertyIds) {
        const msgLastRead = msgReadMap.get(pid);
        let mq = supabase
          .from("property_messages")
          .select("id", { count: "exact", head: true })
          .eq("property_id", pid);
        if (msgLastRead) mq = mq.gt("created_at", msgLastRead);
        const { count: mc } = await mq;

        const expLastRead = expReadMap.get(pid);
        let eq = supabase
          .from("property_expenses")
          .select("id", { count: "exact", head: true })
          .eq("property_id", pid);
        if (expLastRead) eq = eq.gt("created_at", expLastRead);
        const { count: ec } = await eq;

        result.set(pid, { novidades: mc ?? 0, gastos: ec ?? 0 });
      }

      return result;
    },
    enabled: !!user && !isAdmin && propertyIds.length > 0,
    refetchInterval: 60000,
  });
}
