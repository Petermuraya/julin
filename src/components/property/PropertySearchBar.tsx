import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { PropertyFilters, PROPERTY_TYPES, SORT_OPTIONS } from "../PropertyFilters";

interface PropertySearchBarProps {
  query: string;
  setQuery: (value: string) => void;
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
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
}

export const PropertySearchBar = ({
  query,
  setQuery,
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
  filtersOpen,
  setFiltersOpen,
}: PropertySearchBarProps) => {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search properties by title, location, or features..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12 pr-4 py-3 text-lg"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <PropertyFilters
            type={type}
            setType={setType}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            sortBy={sortBy}
            setSortBy={setSortBy}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            clearFilters={clearFilters}
            getActiveFiltersCount={getActiveFiltersCount}
            isMobile={false}
          />
        </div>

        {/* Mobile Filter Button */}
        <div className="flex items-center gap-3">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <PropertyFilters
                  type={type}
                  setType={setType}
                  minPrice={minPrice}
                  setMinPrice={setMinPrice}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  clearFilters={clearFilters}
                  getActiveFiltersCount={getActiveFiltersCount}
                  isMobile={true}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Clear Filters Button */}
          {getActiveFiltersCount() > 0 && (
            <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4 mr-2" />
              Clear ({getActiveFiltersCount()})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertySearchBar;
