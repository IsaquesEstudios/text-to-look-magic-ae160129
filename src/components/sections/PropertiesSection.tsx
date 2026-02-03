import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, MapPin, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Property images - Casa 1
import casa1Cover from "@/assets/properties/casa-1/cover.webp";
import casa1Photo2 from "@/assets/properties/casa-1/photo-2.webp";
import casa1Photo3 from "@/assets/properties/casa-1/photo-3.webp";
import casa1Photo4 from "@/assets/properties/casa-1/photo-4.webp";
import casa1Photo5 from "@/assets/properties/casa-1/photo-5.webp";
import casa1Photo6 from "@/assets/properties/casa-1/photo-6.webp";
import casa1Photo7 from "@/assets/properties/casa-1/photo-7.webp";
import casa1Photo8 from "@/assets/properties/casa-1/photo-8.webp";
import casa1Photo9 from "@/assets/properties/casa-1/photo-9.webp";
import casa1Photo10 from "@/assets/properties/casa-1/photo-10.webp";

export type PropertyStatus = "available" | "in_contract" | "sold";

export interface Property {
  id: string;
  address: string;
  status: PropertyStatus;
  coverImage: string;
  images: string[];
  externalLink: string;
}

// Properties data - easily expandable
const properties: Property[] = [
  {
    id: "casa-1",
    address: "501 W Hudson, Elmira, NY",
    status: "in_contract",
    coverImage: casa1Cover,
    images: [
      casa1Cover,
      casa1Photo2,
      casa1Photo3,
      casa1Photo4,
      casa1Photo5,
      casa1Photo6,
      casa1Photo7,
      casa1Photo8,
      casa1Photo9,
      casa1Photo10,
    ],
    externalLink: "https://www.zillow.com/homedetails/501-W-Hudson-St-Elmira-NY-14904/29957315_zpid/",
  },
];

function PropertyCard({ property, onClick }: { property: Property; onClick: () => void }) {
  const { t } = useTranslation();

  const statusColors: Record<PropertyStatus, string> = {
    available: "bg-discovery-green text-white",
    in_contract: "bg-amber-500 text-white",
    sold: "bg-red-500 text-white",
  };

  const statusLabels: Record<PropertyStatus, string> = {
    available: t.home.properties.statusAvailable,
    in_contract: t.home.properties.statusInContract,
    sold: t.home.properties.statusSold,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-discovery-green/30">
        {/* Cover Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={property.coverImage}
            alt={property.address}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Status Badge */}
          <Badge className={`absolute top-4 left-4 ${statusColors[property.status]}`}>
            {statusLabels[property.status]}
          </Badge>
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start gap-2 mb-4">
            <MapPin className="w-5 h-5 text-discovery-green shrink-0 mt-0.5" />
            <span className="text-foreground font-medium">{property.address}</span>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ctaOutline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              {t.home.properties.viewPhotos}
            </Button>
            <Button
              variant="cta"
              size="sm"
              className="flex-1"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <a href={property.externalLink} target="_blank" rel="noopener noreferrer">
                {t.home.properties.seeMore}
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PropertyGallery({
  property,
  isOpen,
  onClose,
}: {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useTranslation();

  if (!property) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === property.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-0 bg-background/95 backdrop-blur-xl border-border">
        <DialogTitle className="sr-only">{property.address} - {t.home.properties.galleryTitle}</DialogTitle>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 hover:bg-background text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-discovery-green" />
            <h3 className="text-lg font-semibold text-foreground">{property.address}</h3>
          </div>
        </div>

        {/* Main Image */}
        <div className="relative aspect-video bg-muted">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={property.images[currentIndex]}
              alt={`${property.address} - Foto ${currentIndex + 1}`}
              className="w-full h-full object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>

          {/* Navigation arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 hover:bg-background text-foreground transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 hover:bg-background text-foreground transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/80 text-foreground text-sm font-medium">
            {currentIndex + 1} / {property.images.length}
          </div>
        </div>

        {/* Thumbnails */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {property.images.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? "border-discovery-green ring-2 ring-discovery-green/30"
                    : "border-border hover:border-discovery-green/50"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Footer with external link */}
        <div className="px-6 py-4 border-t border-border">
          <Button variant="cta" className="w-full" asChild>
            <a href={property.externalLink} target="_blank" rel="noopener noreferrer">
              {t.home.properties.viewOnZillow}
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PropertiesSection() {
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
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onClick={() => handlePropertyClick(property)}
            />
          ))}
        </div>
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
