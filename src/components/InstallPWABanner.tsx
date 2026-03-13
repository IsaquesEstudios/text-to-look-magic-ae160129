import { useState, useEffect } from "react";
import { Share, X } from "lucide-react";

export function InstallPWABanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPhone|iPad/.test(navigator.userAgent);
    const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
    const isStandalone = (navigator as any).standalone === true;
    const dismissed = sessionStorage.getItem("pwa-banner-dismissed");

    if (isIOS && !isCapacitor && !isStandalone && !dismissed) {
      // Register SW only on iOS Safari
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
      // Small delay so it doesn't flash immediately
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    sessionStorage.setItem("pwa-banner-dismissed", "1");
    setShow(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-500"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}>
      <div className="relative mx-auto max-w-md rounded-2xl bg-card border border-border p-5 shadow-2xl">
        <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-foreground mb-2">
          Instale o app Discovery
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Toque em{" "}
          <Share className="inline h-3.5 w-3.5 -mt-0.5 text-primary" />{" "}
          <span className="font-medium text-foreground">Compartilhar</span> e depois em{" "}
          <span className="font-medium text-foreground">"Adicionar à Tela de Início"</span>.
        </p>
      </div>
    </div>
  );
}
