import { Layout } from "@/components/layout/Layout";
import { CasasHeroSection } from "@/components/sections/CasasHeroSection";
import { CasasAdvantagesSection } from "@/components/sections/CasasAdvantagesSection";
import { BlogPostsSection } from "@/components/sections/BlogPostsSection";
import { CTASection } from "@/components/sections/CTASection";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import heroHouse from "@/assets/hero-house.jpg";

const Casas = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <CasasHeroSection
        title={t.casas.hero.title}
        description={t.casas.hero.description}
        ctaText={t.casas.hero.cta}
        backgroundImage={heroHouse}
      />

      {/* Business Model - Dark section after hero */}
      <section className="section-graphite py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t.casas.howItWorks.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.casas.howItWorks.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.casas.howItWorks.steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-card rounded-xl p-6 border border-border"
              >
                <div className="w-10 h-10 rounded-full bg-discovery-green flex items-center justify-center mb-4">
                  <span className="text-primary-foreground font-bold">{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                {index < t.casas.howItWorks.steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-4 text-discovery-green" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages - Light section with image */}
      <CasasAdvantagesSection image={heroHouse} />

      {/* Security - Light cream section */}
      <section className="section-cream py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-discovery-dark">
              {t.casas.security.title}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border border-discovery-green/10 shadow-sm"
            >
              <h3 className="text-2xl font-bold text-discovery-dark mb-4">{t.casas.security.costTitle}</h3>
              <p className="text-discovery-text leading-relaxed">
                {t.casas.security.costDesc}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border border-discovery-green/10 shadow-sm"
            >
              <h3 className="text-2xl font-bold text-discovery-dark mb-4">{t.casas.security.legalTitle}</h3>
              <p className="text-discovery-text leading-relaxed">
                {t.casas.security.legalDesc}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process - Dark section */}
      <section className="section-dark py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t.casas.process.title}
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            {t.casas.process.steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 bg-card rounded-xl p-6 border border-border"
              >
                <div className="w-12 h-12 rounded-full bg-discovery-green flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold text-lg">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Light section */}
      <section className="section-light py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 border-2 border-discovery-green shadow-lg"
          >
            <div className="inline-block px-3 py-1 bg-discovery-green text-primary-foreground text-xs font-bold rounded-full mb-4">
              {t.casas.pricing.badge}
            </div>
            <h2 className="text-2xl font-bold text-discovery-dark mb-4">{t.casas.pricing.title}</h2>
            <p className="text-5xl font-bold text-discovery-green mb-2">{t.casas.pricing.price}</p>
            <p className="text-discovery-text text-sm">
              {t.casas.pricing.description}
            </p>
          </motion.div>
        </div>
      </section>

      <BlogPostsSection />

      <CTASection
        title={t.casas.cta.title}
        description={t.casas.cta.description}
        ctaText={t.casas.cta.button}
      />
    </Layout>
  );
};

export default Casas;
