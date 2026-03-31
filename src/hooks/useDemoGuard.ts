import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useCallback } from "react";

/**
 * Returns a guard function that shows a toast and returns `true`
 * when the current user is the demo account.
 *
 * Usage:
 *   const isDemoBlocked = useDemoGuard();
 *   const handleSave = () => { if (isDemoBlocked()) return; /* proceed */ };
 */
export function useDemoGuard() {
  const { isDemoUser } = useAuth();

  return useCallback(() => {
    if (isDemoUser) {
      toast.error("Conta demo — esta ação não está disponível.");
      return true;
    }
    return false;
  }, [isDemoUser]);
}
