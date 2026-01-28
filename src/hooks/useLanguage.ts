import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { SupportedLanguage, supportedLanguages } from '@/i18n';

export function useLanguage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams<{ lang: string }>();

  const currentLanguage = (lang as SupportedLanguage) || 'pt-br';

  const changeLanguage = useCallback(
    (newLang: SupportedLanguage) => {
      if (newLang === currentLanguage) return;

      // Get current path without language prefix
      const pathWithoutLang = location.pathname.replace(
        new RegExp(`^/(${supportedLanguages.join('|')})`),
        ''
      ) || '/';

      // Update i18n language
      i18n.changeLanguage(newLang);

      // Navigate to new language path
      navigate(`/${newLang}${pathWithoutLang === '/' ? '' : pathWithoutLang}${location.search}`, {
        replace: true,
      });
    },
    [currentLanguage, i18n, location.pathname, location.search, navigate]
  );

  return {
    currentLanguage,
    changeLanguage,
    t: i18n.t,
  };
}
