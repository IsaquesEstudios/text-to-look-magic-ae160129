import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import heroHouse from "@/assets/hero-house.jpg";
import heroLand from "@/assets/hero-land.jpg";
import cityscape from "@/assets/cityscape.jpg";
import houseRenovation from "@/assets/house-renovation.jpg";

const images = [heroHouse, heroLand, cityscape, houseRenovation];

export function ComparisonSection() {
  const { t } = useTranslation();

  const comparisons = [
    {
      image: heroHouse,
      title: t.home.comparison.dollarTitle,
      description: t.home.comparison.dollarPoints[0],
    },
    {
      image: heroLand,
      title: t.home.comparison.dollarPoints[1],
      description: t.home.comparison.dollarPoints[2],
    },
    {
      image: cityscape,
      title: t.home.comparison.realTitle,
      description: t.home.comparison.realPoints[0],
    },
    {
      image: houseRenovation,
      title: t.home.comparison.realPoints[1],
      description: t.home.comparison.realPoints[2],
    },
  ];

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
            {t.home.comparison.title}
          </h2>
          <p className="text-base text-muted-foreground max-w-xl">
            {t.home.comparison.subtitle}
          </p>
        </motion.div>

        {/* Grid 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {comparisons.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-xl bg-discovery-dark h-44 sm:h-40 cursor-pointer"
            >
              {/* Background image on right side with fade effect */}
              <div 
                className="absolute right-0 top-0 bottom-0 w-[40%] sm:w-[45%] bg-cover bg-center opacity-60 group-hover:opacity-70 transition-opacity duration-500"
                style={{ 
                  backgroundImage: `url(${item.image})`,
                  maskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)'
                }}
              />
              
              {/* Extra fade overlay for smoother transition */}
              <div className="absolute right-0 top-0 bottom-0 w-[40%] sm:w-[45%] bg-gradient-to-r from-discovery-dark via-discovery-dark/60 to-transparent" />
              
              {/* Content on left side */}
              <div className="relative z-10 p-4 sm:p-6 h-full flex flex-col justify-center max-w-[60%] sm:max-w-[65%]">
                <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground mb-1 sm:mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
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
