import { MapPin, Maximize, Phone, Play, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PropertyCardProps {
  image: string;
  title: string;
  location: string;
  price: string;
  size: string;
  details: string;
  phone: string;
  hasVideo?: boolean;
  imageCount?: number;
  status?: "For Sale" | "For Rent" | "Sold";
}

const PropertyCard = ({
  image,
  title,
  location,
  price,
  size,
  details,
  phone,
  hasVideo = false,
  imageCount = 5,
  status = "For Sale",
}: PropertyCardProps) => {
  return (
    <article className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
      {/* Image container */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Status badge */}
        <Badge 
          className={`absolute top-4 left-4 ${
            status === "For Sale" 
              ? "bg-primary text-primary-foreground" 
              : status === "For Rent" 
              ? "bg-accent text-accent-foreground" 
              : "bg-muted text-muted-foreground"
          }`}
        >
          {status}
        </Badge>

        {/* Media indicators */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <span className="flex items-center gap-1 bg-navy/80 text-primary-foreground text-xs px-2 py-1 rounded">
            <Image className="h-3 w-3" />
            {imageCount}
          </span>
          {hasVideo && (
            <span className="flex items-center gap-1 bg-accent/90 text-accent-foreground text-xs px-2 py-1 rounded">
              <Play className="h-3 w-3" />
              Video
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-display text-xl font-semibold text-foreground mb-2 line-clamp-1">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm">{location}</span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Maximize className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">{size}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {details}
        </p>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-display text-2xl font-bold text-primary">{price}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${phone}`} className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Call Now
              </a>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PropertyCard;
