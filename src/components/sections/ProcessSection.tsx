import { motion } from "framer-motion";
import houseRenovation from "@/assets/house-renovation.jpg";

const steps = [
  {
    number: "1",
    title: "Triagem",
    description: "Qualificação técnica e de aptidão via WhatsApp.",
  },
  {
    number: "2",
    title: "LLC",
    description: "Suporte na abertura da sua empresa nos EUA para formalização do investimento.",
  },
  {
    number: "3",
    title: "Execução",
    description: "Arremate estratégico no leilão e reforma gerida pela nossa construtora própria.",
  },
  {
    number: "4",
    title: "Título",
    description: "Recebimento do lucro e do título de propriedade oficial em seu nome.",
  },
];

export function ProcessSection() {
  return (
    <section className="section-dark py-24">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <img
              src={houseRenovation}
              alt="Antes e Depois - Reforma"
              className="w-full h-[500px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-sm text-discovery-green font-semibold mb-1">Tababog Construction</p>
              <p className="text-foreground font-bold text-xl">Transformação Completa</p>
            </div>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
              Seu Ativo Pronto em um Ciclo de 6 a 12 Meses
            </h2>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4"
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
