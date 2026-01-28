import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";

interface HeroSectionProps {
  title: string;
  description: string;
  ctaText: string;
  ctaLink?: string;
  backgroundImage: string;
}

export function HeroSection({
  title,
  description,
  ctaText,
  ctaLink = "#",
  backgroundImage,
}: HeroSectionProps) {
  return (
    <section className="min-h-[75vh] sm:min-h-screen flex flex-col relative overflow-hidden pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-discovery-graphite" />
      
      {/* Ambient blur effects */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-discovery-green/8 rounded-full blur-[150px]" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-discovery-green/5 rounded-full blur-[150px]" />
      
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end px-6 pt-8 sm:pt-12 lg:pt-64 pb-0 mb-[-40px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          {/* Decorative element */}
          <div className="flex justify-center mb-6">
            <Plus className="w-8 h-8 text-discovery-green" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight mb-6">
            {title}
          </h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
            {description}
          </p>
          
          <Button variant="hero" size="xl" asChild>
            <a href={ctaLink} className="inline-flex items-center gap-3">
              {ctaText}
              <ArrowRight size={20} />
            </a>
          </Button>
        </motion.div>
      </div>

      {/* Bottom Image with border effect */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-0 w-full px-4 sm:px-6 md:px-12 lg:px-20 pb-6 md:pb-12 -mt-20 lg:-mt-72 overflow-hidden"
      >
        <div className="relative h-[32vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] rounded-b-[1.5rem] sm:rounded-b-[2rem] md:rounded-b-[3rem] overflow-hidden border-b border-l border-r border-border/30">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          {/* Top fade effect - very strong smooth disappearing */}
          <div className="absolute inset-0 bg-gradient-to-b from-background from-0% via-background/95 via-55% to-background/20 to-100%" />
          {/* Side fade effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
        </div>
      </motion.div>
    </section>
  );
}
