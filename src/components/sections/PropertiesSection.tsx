import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation, useLanguage } from "@/hooks/useTranslation";
import { getLatestProperties, Property } from "@/data/properties";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PropertyGallery } from "@/components/properties/PropertyGallery";

export function PropertiesSection() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Get only the 3 latest properties for home page
  const latestProperties = getLatestProperties(3);

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setIsGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
    setTimeout(() => setSelectedProperty(null), 300);
  };

  return (
    <section className="section-dark py-24 relative overflow-hidden">
      {/* Ambient effects */}
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-discovery-green/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-discovery-green/3 rounded-full blur-[100px]" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-4">
            {t.home.properties.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.home.properties.subtitle}
          </p>
        </motion.div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onClick={() => handlePropertyClick(property)}
            />
          ))}
        </div>

        {/* See More Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center mt-12"
        >
          <Button
            variant="ghost"
            asChild
            className="text-muted-foreground hover:text-discovery-green group"
          >
            <Link to={`/${lang}/imoveis`}>
              {t.home.properties.viewAll}
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Gallery Modal */}
      <PropertyGallery
        property={selectedProperty}
        isOpen={isGalleryOpen}
        onClose={handleCloseGallery}
      />
    </section>
  );
}
