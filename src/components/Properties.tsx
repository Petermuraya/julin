import { useEffect, useState } from "react";
import PropertyCard from "./PropertyCard";
import { supabase } from "@/integrations/supabase/client";

type Property = {
  id: string;
  title: string;
  location: string;
  county?: string | null;
  price: number;
  size?: string | null;
  description?: string | null;
  images?: string[] | null;
  video_url?: string | null;
  seller_phone?: string | null;
  status?: string;
};

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("status", "available")
          .not("approved_at", "is", null)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!mounted) return;

        const rows = (data || []) as Property[];

        // Resolve first image public URLs where needed
        const resolved = await Promise.all(
          rows.map(async (p) => {
            const images = p.images || [];
            let firstImage = undefined;
            if (images.length > 0) {
              const img = images[0];
              if (img?.startsWith("http")) {
                firstImage = img;
              } else {
                // assume stored in 'properties' bucket
                const { data: publicData } = supabase.storage
                  .from("properties")
                  .getPublicUrl(img || "");
                firstImage = publicData?.publicUrl || undefined;
              }
            }
            return { ...p, _firstImage: firstImage } as any;
          }),
        );

        setProperties(resolved as unknown as Property[]);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load properties");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();

    return () => {
      mounted = false;
    };
  }, []);

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
            Explore approved properties. Click "Contact for More Info" to record an inquiry and continue the conversation on WhatsApp.
          </p>
        </div>

        {loading ? (
          <p className="text-center">Loading properties…</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : properties.length === 0 ? (
          <p className="text-center">No properties available right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property, index) => (
              <div key={property.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <PropertyCard
                  id={property.id}
                  title={property.title}
                  location={property.location}
                  price={`KES ${Number(property.price).toLocaleString()}`}
                  size={property.size || "-"}
                  details={property.description || ""}
                  phone={property.seller_phone || "+254700000000"}
                  hasVideo={!!property.video_url}
                  image={(property as any)._firstImage}
                  imageCount={(property.images || []).length}
                  status={property.status === "available" ? "For Sale" : (property.status || "Available")}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Properties;
