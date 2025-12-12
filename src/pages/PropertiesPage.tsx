import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const PROPERTY_TYPES = ["plot", "house", "land", "apartment", "commercial"] as const;

// Supabase project URL for Edge Function calls (handles CORS for GitHub Pages)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ENABLE_REALTIME = import.meta.env.VITE_ENABLE_REALTIME === "true";

const PropertiesPage = () => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [properties, setProperties] = useState<any[]>([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Call Supabase Edge Function (handles CORS for all origins)
      const url = `${SUPABASE_URL}/functions/v1/get-properties`;
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
  }, [query, type, minPrice, maxPrice]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    applyFilters(allProperties);
  };

  const clearFilters = () => {
    setQuery("");
    setType(undefined);
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <>
      <Helmet>
        <title>Properties — Julin Real Estate</title>
        <meta name="description" content="Browse verified properties for sale and rent in Kenya." />
      </Helmet>
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-28 pb-20">
          <section>
            <div className="container mx-auto px-4">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Properties</h1>
                <p className="text-muted-foreground">Search, filter and discover available properties.</p>
              </div>

              {/* Search & Filters */}
              <form onSubmit={handleSearch} className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="relative lg:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search by location, title..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={type ?? ""} onValueChange={(v) => setType(v === "all" ? undefined : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Property Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div className="flex gap-2 mt-4">
                  <Button type="submit">Apply Filters</Button>
                  <Button type="button" variant="outline" onClick={clearFilters}>Clear</Button>
                </div>
              </form>

              {/* Results */}
              {errorMsg ? (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6">
                  <p className="font-semibold">Unable to load properties</p>
                  <pre className="whitespace-pre-wrap text-sm mt-2">{errorMsg}</pre>
                  <Button onClick={fetchProperties} className="mt-3">Retry</Button>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-xl font-semibold text-muted-foreground mb-2">No properties found</p>
                  <p className="text-muted-foreground mb-6">Try adjusting your filters or search criteria.</p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">{properties.length} properties found</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {properties.map((p) => (
                      <PropertyCard
                        key={p.id}
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
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default PropertiesPage;