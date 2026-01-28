import { Layout } from "@/components/layout/Layout";
import { TerrenosHeroSection } from "@/components/sections/TerrenosHeroSection";
import { AdvantagesSection } from "@/components/sections/AdvantagesSection";
import { CTASection } from "@/components/sections/CTASection";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import terrenosImage from "@/assets/terrenos.webp";

const flowSteps = [
  {
    title: "A Dívida Fiscal",
    description: "Quando um proprietário nos EUA deixa de pagar os impostos territoriais (Property Tax), o governo local coloca essa dívida à venda para recuperar os fundos para o condado.",
  },
  {
    title: "O Arremate no Leilão",
    description: "Nós entramos em cena arrematando o título da propriedade (Tax Deed) diretamente em leilão por valores que representam apenas o montante dos impostos atrasados, o que permite comprar terrenos de $50.000 por valores próximos a $5.000.",
  },
  {
    title: "A Venda Estratégica",
    description: "Após a aquisição legal e a posse do título, o terreno é colocado à venda no mercado convencional pelo seu valor real, permitindo que o investidor realize o lucro da operação.",
  },
];

const processSteps = [
  { number: "1", title: "Triagem", description: "Qualificação técnica via WhatsApp para entender seu perfil." },
  { number: "2", title: "Estruturação Legal", description: "Suporte total para a abertura da sua LLC nos EUA." },
  { number: "3", title: "Arremate Estratégico", description: "A Discovery realiza a compra do terreno diretamente para sua empresa." },
  { number: "4", title: "Liquidação", description: "O imóvel é vendido e o investidor recebe o capital investido somado ao lucro." },
];

const Terrenos = () => {
  return (
    <Layout>
      <TerrenosHeroSection
        title="Investimento em Terrenos nos EUA: Lucratividade Média de 90%."
        description="Inicie sua jornada de dolarização com o ativo de maior giro e margem do mercado imobiliário americano. A Discovery Investments identifica terrenos em leilões estratégicos, permitindo que você adquira propriedades por uma fração do valor de mercado e colha lucros excepcionais."
        ctaText="Quero Investir em Terrenos"
        backgroundImage={terrenosImage}
      />

      {/* How it Works - Dark section after hero */}
      <section className="section-graphite py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como transformamos dívidas em lucros extraordinários
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Muitas pessoas nos perguntam como é possível encontrar terrenos por valores tão abaixo do mercado. A resposta está no sistema de leilões de dívidas fiscais dos EUA.
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
      <AdvantagesSection image={terrenosImage} />

      {/* Profitability - White section */}
      <section className="section-cream py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border border-discovery-green/10 shadow-sm"
            >
              <h3 className="text-2xl font-bold text-discovery-dark mb-4">Como funciona o lucro?</h3>
              <p className="text-discovery-text leading-relaxed">
                O lucro no leilão é realizado no momento da compra. Quando adquirimos um ativo por uma fração do seu valor, criamos uma margem de segurança onde, mesmo com oscilações no preço de venda, seu capital principal permanece rentável.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border border-discovery-green/10 shadow-sm"
            >
              <h3 className="text-2xl font-bold text-discovery-dark mb-4">Segurança Jurídica Garantida</h3>
              <p className="text-discovery-text leading-relaxed">
                O processo é formalizado através de uma empresa (LLC) em seu nome e o ciclo termina com o título oficial da propriedade entregue ao investidor.
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
              Como Iniciar seu Investimento
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
            <h2 className="text-2xl font-bold text-discovery-dark mb-4">Taxa de Serviço Discovery</h2>
            <p className="text-5xl font-bold text-discovery-green mb-2">$500</p>
            <p className="text-discovery-text">
              Esta taxa cobre nossa assessoria na aquisição estratégica, garantindo que você compre apenas ativos com alto potencial de revenda.
            </p>
          </motion.div>
        </div>
      </section>

      <CTASection
        title="Pronto para lucrar 90% em dólares?"
        description="Fale agora com um especialista da Discovery Investments e saiba se você está apto a começar."
        ctaText="Consultar Aptidão para Terrenos"
      />
    </Layout>
  );
};

export default Terrenos;
