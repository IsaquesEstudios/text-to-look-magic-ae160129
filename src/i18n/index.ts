import { pt } from "./translations/pt";
import { en } from "./translations/en";
import { es } from "./translations/es";

export type Language = "pt" | "en" | "es";

export const translations = {
  pt,
  en,
  es,
} as const;

export const languages: { code: Language; name: string; flag: string }[] = [
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
];

export const defaultLanguage: Language = "pt";

export function detectBrowserLanguage(): Language {
  try {
    const langs = navigator.languages ?? [navigator.language];
    for (const raw of langs) {
      const prefix = raw.split("-")[0].toLowerCase() as Language;
      if (translations[prefix]) return prefix;
    }
  } catch {
    // SSR or unsupported
  }
  return defaultLanguage;
}

export function getLanguageFromPath(pathname: string): Language {
  const segments = pathname.split("/").filter(Boolean);
  const langCode = segments[0] as Language;
  
  if (langCode && translations[langCode]) {
    return langCode;
  }
  
  return detectBrowserLanguage();
}

export function getPathWithLanguage(pathname: string, newLang: Language): string {
  const segments = pathname.split("/").filter(Boolean);
  const currentLang = segments[0] as Language;
  
  if (currentLang && translations[currentLang]) {
    segments[0] = newLang;
  } else {
    segments.unshift(newLang);
  }
  
  return "/" + segments.join("/");
}

export function removeLanguageFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const langCode = segments[0] as Language;
  
  if (langCode && translations[langCode]) {
    return "/" + segments.slice(1).join("/") || "/";
  }
  
  return pathname;
}
