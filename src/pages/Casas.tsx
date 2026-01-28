import { Layout } from "@/components/layout/Layout";
import { CasasHeroSection } from "@/components/sections/CasasHeroSection";
import { CasasAdvantagesSection } from "@/components/sections/CasasAdvantagesSection";
import { CTASection } from "@/components/sections/CTASection";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroHouse from "@/assets/hero-house.jpg";

const flowSteps = [
  {
    title: "Compra Estratégica",
    description: "Identificamos casas com dívidas fiscais acumuladas e as arrematamos em leilões de Tax Deed diretamente do governo, eliminando intermediários e garantindo preços baixos.",
  },
  {
    title: "Reforma Técnica (Remodelagem)",
    description: "Nossa equipe da Tababog Construction entra em cena para realizar a remodelagem completa do imóvel, aumentando drasticamente o seu valor de mercado.",
  },
  {
    title: "Liquidação",
    description: "Com a casa reformada e o título em nome do investidor, realizamos a venda no mercado convencional, entregando o capital investido somado ao lucro.",
  },
];

const processSteps = [
  { number: "1", title: "Qualificação", description: "Triagem técnica via WhatsApp para entender seu perfil de investimento." },
  { number: "2", title: "Formalização", description: "Suporte total para abertura da sua empresa (LLC) nos EUA." },
  { number: "3", title: "Aquisição e Obra", description: "Arremate da casa no leilão e início imediato da reforma pela nossa construtora." },
  { number: "4", title: "Venda e Lucro", description: "Liquidação do imóvel e recebimento dos valores na conta da sua empresa." },
];

const Casas = () => {
  return (
    <Layout>
      <CasasHeroSection
        title="Investimento em Casas nos EUA: Lucratividade Média de 30% com Ativos Reais."
        description="Domine o mercado de House Flipping americano com a estrutura completa da Discovery Investments. Adquira propriedades em leilões estratégicos por uma fração do valor de mercado, realize a reforma com nossa construtora própria e colha lucros expressivos em dólar."
        ctaText="Quero Investir em Casas"
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
              Transformamos Casas com Dívidas em Patrimônio Lucrativo
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              O segredo do nosso sucesso está na compra estratégica e na execução técnica impecável.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {flowSteps.map((step, index) => (
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
                {index < flowSteps.length - 1 && (
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
              Segurança Garantida por Margens de Lucro Robustas
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border border-discovery-green/10 shadow-sm"
            >
              <h3 className="text-2xl font-bold text-discovery-dark mb-4">O que acontece se a obra custar mais?</h3>
              <p className="text-discovery-text leading-relaxed">
                Trabalhamos com uma margem de segurança tão grande (comprando por valores como $5.000 propriedades que valem $50.000 pós-obra) que, mesmo em casos de gastos imprevistos, seu capital principal permanece protegido.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border border-discovery-green/10 shadow-sm"
            >
              <h3 className="text-2xl font-bold text-discovery-dark mb-4">Garantia Jurídica do Título</h3>
              <p className="text-discovery-text leading-relaxed">
                O investidor possui o controle total através de sua própria LLC nos EUA, e o processo só termina com a entrega do título oficial de propriedade.
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
              Sua Jornada de 6 a 12 Meses
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 bg-card rounded-xl p-6 border border-border"
              >
                <div className="w-12 h-12 rounded-full bg-discovery-green flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold text-lg">{step.number}</span>
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
              PROMOÇÃO
            </div>
            <h2 className="text-2xl font-bold text-discovery-dark mb-4">Taxa de Serviço Discovery para Casas</h2>
            <p className="text-5xl font-bold text-discovery-green mb-2">$3.000</p>
            <p className="text-discovery-text text-sm">
              Esta taxa especial é válida para os primeiros 10 contratos. O valor escala em $500 a cada 10 novos contratos até atingir o teto de $5.000.
            </p>
          </motion.div>
        </div>
      </section>

      <CTASection
        title="Pronto para lucrar em dólar com imóveis físicos?"
        description="Fale agora com um especialista da Discovery Investments e garanta sua taxa promocional de $3.000."
        ctaText="Consultar Aptidão para Casas"
      />
    </Layout>
  );
};

export default Casas;
