import PropertyCard from "./PropertyCard";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";

const properties = [
  {
    image: property1,
    title: "Modern Luxury Apartments",
    location: "Westlands, Nairobi",
    price: "KES 15.5M",
    size: "1,200 sq ft",
    details: "Stunning 3-bedroom apartment with modern finishes, balcony views, and premium amenities. Perfect for families or professionals.",
    phone: "+254700000000",
    hasVideo: true,
    imageCount: 12,
    status: "For Sale" as const,
  },
  {
    image: property2,
    title: "Charming Family Home",
    location: "Karen, Nairobi",
    price: "KES 28M",
    size: "3,500 sq ft",
    details: "Beautiful 4-bedroom family home on a quarter acre. Features spacious garden, modern kitchen, and quiet neighborhood.",
    phone: "+254700000000",
    hasVideo: false,
    imageCount: 8,
    status: "For Sale" as const,
  },
  {
    image: property3,
    title: "Executive Penthouse Suite",
    location: "Kilimani, Nairobi",
    price: "KES 45M",
    size: "2,800 sq ft",
    details: "Luxury penthouse with panoramic city views, private terrace, high-end finishes, and exclusive building amenities.",
    phone: "+254700000000",
    hasVideo: true,
    imageCount: 15,
    status: "For Sale" as const,
  },
];

const Properties = () => {
  return (
    <section id="properties" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-widest mb-4">
            Featured Listings
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Discover Our Properties
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our handpicked selection of premium properties. Each listing includes detailed information, photos, videos, and direct contact options.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property, index) => (
            <div
              key={index}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PropertyCard {...property} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Properties;
