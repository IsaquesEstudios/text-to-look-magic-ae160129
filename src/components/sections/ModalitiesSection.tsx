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
    <section className="section-graphite py-28 relative overflow-hidden">
      {/* Ambient blur */}
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-discovery-green/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-discovery-green/5 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
            Nossas Modalidades de Investimento
          </h2>
          <p className="text-lg text-muted-foreground">
            Estruturas escaláveis para todos os níveis de investidores.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modalities.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative rounded-2xl p-6 border transition-all duration-500 group ${
                item.featured
                  ? "premium-card border-discovery-green/40 shadow-[0_0_40px_hsl(113_53%_31%/0.2)]"
                  : "premium-card border-transparent hover:border-discovery-green/30"
              }`}
            >
              {item.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-discovery-green text-primary-foreground text-xs font-semibold rounded-full shadow-lg">
                  PROMOÇÃO
                </div>
              )}
              <div className="w-12 h-12 rounded-xl bg-discovery-green/10 flex items-center justify-center mb-4 group-hover:bg-discovery-green/20 transition-colors duration-300">
                <item.icon className="w-6 h-6 text-discovery-green" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-3xl font-bold text-discovery-green mb-1">{item.price}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
