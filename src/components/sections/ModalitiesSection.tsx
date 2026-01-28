import { motion } from "framer-motion";
import { MapPin, Home, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroLand from "@/assets/hero-land.jpg";
import heroHouse from "@/assets/hero-house.jpg";

const investments = [
  {
    icon: MapPin,
    title: "Terrenos",
    subtitle: "Leilões de Terrenos nos EUA",
    description: "Adquira terrenos em leilões americanos com alta valorização e segurança jurídica.",
    image: heroLand,
    link: "/terrenos",
  },
  {
    icon: Home,
    title: "Casas",
    subtitle: "House Flipping",
    description: "Invista em casas para reforma e revenda com retornos de 15-25% em 6-12 meses.",
    image: heroHouse,
    link: "/casas",
  },
];

export function ModalitiesSection() {
  return (
    <section className="section-light py-24 relative overflow-hidden">
      {/* Subtle ambient blur */}
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-discovery-green/5 rounded-full blur-[100px]" />
      <div className="absolute top-1/4 right-1/4 w-[250px] h-[250px] bg-discovery-green/5 rounded-full blur-[100px]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-discovery-dark mb-3">
            Nossas Modalidades de Investimento
          </h2>
          <p className="text-base text-discovery-text max-w-xl mx-auto">
            Duas formas estratégicas de investir no mercado imobiliário americano com segurança e rentabilidade.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {investments.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <Link
                to={item.link}
                className="group block relative rounded-2xl overflow-hidden bg-white border border-discovery-green/20 shadow-lg transition-all duration-500 hover:shadow-[0_0_40px_rgba(48,120,37,0.15)] hover:border-discovery-green/40"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-discovery-green/5 via-transparent to-discovery-green/5" />
                  <div className="absolute -inset-1 bg-discovery-green/10 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                </div>

                {/* Image with fade effect */}
                <div className="relative h-48 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  {/* Fade overlays */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40" />
                </div>

                {/* Content */}
                <div className="relative p-6 pt-0 -mt-8">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-discovery-green/10 border border-discovery-green/20 group-hover:bg-discovery-green/20 transition-colors duration-300">
                    <item.icon className="w-6 h-6 text-discovery-green" />
                  </div>
                  
                  <span className="text-xs font-medium text-discovery-green uppercase tracking-wider">
                    {item.subtitle}
                  </span>
                  
                  <h3 className="text-xl font-semibold text-discovery-dark mt-1 mb-2 group-hover:text-discovery-green transition-colors duration-300">
                    {item.title}
                  </h3>
                  
                  <p className="text-sm text-discovery-text leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 text-discovery-green font-medium text-sm">
                    <span>Saiba mais</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>

                {/* Subtle border glow */}
                <div className="absolute inset-0 rounded-2xl border border-discovery-green/0 group-hover:border-discovery-green/30 transition-colors duration-500 pointer-events-none" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
