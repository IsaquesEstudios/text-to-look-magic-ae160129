import { motion } from "framer-motion";

export function InstitutionalSection() {
  return (
    <section className="section-graphite py-28 relative overflow-hidden">
      {/* Subtle ambient effects */}
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-discovery-green/5 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-6 mb-10">
            <div className="w-16 h-16 bg-discovery-green rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-primary-foreground font-bold text-2xl">D</span>
            </div>
            <span className="text-muted-foreground text-2xl">+</span>
            <div className="w-16 h-16 glass-effect border border-border rounded-xl flex items-center justify-center">
              <span className="text-foreground font-bold text-lg">TC</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-8">
            Discovery Investments: Sua Ponte Estratégica para os EUA
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Fundada em agosto de 2025, a Discovery Investments nasceu para democratizar o mercado 
            imobiliário americano para brasileiros no mundo todo.
          </p>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Diferente de outras empresas, possuímos braço operacional próprio através da{" "}
            <span className="text-discovery-green font-medium">Tababog Construction</span>, 
            especialista em reforma de casas. Atuamos como seu General Contractor (GC), 
            transformando oportunidades de leilão em patrimônio sólido e rentável.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
