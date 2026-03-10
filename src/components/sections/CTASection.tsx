import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import cityscape from "@/assets/cityscape.jpg";

interface CTASectionProps {
  title?: string;
  description?: string;
  ctaText?: string;
}

export function CTASection({
  title,
  description,
  ctaText,
}: CTASectionProps) {
  const { t } = useTranslation();
  
  const displayTitle = title || t.home.cta.title;
  const displayDescription = description || t.home.cta.description;
  const displayCtaText = ctaText || t.home.cta.button;

  return (
    <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${cityscape})` }}
      />
      {/* Multi-layer blur overlay */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80" />

      {/* Ambient glow - smaller on mobile */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[450px] md:w-[600px] h-[200px] sm:h-[300px] md:h-[400px] bg-discovery-green/10 rounded-full blur-[80px] sm:blur-[100px] md:blur-[120px]" />

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold text-foreground mb-4 sm:mb-6">
            {displayTitle}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 px-2">
            {displayDescription}
          </p>
          <Button variant="hero" size="lg" className="inline-flex items-center gap-2 sm:gap-3 text-sm sm:text-base" asChild>
            <a href="https://chat.whatsapp.com/J9VELIIjT2FDnRg2vXS6am" target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} className="sm:w-5 sm:h-5" />
              {displayCtaText}
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
