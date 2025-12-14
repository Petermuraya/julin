import PropertyCard from "./PropertyCard";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyGridProps {
  properties: any[];
  loading: boolean;
  errorMsg: string | null;
  fetchProperties: () => void;
  clearFilters: () => void;
}

export const PropertyGrid = ({ properties, loading, errorMsg, fetchProperties, clearFilters }: PropertyGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
            <div className="h-48 bg-muted rounded-lg mb-4"></div>
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
        <p className="font-semibold mb-2">Unable to load properties</p>
        <p className="text-sm mb-4">{errorMsg}</p>
        <Button onClick={fetchProperties} variant="outline">Try Again</Button>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No properties found</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          We couldn't find any properties matching your criteria. Try adjusting your filters or search terms.
        </p>
        <Button onClick={clearFilters}>Clear All Filters</Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{properties.length}</span> properties
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            id={property.id}
            title={property.title}
            location={property.location}
            price={`KES ${Number(property.price).toLocaleString()}`}
            size={property.size || "-"}
            details={property.description || ""}
            phone={property.seller_phone || "+254725671504"}
            hasVideo={!!property.video_url}
            image={property.images?.[0]}
            imageCount={(property.images || []).length}
            status={property.status === "available" ? "For Sale" : property.status}
          />
        ))}
      </div>
    </>
  );
};