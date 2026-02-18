import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUnreadAuctions(): number {
  const { user } = useAuth();

  const { data: count = 0 } = useQuery({
    queryKey: ["unread-auctions", user?.id],
    enabled: !!user,
    refetchOnMount: "always",
    queryFn: async () => {
      // Get user's last read timestamp
      const { data: readRow } = await supabase
        .from("auction_reads")
        .select("last_read_at")
        .eq("user_id", user!.id)
        .maybeSingle();

      // Count auctions created after last read (or all if never read)
      let query = supabase
        .from("auctions")
        .select("id", { count: "exact", head: true })
        .neq("status", "finished");

      if (readRow?.last_read_at) {
        query = query.gt("created_at", readRow.last_read_at);
      }

      const { count: total } = await query;
      return total ?? 0;
    },
  });

  return count;
}

export async function markAuctionsRead(userId: string) {
  await supabase
    .from("auction_reads")
    .upsert({ user_id: userId, last_read_at: new Date().toISOString() }, { onConflict: "user_id" });
}
