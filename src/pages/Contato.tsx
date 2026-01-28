import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/sections/HeroSection";
import { CTASection } from "@/components/sections/CTASection";
import { motion } from "framer-motion";
import { MessageCircle, Headphones, Globe, MapPin } from "lucide-react";
import partnership from "@/assets/partnership.jpg";

const channels = [
  { icon: MessageCircle, title: "WhatsApp de Triagem", description: "Onde realizamos sua qualificação técnica e de aptidão inicial." },
  { icon: Headphones, title: "Suporte ao Investidor", description: "Canal exclusivo para parceiros com contratos ativos em terrenos ou casas." },
  { icon: Globe, title: "Atendimento Global", description: "Atendemos brasileiros residentes no Brasil, Europa, EUA e demais regiões do planeta." },
];

const locations = [
  { title: "Sede Operacional", description: "Estados Unidos (Execução de leilões e obras)." },
  { title: "Investidores Atendidos", description: "Brasileiros no Brasil, Europa, EUA e Ásia." },
];

const Contato = () => {
  return (
    <Layout>
      <HeroSection
        title="Conecte-se com sua Rentabilidade em Dólar."
        description="Estamos prontos para orientar sua jornada no mercado imobiliário americano. Seja para tirar dúvidas sobre leilões, abertura de LLC ou para iniciar seu primeiro investimento, nossa equipe técnica está à disposição."
        ctaText="Iniciar Conversa no WhatsApp"
        backgroundImage={partnership}
      />

      <section className="section-graphite py-24">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Nossos Canais Oficiais</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {channels.map((channel, index) => (
              <motion.div key={channel.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-card rounded-xl p-8 border border-border hover:border-discovery-green/50 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-discovery-green/10 flex items-center justify-center mb-6">
                  <channel.icon className="w-7 h-7 text-discovery-green" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{channel.title}</h3>
                <p className="text-muted-foreground">{channel.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-dark py-24">
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
              <h2 className="text-3xl font-bold text-foreground mb-6">Discovery Investments: Sua Inteligência nos EUA</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Fundada em agosto de 2025, a Discovery Investments é a ponte estratégica para brasileiros que buscam lucrar através do House Flipping e leilões de dívidas fiscais nos Estados Unidos.</p>
              <p className="text-muted-foreground leading-relaxed">Com braço operacional próprio através da <span className="text-discovery-green font-semibold">Tababog Construction</span>, garantimos que cada projeto seja executado com máxima eficiência, do arremate à entrega do título de propriedade.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-graphite py-24">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Onde Atuamos</h2>
            <p className="text-lg text-muted-foreground mt-4">Nossa sede operacional está focada no mercado imobiliário americano, mas nossa rede de investidores é global.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {locations.map((location, index) => (
              <motion.div key={location.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="flex items-start gap-4 bg-card rounded-xl p-6 border border-border">
                <div className="w-10 h-10 rounded-lg bg-discovery-green/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-discovery-green" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{location.title}</h3>
                  <p className="text-muted-foreground text-sm">{location.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection title="Pronto para dar o próximo passo?" description="Clique no botão abaixo para falar diretamente com um consultor e iniciar sua triagem." ctaText="Falar com a Discovery Investments" />
    </Layout>
  );
};

export default Contato;
