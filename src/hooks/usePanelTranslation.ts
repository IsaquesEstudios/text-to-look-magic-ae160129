import { useAuth } from "@/hooks/useAuth";
import { translations, Language } from "@/i18n";

export function usePanelTranslation() {
  const { profile } = useAuth();
  const lang = (profile?.preferred_language as Language) || "pt";
  const t = translations[lang];
  return { t, p: t.panel, lang };
}
