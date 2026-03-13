import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="w-full bg-destructive/90 text-destructive-foreground px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium z-50 backdrop-blur-sm">
      <WifiOff className="h-3 w-3 flex-shrink-0" />
      <span>Sem conexão — dados do último acesso</span>
    </div>
  );
}
