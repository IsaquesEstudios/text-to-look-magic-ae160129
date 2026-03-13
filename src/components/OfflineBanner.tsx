import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="w-full bg-destructive/90 text-destructive-foreground px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium z-50 backdrop-blur-sm">
      <WifiOff className="h-3 w-3 flex-shrink-0" />
      <span>Sem conexão — dados do último acesso</span>
    </div>
  );
}
