import { motion } from "framer-motion";
import { TrendingUp, Shield } from "lucide-react";

export function ProfitabilitySection() {
  return (
    <section className="section-light py-24 relative overflow-hidden">
      {/* Subtle ambient effects */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-discovery-green/5 rounded-full blur-[150px]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-discovery-dark mb-3">
            Lucratividade e Segurança
          </h2>
          <p className="text-base text-discovery-text">O Equilíbrio Superior</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="premium-card-light p-8 group hover:shadow-lg transition-all duration-500 border border-transparent hover:border-discovery-green/20"
          >
            <div className="w-12 h-12 rounded-xl bg-discovery-green/10 flex items-center justify-center mb-5 group-hover:bg-discovery-green/15 transition-colors duration-300">
              <TrendingUp className="w-6 h-6 text-discovery-green" />
            </div>
            <h3 className="text-xl font-semibold text-discovery-dark mb-3">
              Por que é o modelo mais lucrativo?
            </h3>
            <p className="text-discovery-text leading-relaxed text-sm">
              O lucro médio de <span className="text-discovery-green font-medium">90% para terrenos</span> e{" "}
              <span className="text-discovery-green font-medium">30% para casas</span> é possível porque adquirimos 
              propriedades de pessoas que não pagaram seus impostos.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="premium-card-light p-8 group hover:shadow-lg transition-all duration-500 border border-transparent hover:border-discovery-green/20"
          >
            <div className="w-12 h-12 rounded-xl bg-discovery-green/10 flex items-center justify-center mb-5 group-hover:bg-discovery-green/15 transition-colors duration-300">
              <Shield className="w-6 h-6 text-discovery-green" />
            </div>
            <h3 className="text-xl font-semibold text-discovery-dark mb-3">
              Por que é o modelo mais seguro?
            </h3>
            <p className="text-discovery-text leading-relaxed text-sm">
              As chances de prejuízo são mínimas devido à enorme margem de segurança gerada pelo baixo custo de 
              aquisição. Seu capital permanece protegido pelo valor real do imóvel.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
