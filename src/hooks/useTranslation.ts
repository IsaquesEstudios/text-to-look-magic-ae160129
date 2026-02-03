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

// SSR-safe function to get translation by path (can be used outside React components)
export function getTranslationByPath(pathname: string) {
  const lang = getLanguageFromPath(pathname);
  return { t: translations[lang], lang };
}
