import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const WHATSAPP_LINK = "https://wa.link/0sgbl5";

interface TerrenosHeroSectionProps {
  title: string;
  description: string;
  ctaText: string;
  backgroundImage: string;
}

export function TerrenosHeroSection({
  title,
  description,
  ctaText,
  backgroundImage,
}: TerrenosHeroSectionProps) {
  return (
    <section className="min-h-[85vh] relative overflow-hidden pt-20">
      {/* Full background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      {/* Dark overlay on the left where text is */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 via-40% to-background/30 to-70%" />
      
      {/* Bottom gradient to blend with next section */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-discovery-graphite" />
      
      {/* Top gradient for header area */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-transparent h-32" />
      
      {/* Ambient blur effects */}
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-discovery-green/10 rounded-full blur-[120px]" />
      
      {/* Content - Left aligned */}
      <div className="relative z-10 container mx-auto px-6 h-full flex items-center py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-discovery-green/10 border border-discovery-green/20 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-discovery-green animate-pulse" />
            <span className="text-sm text-discovery-green font-medium">Leilões de Terrenos nos EUA</span>
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground leading-tight mb-6">
            {title}
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8">
            {description}
          </p>
          
          <Button variant="hero" size="xl" asChild>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3">
              {ctaText}
              <ArrowRight size={20} />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
