import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { getLanguageFromPath } from "@/i18n";

export function CookieConsentBanner() {
  const [show, setShow] = useState(false);
  const location = useLocation();
  const lang = getLanguageFromPath(location.pathname);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShow(false);
  };

  const texts = {
    pt: {
      message: "Utilizamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa",
      privacy: "Política de Privacidade",
      cookies: "Política de Cookies",
      accept: "Aceitar",
      decline: "Recusar",
      and: "e",
    },
    en: {
      message: "We use cookies to improve your experience. By continuing to browse, you agree to our",
      privacy: "Privacy Policy",
      cookies: "Cookie Policy",
      accept: "Accept",
      decline: "Decline",
      and: "and",
    },
    es: {
      message: "Utilizamos cookies para mejorar su experiencia. Al continuar navegando, usted acepta nuestra",
      privacy: "Política de Privacidad",
      cookies: "Política de Cookies",
      accept: "Aceptar",
      decline: "Rechazar",
      and: "y",
    },
  };

  const t = texts[lang] || texts.pt;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] p-4 animate-in slide-in-from-bottom duration-500"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}>
      <div className="relative mx-auto max-w-lg rounded-2xl bg-card border border-border p-5 shadow-2xl">
        <button onClick={decline} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Cookie size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-relaxed pr-4">
              {t.message}{" "}
              <Link to={`/${lang}/privacidade`} className="text-primary hover:underline">{t.privacy}</Link>
              {" "}{t.and}{" "}
              <Link to={`/${lang}/cookies`} className="text-primary hover:underline">{t.cookies}</Link>.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={accept}
                className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
              >
                {t.accept}
              </button>
              <button
                onClick={decline}
                className="bg-muted text-muted-foreground px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                {t.decline}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
