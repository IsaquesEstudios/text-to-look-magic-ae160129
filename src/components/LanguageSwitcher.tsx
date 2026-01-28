import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { languages, getLanguageFromPath, getPathWithLanguage, Language } from "@/i18n";

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentLang = getLanguageFromPath(location.pathname);
  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

  const handleLanguageChange = (langCode: Language) => {
    const newPath = getPathWithLanguage(location.pathname, langCode);
    navigate(newPath);
    setIsOpen(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-discovery-green transition-all duration-300"
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.code.toUpperCase()}</span>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 pt-3 z-50"
          >
            <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-discovery-green/10 hover:text-discovery-green ${
                    currentLang === language.code
                      ? "text-discovery-green bg-discovery-green/5"
                      : "text-foreground/80"
                  }`}
                >
                  <span className="text-base">{language.flag}</span>
                  <span>{language.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
