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
    <section className="section-graphite py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-3">
            Discovery Investments vs. Mercado Global
          </h2>
          <p className="text-base text-muted-foreground max-w-xl">
            Entenda por que o investimento em propriedades nos EUA supera outras aplicações.
          </p>
        </motion.div>

        {/* Grid 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comparisons.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-xl bg-discovery-dark h-40 cursor-pointer"
            >
              {/* Background image on right side with fade effect */}
              <div 
                className="absolute right-0 top-0 bottom-0 w-[45%] bg-cover bg-center opacity-60 group-hover:opacity-70 transition-opacity duration-500"
                style={{ 
                  backgroundImage: `url(${item.image})`,
                  maskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)'
                }}
              />
              
              {/* Extra fade overlay for smoother transition */}
              <div className="absolute right-0 top-0 bottom-0 w-[45%] bg-gradient-to-r from-discovery-dark via-discovery-dark/60 to-transparent" />
              
              {/* Content on left side */}
              <div className="relative z-10 p-6 h-full flex flex-col justify-center max-w-[65%]">
                <h3 className="text-base md:text-lg font-medium text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
