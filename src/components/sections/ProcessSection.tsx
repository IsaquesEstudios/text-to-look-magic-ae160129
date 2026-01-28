import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import houseBeforeAfter from "@/assets/house-before-after.jpg";

export function ProcessSection() {
  const { t } = useTranslation();

  return (
    <section className="section-dark py-28 relative overflow-hidden">
      {/* Ambient effects */}
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-discovery-green/5 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image with premium effects */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden group"
          >
            <img
              src={houseBeforeAfter}
              alt="Before and After - House Transformation"
              className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Multi-layer gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-transparent" />
            
            {/* Blur effect on bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 backdrop-blur-sm" 
                 style={{ 
                   maskImage: 'linear-gradient(to top, black, transparent)',
                   WebkitMaskImage: 'linear-gradient(to top, black, transparent)'
                 }} 
            />
            
            <div className="absolute bottom-8 left-8 right-8">
              <p className="text-sm text-discovery-green font-medium mb-2">Tababog Construction</p>
              <p className="text-foreground font-semibold text-2xl">{t.home.institutional.partnerDesc}</p>
            </div>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-10">
              {t.home.process.title}
            </h2>
            <div className="space-y-8">
              {t.home.process.steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-5 group"
                >
                  <div className="w-14 h-14 rounded-xl bg-discovery-green flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-[0_0_30px_hsl(113_53%_31%/0.3)] transition-shadow duration-300">
                    <span className="text-primary-foreground font-bold text-lg">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
