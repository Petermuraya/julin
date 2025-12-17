import React from 'react';
import { MapPin, Home, Calendar, Maximize, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  property: any;
}

const PropertyDetails: React.FC<Props> = ({ property }) => {
  return (
    <div className="lg:col-span-2 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{property.title}</h1>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin size={18} className="text-primary" />
          <span>{property.location}{property.county ? `, ${property.county}` : ''}</span>
        </div>
        <p className="text-4xl font-bold text-primary">KES {Number(property.price).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border">
          <Home size={24} className="text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Type</p>
          <p className="font-semibold capitalize">{property.property_type}</p>
        </div>
        {property.size && (
          <div className="bg-card p-4 rounded-xl border border-border">
            <Maximize size={24} className="text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Size</p>
            <p className="font-semibold">{property.size}</p>
          </div>
        )}
        <div className="bg-card p-4 rounded-xl border border-border">
          <Calendar size={24} className="text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Listed</p>
          <p className="font-semibold">{new Date(property.created_at).toLocaleDateString()}</p>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <MapPin size={24} className="text-primary mb-2" />
          <p className="text-sm text-muted-foreground">County</p>
          <p className="font-semibold">{property.county || '—'}</p>
        </div>
      </div>

      {property.description && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Description</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{property.description}</p>
        </div>
      )}

      {property.amenities && property.amenities.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Features & Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {property.amenities.map((amenity: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">{amenity}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
