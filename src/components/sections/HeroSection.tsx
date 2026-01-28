import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
    <section className="min-h-screen flex relative overflow-hidden">
      {/* Ambient blur effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-discovery-green/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-discovery-green/5 rounded-full blur-[100px]" />
      
      {/* Left Side - Content */}
      <div className="w-full lg:w-1/2 bg-background flex items-center relative z-10">
        <div className="w-full px-6 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] lg:pr-12 py-20 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight mb-6">
              {title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
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
      </div>

      {/* Right Side - Image with fade effect */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden lg:block w-1/2 relative"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        {/* Multi-layer fade effect */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/30 to-background" />
        <div className="absolute inset-0 backdrop-blur-[1px]" 
             style={{ 
               maskImage: 'linear-gradient(to right, black 20%, transparent 80%)',
               WebkitMaskImage: 'linear-gradient(to right, black 20%, transparent 80%)'
             }} 
        />
      </motion.div>
    </section>
  );
}
