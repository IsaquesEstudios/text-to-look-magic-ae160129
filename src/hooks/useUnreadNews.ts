import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useUnreadNews() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: totalUnread = 0 } = useQuery({
    queryKey: ["total-unread-news", user?.id],
    queryFn: async () => {
      if (isAdmin) return 0;

      // Get user's properties via shares
      const { data: userShares } = await supabase
        .from("shares")
        .select("property_id")
        .eq("user_id", user!.id);
      if (!userShares?.length) return 0;

      const propertyIds = [...new Set(userShares.map((s) => s.property_id))];

      // Get message read timestamps
      const { data: msgReads } = await supabase
        .from("property_message_reads")
        .select("property_id, last_read_at")
        .eq("user_id", user!.id)
        .in("property_id", propertyIds);

      const msgReadMap = new Map<string, string>();
      msgReads?.forEach((r) => msgReadMap.set(r.property_id, r.last_read_at));

      // Get expense read timestamps
      const { data: expReads } = await supabase
        .from("property_expense_reads")
        .select("property_id, last_read_at")
        .eq("user_id", user!.id)
        .in("property_id", propertyIds);

      const expReadMap = new Map<string, string>();
      expReads?.forEach((r) => expReadMap.set(r.property_id, r.last_read_at));

      // Count unread across all properties (messages + expenses)
      let total = 0;
      for (const pid of propertyIds) {
        const msgLastRead = msgReadMap.get(pid);
        let mq = supabase
          .from("property_messages")
          .select("id", { count: "exact", head: true })
          .eq("property_id", pid);
        if (msgLastRead) mq = mq.gt("created_at", msgLastRead);
        const { count: mc } = await mq;
        total += mc ?? 0;

        const expLastRead = expReadMap.get(pid);
        let eq = supabase
          .from("property_expenses")
          .select("id", { count: "exact", head: true })
          .eq("property_id", pid);
        if (expLastRead) eq = eq.gt("created_at", expLastRead);
        const { count: ec } = await eq;
        total += ec ?? 0;
      }
      return total;
    },
    enabled: !!user && !isAdmin,
    refetchInterval: 60000,
  });

  // Realtime: invalidate on new messages or expenses
  useEffect(() => {
    if (!user || isAdmin) return;

    const channel: RealtimeChannel = supabase
      .channel("global-msg-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "property_messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["total-unread-news"] });
          queryClient.invalidateQueries({ queryKey: ["property-news"] });
          queryClient.invalidateQueries({ queryKey: ["property-unread-counts"] });
          queryClient.invalidateQueries({ queryKey: ["multi-property-unread"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "property_expenses" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["total-unread-news"] });
          queryClient.invalidateQueries({ queryKey: ["property-unread-counts"] });
          queryClient.invalidateQueries({ queryKey: ["multi-property-unread"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, queryClient]);

  return totalUnread;
}
