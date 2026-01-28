import { motion } from "framer-motion";
import { MapPin, Home, ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { getLanguageFromPath } from "@/i18n";
import terrenosImage from "@/assets/terrenos.webp";
import heroHouse from "@/assets/hero-house.jpg";

export function ModalitiesSection() {
  const { t } = useTranslation();
  const location = useLocation();
  const currentLang = getLanguageFromPath(location.pathname);

  const investments = [
    {
      icon: MapPin,
      title: t.home.modalities.landTitle,
      subtitle: t.nav.land,
      description: t.home.modalities.landDesc,
      image: terrenosImage,
      link: `/${currentLang}/terrenos`,
    },
    {
      icon: Home,
      title: t.home.modalities.houseTitle,
      subtitle: t.nav.houses,
      description: t.home.modalities.houseDesc,
      image: heroHouse,
      link: `/${currentLang}/casas`,
    },
  ];

  return (
    <section className="section-light py-24 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-discovery-green/5 rounded-full blur-[100px]" />
      <div className="absolute top-1/4 right-1/4 w-[250px] h-[250px] bg-discovery-green/5 rounded-full blur-[100px]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-discovery-dark mb-3">
            {t.home.modalities.title}
          </h2>
          <p className="text-base text-discovery-text max-w-xl">
            {t.home.modalities.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {investments.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={item.link}
                className="group block relative overflow-hidden rounded-2xl bg-white cursor-pointer transition-all duration-500 border border-discovery-green/30 hover:border-discovery-green/50 shadow-lg hover:shadow-[0_0_40px_rgba(48,120,37,0.2)]"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20">
                  <div className="absolute -inset-1 bg-discovery-green/10 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                </div>

                <div className="relative h-56 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent transition-opacity duration-500 group-hover:opacity-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-discovery-green/20 to-discovery-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                
                <div className="relative z-10 p-6 pt-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-discovery-green/10 border border-discovery-green/20 group-hover:bg-discovery-green/20 transition-colors duration-300 -mt-14">
                    <item.icon className="w-6 h-6 text-discovery-green" />
                  </div>
                  
                  <span className="text-xs font-medium text-discovery-green uppercase tracking-wider">
                    {item.subtitle}
                  </span>
                  
                  <h3 className="text-xl font-semibold text-discovery-dark mt-1 mb-3 group-hover:text-discovery-green transition-colors duration-300">
                    {item.title}
                  </h3>
                  
                  <p className="text-sm text-discovery-text leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 text-discovery-green font-medium text-sm">
                    <span>{t.common.learnMore}</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>

                <div className="absolute inset-0 rounded-2xl border border-discovery-green/0 group-hover:border-discovery-green/40 transition-colors duration-500 pointer-events-none" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
