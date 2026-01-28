import { motion } from "framer-motion";
import heroHouse from "@/assets/hero-house.jpg";
import heroLand from "@/assets/hero-land.jpg";
import cityscape from "@/assets/cityscape.jpg";
import houseRenovation from "@/assets/house-renovation.jpg";

const comparisons = [
  {
    image: heroHouse,
    title: "Dólar vs. Moedas Locais",
    description: "Enquanto moedas de outros países sofrem com a inflação, seu patrimônio é lastreado em Dólar.",
  },
  {
    image: heroLand,
    title: "Ativo Real vs. Papel",
    description: "Você possui o título de uma propriedade física em seu nome nos Estados Unidos.",
  },
  {
    image: cityscape,
    title: "Segurança Americana",
    description: "Leis de propriedade estáveis e proteção jurídica superior a qualquer outro mercado global.",
  },
  {
    image: houseRenovation,
    title: "Arbitragem em Leilão",
    description: "Compramos ativos por uma fração do preço real através de leilões fiscais.",
  },
];

export function ComparisonSection() {
  return (
    <section className="section-graphite py-28">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
            Discovery Investments vs. Mercado Global
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Entenda por que o investimento em propriedades nos EUA através do nosso modelo supera qualquer outra aplicação financeira.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {comparisons.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl aspect-[16/10] cursor-pointer"
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              
              {/* Gradient Overlays for fade effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-discovery-dark/95" />
              <div className="absolute inset-0 bg-gradient-to-t from-discovery-dark/80 via-discovery-dark/20 to-transparent" />
              
              {/* Blur overlay on right side */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 backdrop-blur-[2px]" 
                   style={{ 
                     background: 'linear-gradient(to right, transparent, hsl(0 0% 10% / 0.7))',
                     maskImage: 'linear-gradient(to right, transparent, black)',
                     WebkitMaskImage: 'linear-gradient(to right, transparent, black)'
                   }} 
              />
              
              {/* Content */}
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2 drop-shadow-lg">
                  {item.title}
                </h3>
                <p className="text-sm md:text-base text-discovery-text-light/90 leading-relaxed max-w-xs drop-shadow-md">
                  {item.description}
                </p>
              </div>

              {/* Subtle border glow on hover */}
              <div className="absolute inset-0 border border-discovery-green/0 group-hover:border-discovery-green/30 rounded-2xl transition-colors duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
