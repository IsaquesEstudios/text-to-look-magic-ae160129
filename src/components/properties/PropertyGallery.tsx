import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, MapPin, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Property } from "@/data/properties";

interface PropertyGalleryProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyGallery({ property, isOpen, onClose }: PropertyGalleryProps) {
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
