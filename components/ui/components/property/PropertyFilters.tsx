import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { X, MapPin, Home, Building, Building2, Factory } from "lucide-react";

export const PROPERTY_TYPES = [
  { value: "plot", label: "Plot", icon: MapPin },
  { value: "house", label: "House", icon: Home },
  { value: "land", label: "Land", icon: MapPin },
  { value: "apartment", label: "Apartment", icon: Building },
  { value: "commercial", label: "Commercial", icon: Factory },
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
] as const;

interface PropertyFiltersProps {
  type: string | undefined;
  setType: (value: string | undefined) => void;
  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  priceRange: [number, number];
  setPriceRange: (value: [number, number]) => void;
  clearFilters: () => void;
  getActiveFiltersCount: () => number;
  isMobile?: boolean;
}

export const PropertyFilters = ({
  type,
  setType,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  priceRange,
  setPriceRange,
  clearFilters,
  getActiveFiltersCount,
  isMobile = false,
}: PropertyFiltersProps) => {
  if (isMobile) {
    return (
      <div className="space-y-6">
        {/* Property Type */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Property Type</label>
          <Select value={type ?? ""} onValueChange={(v) => setType(v === "all" ? undefined : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PROPERTY_TYPES.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>
                  <div className="flex items-center gap-2">
                    <pt.icon size={16} />
                    {pt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Sort By</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Price Range</label>
          <div className="space-y-4">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={100000000}
              min={0}
              step={100000}
              className="w-full"
            />
            <div className="flex items-center gap-2">
              <Input
                placeholder="Min Price"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <Input
                placeholder="Max Price"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {getActiveFiltersCount() > 0 && (
          <Button onClick={clearFilters} variant="outline" className="w-full">
            Clear All Filters
          </Button>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Property Type Filter */}
      <Select value={type ?? ""} onValueChange={(v) => setType(v === "all" ? undefined : v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {PROPERTY_TYPES.map((pt) => (
            <SelectItem key={pt.value} value={pt.value}>
              <div className="flex items-center gap-2">
                <pt.icon size={16} />
                {pt.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort Filter */}
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Price Range Inputs */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Min Price"
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-28"
        />
        <span className="text-muted-foreground">-</span>
        <Input
          placeholder="Max Price"
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-28"
        />
      </div>

      {/* Clear Filters Button */}
      {getActiveFiltersCount() > 0 && (
        <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4 mr-2" />
          Clear ({getActiveFiltersCount()})
        </Button>
      )}
    </div>
  );
};