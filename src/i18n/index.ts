import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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

// Create resources object with proper typing
const resources = {
  'pt-br': { translation: ptBR },
  'en-us': { translation: enUS },
  'es-es': { translation: esES },
} as const;

// Export the init promise so we can wait for it
export const i18nPromise = i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt-br',
    fallbackLng: 'pt-br',
    supportedLngs: ['pt-br', 'en-us', 'es-es'],
    ns: ['translation'],
    defaultNS: 'translation',
    keySeparator: '.',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
