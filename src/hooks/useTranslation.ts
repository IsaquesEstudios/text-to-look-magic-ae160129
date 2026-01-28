import { useLocation } from "react-router-dom";
import { translations, getLanguageFromPath, Language } from "@/i18n";

export function useTranslation() {
  const location = useLocation();
  const lang = getLanguageFromPath(location.pathname);
  const t = translations[lang];

  return { t, lang };
}

export function useLanguage(): Language {
  const location = useLocation();
  return getLanguageFromPath(location.pathname);
}
