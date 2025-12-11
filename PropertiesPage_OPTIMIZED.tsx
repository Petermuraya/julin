import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 9; // 9 properties per page

// fetchPage will be called by react-query's useInfiniteQuery and receives
// the `queryKey` so we can read current filters (search, type, min/max)
async function fetchPage({ pageParam = 0, queryKey }: any) {
  // queryKey structure: ['properties', query, type, minPrice, maxPrice]
  const [, q = "", t = "", min = "", max = ""] = queryKey || [];

  // Build server-side query with pagination
  let builder: any = supabase
    .from("properties")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

  if (t) {
    builder = builder.eq("property_type", t);
  }

  if (min) {
    const n = Number(min);
    if (!Number.isNaN(n)) builder = builder.gte("price", n);
  }

  if (max) {
    const n = Number(max);
    if (!Number.isNaN(n)) builder = builder.lte("price", n);
  }

  if (q) {
    // Search title OR location for the query (case-insensitive)
    // Supabase expects an OR expression like: 'title.ilike.%q%,location.ilike.%q%'
    const term = `%${q}%`;
    builder = builder.or(`title.ilike.${term},location.ilike.${term}`);
  }

  const { data, error } = await builder;

  if (error) {
    console.error("Error fetching properties:", error);
    return [];
  }

  // Resolve first image public URL per-property
  const resolved = await Promise.all(
    (data || []).map(async (property: any) => {
      const images = property.images || [];
      let first = images[0] || null;
      if (first && !first.startsWith("http")) {
        const { data: publicData } = supabase.storage.from("properties").getPublicUrl(first || "");
        first = publicData?.publicUrl || "";
      }
      return { ...property, image: first || "" };
    }),
  );

  return resolved;
}

const PropertiesPage = () => {
  // Filter state
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Apply filters: refetch from page 0 when filters change
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["properties", query, type, minPrice, maxPrice],
    queryFn: fetchPage,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length : undefined,
    keepPreviousData: true,
  });

  // Flatten all pages into single array
  const allProperties = data?.pages.flat() || [];

  // Apply client-side filtering for search/type/price
  const filteredProperties = allProperties.filter((prop) => {
    const titleMatch = prop.title?.toLowerCase().includes(query.toLowerCase()) ?? true;
    const typeMatch = !type || prop.property_type === type;
    const minMatch = !minPrice || (prop.price >= parseInt(minPrice));
    const maxMatch = !maxPrice || (prop.price <= parseInt(maxPrice));
    return titleMatch && typeMatch && minMatch && maxMatch;
  });

  const handleFilterChange = () => {
    refetch(); // Refetch from page 0
  };

  // Calculate dynamic description for meta tags
  const descriptionText = `Browse ${filteredProperties.length} verified properties in Kenya. Find apartments, land, houses, and more with flexible pricing and instant WhatsApp contact.`;

  return (
    <>
      <Helmet>
        <title>Properties for Sale & Rent in Kenya | Julin Real Estate</title>
        <meta name="description" content={descriptionText} />
        <meta name="keywords" content="properties Kenya, real estate, buy property, rent apartment, land for sale" />
        <meta property="og:title" content="Browse Properties - Julin Real Estate" />
        <meta property="og:description" content={descriptionText} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://julina.co.ke/properties" />
        <link rel="canonical" href="https://julina.co.ke/properties" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Browse Properties
            </h1>
            <p className="text-lg text-slate-600">
              Discover {filteredProperties.length} verified properties across Kenya
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <Input
                type="text"
                placeholder="Search by title..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  handleFilterChange();
                }}
                aria-label="Search properties by title"
              />

              {/* Type Filter */}
              <Select value={type} onValueChange={(val) => {
                setType(val);
                handleFilterChange();
              }}>
                <SelectTrigger aria-label="Filter by property type">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>

              {/* Min Price */}
              <Input
                type="number"
                placeholder="Min Price (KES)"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  handleFilterChange();
                }}
                aria-label="Minimum price filter"
              />

              {/* Max Price */}
              <Input
                type="number"
                placeholder="Max Price (KES)"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  handleFilterChange();
                }}
                aria-label="Maximum price filter"
              />

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setType("");
                  setMinPrice("");
                  setMaxPrice("");
                  refetch();
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Error State */}
          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-800">
                Failed to load properties. Please try again.
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Array(9)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
                    <Skeleton className="h-64 w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Properties Grid */}
          {!isLoading && filteredProperties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  price={`KES ${Number(property.price).toLocaleString()}`}
                  location={property.location}
                  size={property.size || property.property_type || "-"}
                  image={property.image}
                  details={property.description || property.details || ""}
                  phone={property.seller_phone || property.phone || "+254700000000"}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredProperties.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-xl text-slate-600 mb-4">
                No properties found matching your filters
              </p>
              <Button
                onClick={() => {
                  setQuery("");
                  setType("");
                  setMinPrice("");
                  setMaxPrice("");
                  refetch();
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                size="lg"
              >
                {isFetchingNextPage ? "Loading..." : "Load More Properties"}
              </Button>
            </div>
          )}

          {/* No More Results */}
          {allProperties.length > 0 && !hasNextPage && (
            <div className="text-center text-slate-600 mt-8 py-8">
              <p>All properties loaded</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PropertiesPage;
