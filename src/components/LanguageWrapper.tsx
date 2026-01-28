import { useEffect } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, SupportedLanguage } from '@/i18n';

export function LanguageWrapper() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if lang param is valid
    if (lang && supportedLanguages.includes(lang as SupportedLanguage)) {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
    }
  }, [lang, i18n]);

  // If no lang in URL, redirect to detected language
  useEffect(() => {
    if (!lang) {
      const detectedLang = i18n.language || 'pt-br';
      const validLang = supportedLanguages.includes(detectedLang as SupportedLanguage)
        ? detectedLang
        : 'pt-br';
      navigate(`/${validLang}${location.pathname}${location.search}`, { replace: true });
    }
  }, [lang, i18n.language, navigate, location.pathname, location.search]);

  if (!lang) {
    return null; // Will redirect
  }

  return <Outlet />;
}
