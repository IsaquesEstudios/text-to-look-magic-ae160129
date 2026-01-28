import { motion } from "framer-motion";
import { TrendingUp, Shield } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function ProfitabilitySection() {
  const { t } = useTranslation();

  return (
    <section className="section-light py-24 relative overflow-hidden">
      {/* Subtle ambient effects */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-discovery-green/5 rounded-full blur-[150px]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-discovery-dark mb-3">
            {t.home.profitability.title}
          </h2>
          <p className="text-base text-discovery-text">{t.home.profitability.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="premium-card-light p-8 group hover:shadow-lg transition-all duration-500 border border-transparent hover:border-discovery-green/20"
          >
            <div className="w-12 h-12 rounded-xl bg-discovery-green/10 flex items-center justify-center mb-5 group-hover:bg-discovery-green/15 transition-colors duration-300">
              <TrendingUp className="w-6 h-6 text-discovery-green" />
            </div>
            <h3 className="text-xl font-semibold text-discovery-dark mb-3">
              {t.home.profitability.landTitle}
            </h3>
            <p className="text-4xl font-bold text-discovery-green mb-2">{t.home.profitability.landReturn}</p>
            <p className="text-discovery-text leading-relaxed text-sm">
              {t.home.profitability.landDesc} • {t.home.profitability.landTime}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="premium-card-light p-8 group hover:shadow-lg transition-all duration-500 border border-transparent hover:border-discovery-green/20"
          >
            <div className="w-12 h-12 rounded-xl bg-discovery-green/10 flex items-center justify-center mb-5 group-hover:bg-discovery-green/15 transition-colors duration-300">
              <Shield className="w-6 h-6 text-discovery-green" />
            </div>
            <h3 className="text-xl font-semibold text-discovery-dark mb-3">
              {t.home.profitability.houseTitle}
            </h3>
            <p className="text-4xl font-bold text-discovery-green mb-2">{t.home.profitability.houseReturn}</p>
            <p className="text-discovery-text leading-relaxed text-sm">
              {t.home.profitability.houseDesc} • {t.home.profitability.houseTime}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
