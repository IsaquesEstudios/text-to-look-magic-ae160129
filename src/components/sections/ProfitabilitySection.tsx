import { motion } from "framer-motion";
import { TrendingUp, Shield } from "lucide-react";

export function ProfitabilitySection() {
  return (
    <section className="section-dark py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Lucratividade e Segurança: O Equilíbrio Superior
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card rounded-2xl p-8 border border-border"
          >
            <div className="w-16 h-16 rounded-xl bg-discovery-green/10 flex items-center justify-center mb-6">
              <TrendingUp className="w-8 h-8 text-discovery-green" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Por que é o modelo mais lucrativo?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              O lucro médio de <span className="text-discovery-green font-semibold">90% para terrenos</span> e{" "}
              <span className="text-discovery-green font-semibold">30% para casas</span> é possível porque adquirimos 
              propriedades de pessoas que não pagaram seus impostos. Isso permite arrematar ativos de $50.000 por 
              valores próximos a $5.000, eliminando intermediários.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-2xl p-8 border border-border"
          >
            <div className="w-16 h-16 rounded-xl bg-discovery-green/10 flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-discovery-green" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
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
