import { Link, useLocation } from "react-router-dom";
import { MessageCircle, Mail, MapPin } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { getLanguageFromPath } from "@/i18n";
import discoveryLogo from "@/assets/discovery-logo.png";

export function Footer() {
  const { t } = useTranslation();
  const location = useLocation();
  const currentLang = getLanguageFromPath(location.pathname);

  return (
    <footer className="section-graphite border-t border-border/30 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-discovery-green/5 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={discoveryLogo} 
                alt="Discovery Investments" 
                className="h-10 w-auto"
              />
              <div>
                <span className="text-foreground font-semibold">Discovery</span>
                <span className="text-discovery-green font-semibold"> Investments</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t.footer.description}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">{t.footer.navigation}</h4>
            <nav className="flex flex-col gap-3">
              <Link to={`/${currentLang}`} className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">{t.nav.home}</Link>
              <Link to={`/${currentLang}/terrenos`} className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">{t.footer.landInvestment}</Link>
              <Link to={`/${currentLang}/casas`} className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">{t.footer.houseInvestment}</Link>
              <Link to={`/${currentLang}/sobre`} className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">{t.nav.about}</Link>
              <Link to={`/${currentLang}/blog`} className="text-muted-foreground hover:text-discovery-green transition-colors text-sm">{t.nav.blog}</Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">{t.footer.modalities}</h4>
            <nav className="flex flex-col gap-3">
              <span className="text-muted-foreground text-sm">{t.footer.individualLand}</span>
              <span className="text-muted-foreground text-sm">{t.footer.individualHouse}</span>
              <span className="text-muted-foreground text-sm">{t.footer.quotaSale}</span>
              <span className="text-muted-foreground text-sm">{t.footer.annualMembership}</span>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-foreground font-semibold">{t.footer.contact}</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <div className="w-8 h-8 rounded-lg bg-discovery-green/10 flex items-center justify-center">
                  <MessageCircle size={16} className="text-discovery-green" />
                </div>
                <span>{t.footer.whatsappTriage}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <div className="w-8 h-8 rounded-lg bg-discovery-green/10 flex items-center justify-center">
                  <Mail size={16} className="text-discovery-green" />
                </div>
                <span>contato@discovery.com</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <div className="w-8 h-8 rounded-lg bg-discovery-green/10 flex items-center justify-center">
                  <MapPin size={16} className="text-discovery-green" />
                </div>
                <span>{t.footer.unitedStates}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
