import { Layout } from "@/components/layout/Layout";
import { CTASection } from "@/components/sections/CTASection";
import { motion } from "framer-motion";
import { Globe, Building, Users, Plane } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const iconMap = [Building, Globe, Users, Plane];

const Sobre = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      {/* Structure - Dark section after hero */}
      <section className="section-graphite py-24 pt-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="w-20 h-20 bg-discovery-green rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-3xl">D</span>
              </div>
              <span className="text-muted-foreground text-3xl">+</span>
              <div className="w-20 h-20 bg-card border border-border rounded-xl flex items-center justify-center">
                <span className="text-foreground font-bold text-xl">TC</span>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t.sobre.structure.title}
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              {t.sobre.structure.description1} <span className="text-discovery-green font-semibold">{t.sobre.structure.tababog}</span>{t.sobre.structure.description2}
            </p>

            <p className="text-lg text-muted-foreground leading-relaxed">
              {t.sobre.structure.description3}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Global Reach - Light section */}
      <section className="section-light py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-discovery-dark">
              {t.sobre.global.title}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.sobre.global.regions.map((region, index) => {
              const Icon = iconMap[index];
              return (
                <motion.div
                  key={region.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-6 bg-white rounded-xl border border-discovery-green/10 shadow-sm hover:shadow-md hover:border-discovery-green/30 transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-xl bg-discovery-green/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-discovery-green" />
                  </div>
                  <h3 className="text-xl font-semibold text-discovery-dark mb-2">{region.title}</h3>
                  <p className="text-discovery-text text-sm">{region.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values - Light cream section */}
      <section className="section-cream py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-discovery-dark">
                {t.sobre.values.title}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {t.sobre.values.items.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center bg-white rounded-xl p-8 border border-discovery-green/10 shadow-sm"
                >
                  <h3 className="text-xl font-semibold text-discovery-green mb-3">{value.title}</h3>
                  <p className="text-discovery-text">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title={t.sobre.cta.title}
        description={t.sobre.cta.description}
        ctaText={t.sobre.cta.button}
      />
    </Layout>
  );
};

export default Sobre;
