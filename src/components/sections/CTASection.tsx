import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import cityscape from "@/assets/cityscape.jpg";

interface CTASectionProps {
  title?: string;
  description?: string;
  ctaText?: string;
}

export function CTASection({
  title = "Pronto para ser um Investidor Global?",
  description = "Cuidamos de toda a burocracia, obra e venda para você lucrar em dólar.",
  ctaText = "Consultar Aptidão via WhatsApp",
}: CTASectionProps) {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${cityscape})` }}
      />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {description}
          </p>
          <Button variant="hero" size="xl" className="inline-flex items-center gap-3">
            <MessageCircle size={20} />
            {ctaText}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
