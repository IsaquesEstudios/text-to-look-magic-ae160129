import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/sections/HeroSection";
import { CTASection } from "@/components/sections/CTASection";
import { motion } from "framer-motion";
import { Globe, Building, Users, Plane } from "lucide-react";
import heroHouse from "@/assets/hero-house.jpg";

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
      <HeroSection
        title="Discovery Investments: Estratégia e Execução no Mercado Americano."
        description="Fundada em agosto de 2025, a Discovery Investments nasceu para democratizar o acesso ao mercado imobiliário dos EUA para brasileiros. Atuamos como sua inteligência em solo americano, cuidando de todo o processo de aquisição, reforma e venda para gerar rentabilidade real em dólar."
        ctaText="Falar com a Discovery"
        backgroundImage={heroHouse}
      />

      {/* Structure */}
      <section className="section-graphite py-24">
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
              O Diferencial de Quem Constrói
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Somos também os proprietários da <span className="text-discovery-green font-semibold">Tababog Construction</span>, empresa especialista em reforma de casas.
            </p>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Esta integração nos permite atuar como seu General Contractor (GC), gerenciando diretamente a remodelagem dos ativos para garantir o menor custo operacional e o maior lucro final na venda.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Global Reach */}
      <section className="section-dark py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
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
                className="text-center p-6 bg-card rounded-xl border border-border"
              >
                <div className="w-16 h-16 rounded-xl bg-discovery-green/10 flex items-center justify-center mx-auto mb-4">
                  <region.icon className="w-8 h-8 text-discovery-green" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{region.title}</h3>
                <p className="text-muted-foreground text-sm">{region.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-graphite py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Nossos Valores
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <h3 className="text-xl font-semibold text-discovery-green mb-3">Transparência</h3>
                <p className="text-muted-foreground">
                  Cada etapa do processo é documentada e compartilhada com nossos investidores.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <h3 className="text-xl font-semibold text-discovery-green mb-3">Excelência</h3>
                <p className="text-muted-foreground">
                  Qualidade técnica em cada reforma e precisão estratégica em cada leilão.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h3 className="text-xl font-semibold text-discovery-green mb-3">Resultados</h3>
                <p className="text-muted-foreground">
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
