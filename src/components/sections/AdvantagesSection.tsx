import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Clock, Shield } from "lucide-react";

const advantages = [
  {
    icon: TrendingUp,
    title: "Alta Rentabilidade",
    description: "Os terrenos oferecem uma margem média de 90% sobre o valor investido.",
  },
  {
    icon: DollarSign,
    title: "Baixo Custo de Entrada",
    description: "Por não exigir reformas, o terreno permite um aporte inicial menor que o de casas.",
  },
  {
    icon: Clock,
    title: "Giro de Capital",
    description: "O ciclo médio de retorno entre o arremate e a venda final varia de 6 meses a 1 ano.",
  },
  {
    icon: Shield,
    title: "Segurança Patrimonial",
    description: "Você adquire um ativo físico real, protegido pelo sistema jurídico americano.",
  },
];

interface AdvantagesSectionProps {
  image: string;
}

export function AdvantagesSection({ image }: AdvantagesSectionProps) {
  return (
    <section className="section-light py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-discovery-dark">
            As Vantagens de Investir em Terra
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image on the left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={image} 
                alt="Terreno para investimento"
                className="w-full h-[400px] object-cover"
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-discovery-green/20 to-transparent" />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-discovery-green/10 rounded-2xl -z-10" />
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-discovery-green/5 rounded-xl -z-10" />
          </motion.div>

          {/* Advantages on the right */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {advantages.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl bg-white border border-discovery-green/10 shadow-sm hover:shadow-md hover:border-discovery-green/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-discovery-green/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-discovery-green" />
                </div>
                <h3 className="text-lg font-semibold text-discovery-dark mb-2">{item.title}</h3>
                <p className="text-discovery-text text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
