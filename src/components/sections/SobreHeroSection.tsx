import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const WHATSAPP_LINK = "https://chat.whatsapp.com/J9VELIIjT2FDnRg2vXS6am";

interface SobreHeroSectionProps {
  title: string;
  description: string;
  ctaText: string;
  backgroundImage: string;
}

export function SobreHeroSection({
  title,
  description,
  ctaText,
  backgroundImage,
}: SobreHeroSectionProps) {
  return (
    <section className="min-h-[85vh] relative overflow-hidden pt-20">
      {/* Background - gradient transition to next section */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-discovery-graphite" />
      
      {/* Image on the right side */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-1/2">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        {/* Fade effects to blend image */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-discovery-graphite" />
        <div className="absolute inset-0 bg-gradient-to-t from-discovery-graphite via-transparent to-background/30" />
      </div>
      
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
            <span className="text-sm text-discovery-green font-medium">Desde Agosto de 2025</span>
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
