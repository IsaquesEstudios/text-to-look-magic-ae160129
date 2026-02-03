import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Property, PropertyStatus } from "@/data/properties";

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const { t } = useTranslation();

  const statusColors: Record<PropertyStatus, string> = {
    available: "bg-discovery-green text-white",
    in_contract: "bg-amber-500 text-white",
    sold: "bg-red-500 text-white",
    in_renovation: "bg-blue-500 text-white",
  };

  const statusLabels: Record<PropertyStatus, string> = {
    available: t.home.properties.statusAvailable,
    in_contract: t.home.properties.statusInContract,
    sold: t.home.properties.statusSold,
    in_renovation: t.home.properties.statusInRenovation,
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
