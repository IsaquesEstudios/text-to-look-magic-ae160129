import { motion } from "framer-motion";

export function InstitutionalSection() {
  return (
    <section className="section-graphite py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="w-16 h-16 bg-discovery-green rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">D</span>
            </div>
            <span className="text-muted-foreground text-2xl">+</span>
            <div className="w-16 h-16 bg-card border border-border rounded-xl flex items-center justify-center">
              <span className="text-foreground font-bold text-lg">TC</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Discovery Investments: Sua Ponte Estratégica para os EUA
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Fundada em agosto de 2025, a Discovery Investments nasceu para democratizar o mercado 
            imobiliário americano para brasileiros no mundo todo.
          </p>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Diferente de outras empresas, possuímos braço operacional próprio através da{" "}
            <span className="text-discovery-green font-semibold">Tababog Construction</span>, 
            especialista em reforma de casas. Atuamos como seu General Contractor (GC), 
            transformando oportunidades de leilão em patrimônio sólido e rentável.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
