import { motion } from "framer-motion";
import { MapPin, Home, Users, Crown } from "lucide-react";

const modalities = [
  {
    icon: MapPin,
    title: "Compra Individual de Terrenos",
    price: "$500",
    description: "Taxa de Serviço",
    featured: false,
  },
  {
    icon: Home,
    title: "Compra Individual de Casas",
    price: "$3.000",
    description: "Promoção para os 10 primeiros",
    featured: true,
  },
  {
    icon: Users,
    title: "Venda de Cotas",
    price: "10%",
    description: "Participação por cota do valor de venda",
    featured: false,
  },
  {
    icon: Crown,
    title: "Membership Anual",
    price: "$6.000",
    description: "Investimentos Ilimitados",
    featured: false,
  },
];

export function ModalitiesSection() {
  return (
    <section className="section-light py-24 relative overflow-hidden">
      {/* Subtle ambient blur */}
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-discovery-green/5 rounded-full blur-[100px]" />
      
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
          <p className="text-base text-discovery-text">
            Estruturas escaláveis para todos os níveis de investidores.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {modalities.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative rounded-xl p-6 transition-all duration-500 group ${
                item.featured
                  ? "bg-discovery-dark border border-discovery-green/30 shadow-lg"
                  : "premium-card-light border border-transparent hover:border-discovery-green/20 hover:shadow-md"
              }`}
            >
              {item.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-discovery-green text-primary-foreground text-xs font-medium rounded-full shadow-md">
                  PROMOÇÃO
                </div>
              )}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${
                item.featured ? "bg-discovery-green/20" : "bg-discovery-green/10 group-hover:bg-discovery-green/15"
              }`}>
                <item.icon className="w-5 h-5 text-discovery-green" />
              </div>
              <h3 className={`text-base font-semibold mb-2 ${item.featured ? "text-foreground" : "text-discovery-dark"}`}>
                {item.title}
              </h3>
              <p className="text-2xl font-bold text-discovery-green mb-1">{item.price}</p>
              <p className={`text-xs ${item.featured ? "text-foreground/70" : "text-discovery-text"}`}>
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
