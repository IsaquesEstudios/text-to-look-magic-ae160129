import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroHouse from "@/assets/hero-house.jpg";
import heroLand from "@/assets/hero-land.jpg";
import cityscape from "@/assets/cityscape.jpg";
import houseRenovation from "@/assets/house-renovation.jpg";

const comparisons = [
  {
    image: heroHouse,
    title: "Dólar vs. Moedas Locais",
    description: "Patrimônio lastreado na moeda mais forte do mundo.",
    size: "large", // spans 2 columns
    aspectRatio: "aspect-[16/9]",
  },
  {
    image: heroLand,
    title: "Ativo Real vs. Papel",
    description: "Propriedade física em seu nome nos EUA.",
    size: "small",
    aspectRatio: "aspect-[4/3]",
  },
  {
    image: cityscape,
    title: "Segurança Americana",
    description: "Leis estáveis e proteção jurídica superior.",
    size: "small",
    aspectRatio: "aspect-[4/3]",
  },
  {
    image: houseRenovation,
    title: "Arbitragem em Leilão",
    description: "Ativos por fração do preço real.",
    size: "medium",
    aspectRatio: "aspect-[3/2]",
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

        {/* Asymmetric Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* First Row - Large + Small */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 group relative overflow-hidden rounded-xl cursor-pointer"
          >
            <div className={`${comparisons[0].aspectRatio} relative overflow-hidden`}>
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-60"
                style={{ backgroundImage: `url(${comparisons[0].image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-discovery-dark/90 via-discovery-dark/40 to-discovery-dark/20" />
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    {comparisons[0].title}
                  </h3>
                  <p className="text-sm text-foreground/70 max-w-xs">
                    {comparisons[0].description}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-fit text-xs">
                  Ver detalhes
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative overflow-hidden rounded-xl cursor-pointer"
          >
            <div className={`${comparisons[1].aspectRatio} relative overflow-hidden`}>
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-50"
                style={{ backgroundImage: `url(${comparisons[1].image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-discovery-dark/90 via-discovery-dark/50 to-discovery-dark/30" />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <h3 className="text-base font-medium text-foreground mb-1">
                  {comparisons[1].title}
                </h3>
                <p className="text-xs text-foreground/70">
                  {comparisons[1].description}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Second Row - Small + Small + Medium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative overflow-hidden rounded-xl cursor-pointer"
          >
            <div className="aspect-[5/4] relative overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-50"
                style={{ backgroundImage: `url(${comparisons[2].image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-discovery-dark/90 via-discovery-dark/50 to-discovery-dark/30" />
              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-medium text-foreground mb-1">
                    {comparisons[2].title}
                  </h3>
                  <p className="text-xs text-foreground/70">
                    {comparisons[2].description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-2 group relative overflow-hidden rounded-xl cursor-pointer"
          >
            <div className="aspect-[21/9] relative overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-50"
                style={{ backgroundImage: `url(${comparisons[3].image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-discovery-dark/90 via-discovery-dark/40 to-discovery-dark/20" />
              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-medium text-foreground mb-1">
                    {comparisons[3].title}
                  </h3>
                  <p className="text-xs text-foreground/70 max-w-xs">
                    {comparisons[3].description}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-fit text-xs">
                  Saiba mais
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
