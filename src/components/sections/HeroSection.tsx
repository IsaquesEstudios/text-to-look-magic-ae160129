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
    <section className="min-h-screen flex">
      {/* Left Side - Content */}
      <div className="w-full lg:w-1/2 bg-background flex items-center">
        <div className="container mx-auto px-6 lg:px-12 py-20 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              {title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
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

      {/* Right Side - Image */}
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
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/20" />
      </motion.div>
    </section>
  );
}
