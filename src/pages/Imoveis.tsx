import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "@/hooks/useTranslation";
import { properties, Property } from "@/data/properties";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PropertyGallery } from "@/components/properties/PropertyGallery";

const Imoveis = () => {
  const { t } = useTranslation();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setIsGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
    setTimeout(() => setSelectedProperty(null), 300);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 section-dark overflow-hidden">
        {/* Ambient effects */}
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-discovery-green/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-discovery-green/3 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              {t.properties.hero.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.properties.hero.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Properties Grid Section */}
      <section className="section-dark py-16 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          {/* Properties count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <p className="text-muted-foreground">
              {t.properties.count.replace("{count}", String(properties.length))}
            </p>
          </motion.div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PropertyCard
                  property={property}
                  onClick={() => handlePropertyClick(property)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Modal */}
      <PropertyGallery
        property={selectedProperty}
        isOpen={isGalleryOpen}
        onClose={handleCloseGallery}
      />
    </Layout>
  );
};

export default Imoveis;
