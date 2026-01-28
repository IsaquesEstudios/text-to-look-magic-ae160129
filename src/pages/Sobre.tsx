import { Layout } from "@/components/layout/Layout";
import { SobreHeroSection } from "@/components/sections/SobreHeroSection";
import { CTASection } from "@/components/sections/CTASection";
import { motion } from "framer-motion";
import { Globe, Building, Users, Plane } from "lucide-react";
import partnershipImg from "@/assets/partnership.jpg";

const regions = [
  {
    icon: Building,
    title: "Brasil",
    description: "Dolarização e proteção de patrimônio.",
  },
  {
    icon: Globe,
    title: "Europa",
    description: "Rentabilidade estratégica em moeda forte.",
  },
  {
    icon: Users,
    title: "EUA",
    description: "Gestão profissional para brasileiros residentes.",
  },
  {
    icon: Plane,
    title: "Global",
    description: "Oportunidades para brasileiros em qualquer lugar do planeta.",
  },
];

const Sobre = () => {
  return (
    <Layout>
      <SobreHeroSection
        title="Discovery Investments: Estratégia e Execução no Mercado Americano."
        description="Fundada em agosto de 2025, a Discovery Investments nasceu para democratizar o acesso ao mercado imobiliário dos EUA para brasileiros. Atuamos como sua inteligência em solo americano, cuidando de todo o processo de aquisição, reforma e venda para gerar rentabilidade real em dólar."
        ctaText="Falar com a Discovery"
        backgroundImage={partnershipImg}
      />

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
              Presente Onde Você Estiver
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {regions.map((region, index) => (
              <motion.div
                key={region.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-white rounded-xl border border-discovery-green/10 shadow-sm hover:shadow-md hover:border-discovery-green/30 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-xl bg-discovery-green/10 flex items-center justify-center mx-auto mb-4">
                  <region.icon className="w-8 h-8 text-discovery-green" />
                </div>
                <h3 className="text-xl font-semibold text-discovery-dark mb-2">{region.title}</h3>
                <p className="text-discovery-text text-sm">{region.description}</p>
              </motion.div>
            ))}
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
                Nossos Valores
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center bg-white rounded-xl p-8 border border-discovery-green/10 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-discovery-green mb-3">Transparência</h3>
                <p className="text-discovery-text">
                  Cada etapa do processo é documentada e compartilhada com nossos investidores.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center bg-white rounded-xl p-8 border border-discovery-green/10 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-discovery-green mb-3">Excelência</h3>
                <p className="text-discovery-text">
                  Qualidade técnica em cada reforma e precisão estratégica em cada leilão.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-center bg-white rounded-xl p-8 border border-discovery-green/10 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-discovery-green mb-3">Resultados</h3>
                <p className="text-discovery-text">
                  Focamos exclusivamente em gerar retorno real para nossos parceiros.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="Pronto para conhecer nossa equipe?"
        description="Agende uma conversa e descubra como podemos acelerar sua jornada de investimento."
        ctaText="Falar com um Especialista"
      />
    </Layout>
  );
};

export default Sobre;
