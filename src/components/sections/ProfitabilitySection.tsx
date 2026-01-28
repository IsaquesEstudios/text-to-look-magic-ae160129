import { motion } from "framer-motion";
import { TrendingUp, Shield } from "lucide-react";

export function ProfitabilitySection() {
  return (
    <section className="section-dark py-28 relative overflow-hidden">
      {/* Ambient effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-discovery-green/5 rounded-full blur-[150px]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
            Lucratividade e Segurança
          </h2>
          <p className="text-lg text-muted-foreground">O Equilíbrio Superior</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="premium-card p-8 md:p-10 group hover:border-discovery-green/20 border border-transparent transition-all duration-500"
          >
            <div className="w-14 h-14 rounded-xl bg-discovery-green/10 flex items-center justify-center mb-6 group-hover:bg-discovery-green/20 transition-colors duration-300">
              <TrendingUp className="w-7 h-7 text-discovery-green" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Por que é o modelo mais lucrativo?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              O lucro médio de <span className="text-discovery-green font-medium">90% para terrenos</span> e{" "}
              <span className="text-discovery-green font-medium">30% para casas</span> é possível porque adquirimos 
              propriedades de pessoas que não pagaram seus impostos. Isso permite arrematar ativos de $50.000 por 
              valores próximos a $5.000, eliminando intermediários.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="premium-card p-8 md:p-10 group hover:border-discovery-green/20 border border-transparent transition-all duration-500"
          >
            <div className="w-14 h-14 rounded-xl bg-discovery-green/10 flex items-center justify-center mb-6 group-hover:bg-discovery-green/20 transition-colors duration-300">
              <Shield className="w-7 h-7 text-discovery-green" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Por que é o modelo mais seguro?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              As chances de prejuízo são mínimas devido à enorme margem de segurança gerada pelo baixo custo de 
              aquisição. Mesmo que ocorram gastos excedentes na reforma, seu capital principal permanece protegido 
              pelo valor real do imóvel no mercado americano.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
