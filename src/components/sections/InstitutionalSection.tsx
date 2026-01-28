import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

export function InstitutionalSection() {
  const { t } = useTranslation();

  return (
    <section className="section-light py-24 relative overflow-hidden">
      {/* Subtle ambient effects */}
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-discovery-green/5 rounded-full blur-[100px]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-5 mb-8">
            <div className="w-14 h-14 bg-discovery-green rounded-xl flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-xl">D</span>
            </div>
            <span className="text-discovery-text text-xl">+</span>
            <div className="w-14 h-14 bg-discovery-light-bg border border-border rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-discovery-dark font-bold text-base">TC</span>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-discovery-dark mb-6">
            {t.home.institutional.title}
          </h2>

          <p className="text-base text-discovery-text leading-relaxed mb-4">
            {t.home.institutional.description}
          </p>

          <p className="text-base text-discovery-text leading-relaxed">
            <span className="text-discovery-green font-medium">{t.home.institutional.partnerTitle}</span>: {t.home.institutional.partnerDesc}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
