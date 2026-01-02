import { useEffect, useState } from "react";
import useInView from "@/hooks/use-in-view";
import { fetchWithTimeout } from '@/lib/utils';
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TypingText from "@/components/ui/TypingText";
import { PropertySearchBar } from "@/components/property/PropertySearchBar";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import type { Property } from '@/types/property';

// Supabase project URL for Edge Function calls (handles CORS for GitHub Pages)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const ENABLE_REALTIME = process.env.NEXT_PUBLIC_ENABLE_REALTIME === "true";

const PropertiesPage = () => {
  const header = useInView<HTMLDivElement>();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [properties, setProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
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
      const response = await fetchWithTimeout(url, {
        headers:
         {
          'Content-Type': 'application/json',
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        }
      }, 10000);
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
      const fetched = Array.isArray(json) ? (json as Property[]) : (json?.properties ?? []) as Property[];
      setAllProperties(fetched || []);
      applyFilters(fetched || []);
    } catch (err: unknown) {
      console.error("Error fetching properties:", err);
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data: Property[]) => {
    let rows = data;

    // Apply filters
    rows = rows.filter((p) => {
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

    let channel: ReturnType<typeof supabase['channel']> | undefined;

    // Runtime guard: ensure the Supabase client supports realtime before calling.
    // This prevents runtime "is not a function" errors when the client doesn't
    // expose `channel` (e.g. in disabled / stubbed clients or limited builds).
    if (!supabase || typeof (supabase as any).channel !== 'function') {
      console.warn('Supabase realtime not available — skipping realtime setup');
      return;
    }

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
          (payload: unknown) => {
            console.log("Real-time update:", payload);
            fetchProperties();
          }
        )
        .subscribe();
    } catch (err) {
      // Don't crash the page if realtime handshake fails (403, etc.)
      // The console will still show the underlying error for debugging.
      console.warn('Realtime subscription failed:', err);
    }

    type ChannelType = ReturnType<typeof supabase['channel']>;

    return () => {
      try {
        if (channel) supabase.removeChannel(channel as ChannelType);
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
            <div
              ref={header.ref as React.RefObject<HTMLDivElement>}
              className={`mb-8 transition-all duration-700 ${header.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} text-center`}
            >
              <h1 className="text-4xl font-bold text-primary mb-2">Properties</h1>
              <div className="mx-auto max-w-2xl">
                <TypingText
                  text="Discover your perfect property from our curated collection"
                  speed={28}
                  className="text-lg text-primary/80"
                />
              </div>
            </div>

            <PropertySearchBar
              query={query}
              setQuery={setQuery}
              type={type}
              setType={setType}
              sortBy={sortBy}
              setSortBy={setSortBy}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              filtersOpen={filtersOpen}
              setFiltersOpen={setFiltersOpen}
              clearFilters={clearFilters}
              getActiveFiltersCount={getActiveFiltersCount}
            />

            <PropertyGrid
              properties={properties}
              loading={loading}
              errorMsg={errorMsg}
              fetchProperties={fetchProperties}
              clearFilters={clearFilters}
            />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default function PropertiesPage() {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn('Deprecated: use app/(public)/properties/page.tsx instead of src/pages/PropertiesPage.tsx');
  }
  return null;
}