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
      {/* Multi-layer blur overlay */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-discovery-green/10 rounded-full blur-[120px]" />

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-semibold text-foreground mb-6">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
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
