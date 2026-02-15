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

      // Get read timestamps
      const { data: reads } = await supabase
        .from("property_message_reads")
        .select("property_id, last_read_at")
        .eq("user_id", user!.id)
        .in("property_id", propertyIds);

      const readMap = new Map<string, string>();
      reads?.forEach((r) => readMap.set(r.property_id, r.last_read_at));

      // Count unread across all properties
      let total = 0;
      for (const pid of propertyIds) {
        const lastRead = readMap.get(pid);
        let q = supabase
          .from("property_messages")
          .select("id", { count: "exact", head: true })
          .eq("property_id", pid);
        if (lastRead) q = q.gt("created_at", lastRead);
        const { count } = await q;
        total += count ?? 0;
      }
      return total;
    },
    enabled: !!user && !isAdmin,
    refetchInterval: 60000,
  });

  // Realtime: invalidate on new messages
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, queryClient]);

  return totalUnread;
}
