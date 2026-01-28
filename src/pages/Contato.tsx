import { Layout } from "@/components/layout/Layout";
import { CTASection } from "@/components/sections/CTASection";
import { motion } from "framer-motion";
import { MessageCircle, Headphones, Globe, MapPin } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const iconMap = [MessageCircle, Headphones, Globe];

const Contato = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      {/* Compact Hero Section */}
      <section className="section-graphite pt-32 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
              {t.contato.hero.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.contato.hero.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Channels - Light section */}
      <section className="section-light py-24">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-discovery-dark">{t.contato.channels.title}</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.contato.channels.items.map((channel, index) => {
              const Icon = iconMap[index];
              return (
                <motion.div key={channel.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white rounded-xl p-8 border border-discovery-green/10 shadow-sm hover:shadow-md hover:border-discovery-green/30 transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl bg-discovery-green/10 flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-discovery-green" />
                  </div>
                  <h3 className="text-xl font-semibold text-discovery-dark mb-3">{channel.title}</h3>
                  <p className="text-discovery-text">{channel.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Discovery + TC - Dark section */}
      <section className="section-graphite py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-discovery-green rounded-xl flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-2xl">D</span>
                </div>
                <span className="text-muted-foreground text-2xl">+</span>
                <div className="w-16 h-16 bg-card border border-border rounded-xl flex items-center justify-center">
                  <span className="text-foreground font-bold">TC</span>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-bold text-foreground mb-6">{t.contato.partnership.title}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{t.contato.partnership.description1}</p>
              <p className="text-muted-foreground leading-relaxed">{t.contato.partnership.description2} <span className="text-discovery-green font-semibold">{t.contato.partnership.tababog}</span>{t.contato.partnership.description3}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Locations - Cream section */}
      <section className="section-cream py-24">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-discovery-dark">{t.contato.locations.title}</h2>
            <p className="text-lg text-discovery-text mt-4">{t.contato.locations.subtitle}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {t.contato.locations.items.map((location, index) => (
              <motion.div key={location.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="flex items-start gap-4 bg-white rounded-xl p-6 border border-discovery-green/10 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-discovery-green/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-discovery-green" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-discovery-dark mb-1">{location.title}</h3>
                  <p className="text-discovery-text text-sm">{location.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection title={t.contato.cta.title} description={t.contato.cta.description} ctaText={t.contato.cta.button} />
    </Layout>
  );
};

export default Contato;
