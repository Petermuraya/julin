import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, X, SlidersHorizontal, MapPin, Home, Building, Building2, Factory } from "lucide-react";

const PROPERTY_TYPES = [
  { value: "plot", label: "Plot", icon: MapPin },
  { value: "house", label: "House", icon: Home },
  { value: "land", label: "Land", icon: MapPin },
  { value: "apartment", label: "Apartment", icon: Building },
  { value: "commercial", label: "Commercial", icon: Factory },
] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
] as const;

// Supabase project URL for Edge Function calls (handles CORS for GitHub Pages)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const ENABLE_REALTIME = import.meta.env.VITE_ENABLE_REALTIME === "true";

const PropertiesPage = () => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [properties, setProperties] = useState<any[]>([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]); // 0 to 100M KES

  const fetchProperties = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Call Supabase Edge Function (handles CORS for all origins)
      const url = `${SUPABASE_URL}/functions/v1/get-properties`;
      // Call without custom headers to avoid CORS preflight redirects
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.statusText}`);
      }
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html')) {
        const text = await response.text();
        throw new Error(`Expected JSON but received HTML from ${url} (${response.status}). Response snippet: ${text.slice(0,300)}`);
      }

      const json = await response.json();
      // Support both { properties: [...] } and raw array responses
      const properties = Array.isArray(json) ? json : json?.properties ?? [];
      setAllProperties(properties || []);
      applyFilters(properties || []);
    } catch (err: any) {
      console.error("Error fetching properties:", err);
      setErrorMsg(err?.message ? String(err.message) : String(err));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data: any[]) => {
    let rows = data;

    // Apply filters
    rows = rows.filter((p: any) => {
      if (type && p.property_type !== type) return false;
      if (minPrice && Number(p.price) < Number(minPrice)) return false;
      if (maxPrice && Number(p.price) > Number(maxPrice)) return false;
      if (query) {
        const searchLower = query.toLowerCase();
        const matchesLocation = p.location?.toLowerCase().includes(searchLower);
        const matchesTitle = p.title?.toLowerCase().includes(searchLower);
        const matchesCounty = p.county?.toLowerCase().includes(searchLower);
        if (!matchesLocation && !matchesTitle && !matchesCounty) return false;
      }
      return true;
    });

    // Apply sorting
    rows.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "price-high":
          return Number(b.price) - Number(a.price);
        default:
          return 0;
      }
    });

    setProperties(rows);
  };

  useEffect(() => {
    fetchProperties();

    // Set up real-time subscription only when explicitly enabled. Realtime
    // connections from a static host (e.g. GitHub Pages) often fail with 403
    // due to Supabase origin restrictions; enable this only when your frontend
    // and Supabase are configured to allow it (set `VITE_ENABLE_REALTIME=true`).
    if (!ENABLE_REALTIME) {
      return;
    }

    let channel: any;
    try {
      channel = supabase
        .channel("properties-page-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "properties",
          },
          (payload: any) => {
            console.log("Real-time update:", payload);
            fetchProperties();
          }
        )
        .subscribe();
    } catch (err) {
      // Don't crash the page if realtime handshake fails (403, etc.)
      // The console will still show the underlying error for debugging.
      // eslint-disable-next-line no-console
      console.warn('Realtime subscription failed:', err);
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (e) {
        // ignore cleanup errors
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-apply filters when filter values change
  useEffect(() => {
    applyFilters(allProperties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, type, minPrice, maxPrice, sortBy]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    applyFilters(allProperties);
  };

  const clearFilters = () => {
    setQuery("");
    setType(undefined);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setPriceRange([0, 100000000]);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (query) count++;
    if (type) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (sortBy !== "newest") count++;
    return count;
  };

  return (
    <>
      <Helmet>
        <title>Properties — Julin Real Estate</title>
        <meta name="description" content="Browse verified properties for sale and rent in Kenya." />
      </Helmet>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Properties</h1>
              <p className="text-lg text-muted-foreground">Discover your perfect property from our curated collection</p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by location, property type, or keywords..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg rounded-full border-2 border-slate-200 focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Property Type Filter */}
                <Select value={type ?? ""} onValueChange={(v) => setType(v === "all" ? undefined : v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {PROPERTY_TYPES.map((t) => {
                      const Icon = t.icon;
                      return (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {t.label}
                          </div>
                        </SelectItem>
                      );
                    })}
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
                    <div className="mt-6 space-y-6">
                      {/* Advanced Filters for Mobile */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-3 block">Property Type</label>
                        <Select value={type ?? ""} onValueChange={(v) => setType(v === "all" ? undefined : v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {PROPERTY_TYPES.map((t) => {
                              const Icon = t.icon;
                              return (
                                <SelectItem key={t.value} value={t.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {t.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

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

                      <div>
                        <label className="text-sm font-medium text-foreground mb-3 block">Price Range</label>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
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

                      <Button onClick={clearFilters} variant="outline" className="w-full">
                        Clear All Filters
                      </Button>
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

            {/* Active Filters Display */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {query && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {query}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setQuery("")} />
                  </Badge>
                )}
                {type && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Type: {PROPERTY_TYPES.find(t => t.value === type)?.label}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setType(undefined)} />
                  </Badge>
                )}
                {(minPrice || maxPrice) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Price: {minPrice || "0"} - {maxPrice || "∞"}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => { setMinPrice(""); setMaxPrice(""); }} />
                  </Badge>
                )}
                {sortBy !== "newest" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Sort: {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSortBy("newest")} />
                  </Badge>
                )}
              </div>
            )}

            {/* Results */}
            {errorMsg ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
                <p className="font-semibold mb-2">Unable to load properties</p>
                <p className="text-sm mb-4">{errorMsg}</p>
                <Button onClick={fetchProperties} variant="outline">Try Again</Button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="aspect-[4/3] bg-slate-200 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-200 rounded animate-pulse" />
                      <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                      <div className="h-6 bg-slate-200 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
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
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{properties.length}</span> properties
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {properties.map((p) => (
                    <div key={p.id} className="group">
                      <PropertyCard
                        id={p.id}
                        title={p.title}
                        location={p.location}
                        price={`KES ${Number(p.price).toLocaleString()}`}
                        size={p.size || "-"}
                        details={p.description || ""}
                        phone={p.seller_phone || "+254725671504"}
                        hasVideo={!!p.video_url}
                        image={p.images?.[0]}
                        imageCount={(p.images || []).length}
                        status={p.status === "available" ? "For Sale" : p.status}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PropertiesPage;