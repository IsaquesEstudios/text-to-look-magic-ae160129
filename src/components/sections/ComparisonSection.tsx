import { motion } from "framer-motion";
import { Check, DollarSign, Shield, Home, Gavel } from "lucide-react";

const comparisons = [
  {
    icon: DollarSign,
    title: "Dólar vs. Moedas Locais",
    description: "Enquanto moedas de outros países sofrem com a inflação, seu patrimônio é lastreado em Dólar, a reserva de valor global.",
  },
  {
    icon: Home,
    title: "Ativo Real vs. Papel",
    description: "Diferente de ações ou títulos que podem perder valor rapidamente, você possui o título de uma propriedade física em seu nome nos Estados Unidos.",
  },
  {
    icon: Shield,
    title: "Segurança Americana",
    description: "O mercado imobiliário dos EUA oferece leis de propriedade estáveis e proteção jurídica superior a qualquer outro mercado global.",
  },
  {
    icon: Gavel,
    title: "Arbitragem em Leilão",
    description: "Compramos ativos por uma fração do preço real de mercado através de leilões fiscais (tax deeds), algo impossível em investimentos tradicionais.",
  },
];

export function ComparisonSection() {
  return (
    <section className="section-graphite py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Discovery Investments vs. Mercado Global
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Entenda por que o investimento em propriedades nos EUA através do nosso modelo supera qualquer outra aplicação financeira no mundo.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {comparisons.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-card rounded-xl p-6 border border-border hover:border-discovery-green/50 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-discovery-green/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-discovery-green" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
