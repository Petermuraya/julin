import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropertyCard from "./PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import type { Property } from '@/types/property';

type ExtendedProperty = Property & { _firstImage?: string };

const Properties = () => {
  const [properties, setProperties] = useState<ExtendedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      const rows = (data || []) as Property[];

      // Resolve first image public URLs where needed
      const resolved: ExtendedProperty[] = rows.map((p) => {
        const images = p.images || [];
        const firstImage = images[0] || undefined;
        return { ...p, _firstImage: firstImage };
      });

      setProperties(resolved);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();

    // Set up real-time subscription for properties
    const channel = supabase
      .channel("properties-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "properties",
        },
        (payload) => {
          console.log("Real-time update:", payload);
          // Refetch properties on any change
          fetchProperties();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
            Explore verified properties. Click on a property to view details or contact the seller directly.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : properties.length === 0 ? (
          <p className="text-center text-muted-foreground">No properties available right now.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property, index) => (
                <div key={property.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button asChild size="lg">
                <Link to="/properties" className="inline-flex items-center gap-2">
                  View All Properties
                  <ArrowRight size={18} />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Properties;