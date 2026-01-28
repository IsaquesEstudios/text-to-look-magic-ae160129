import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from './locales/pt-br.json';
import enUS from './locales/en-us.json';
import esES from './locales/es-es.json';

export const supportedLanguages = ['pt-br', 'en-us', 'es-es'] as const;
export type SupportedLanguage = typeof supportedLanguages[number];

export const languageLabels: Record<SupportedLanguage, string> = {
  'pt-br': 'Português (BR)',
  'en-us': 'English (US)',
  'es-es': 'Español (ES)',
};

export const languageFlags: Record<SupportedLanguage, string> = {
  'pt-br': '🇧🇷',
  'en-us': '🇺🇸',
  'es-es': '🇪🇸',
};

const resources = {
  'pt-br': { translation: ptBR },
  'en-us': { translation: enUS },
  'es-es': { translation: esES },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-br',
    supportedLngs: supportedLanguages,
    detection: {
      order: ['path', 'navigator', 'htmlTag'],
      lookupFromPathIndex: 0,
      caches: [],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
