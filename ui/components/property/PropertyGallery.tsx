import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import type { Property } from '@/types/property';

interface Props {
  property: Property;
}

const PropertyGallery: React.FC<Props> = ({ property }) => {
  const images = property?.images?.length ? property.images : ['/placeholder.svg'];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <section className="container mx-auto px-4 pb-8">
      <div className="relative rounded-2xl overflow-hidden bg-muted">
        <div
          className="relative h-[400px] md:h-[500px] cursor-pointer"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={images[currentImageIndex]}
            alt={`${property?.title || 'Property'} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className="absolute bottom-4 right-4 bg-background/80 px-3 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>

          <div className="absolute top-4 left-4 flex gap-2">
            {property?.is_verified && (
              <Badge className="bg-green-600 text-white">
                <CheckCircle size={14} className="mr-1" /> Verified
              </Badge>
            )}
            <Badge className={property?.status === 'available' ? 'bg-primary' : 'bg-muted'}>
              {property?.status === 'available' ? 'For Sale' : property?.status}
            </Badge>
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto">
            {images.map((img: string, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === currentImageIndex ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertyGallery;
