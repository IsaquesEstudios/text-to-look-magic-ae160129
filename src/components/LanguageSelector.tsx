import { ChevronDown, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import {
  supportedLanguages,
  languageLabels,
  languageFlags,
  SupportedLanguage,
} from '@/i18n';

export function LanguageSelector() {
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-foreground/70 hover:text-foreground hover:bg-discovery-green/10"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{languageFlags[currentLanguage]}</span>
          <span className="hidden md:inline text-xs uppercase">{currentLanguage}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-card border border-border shadow-lg z-[100]"
      >
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => changeLanguage(lang as SupportedLanguage)}
            className={`cursor-pointer gap-3 ${
              currentLanguage === lang
                ? 'bg-discovery-green/10 text-discovery-green'
                : 'hover:bg-muted'
            }`}
          >
            <span className="text-lg">{languageFlags[lang as SupportedLanguage]}</span>
            <span>{languageLabels[lang as SupportedLanguage]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
