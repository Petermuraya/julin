import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateWhatsAppLink } from "@/lib/whatsapp";

const PROPERTY_TYPES = ["plot", "house", "land", "apartment", "commercial"] as const;

const PropertiesPage = () => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | undefined>(undefined);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch all properties without filters first
      let builder = supabase.from("properties").select("*");

      const { data, error } = await builder.order("created_at", { ascending: false });
      
      console.log("Query error:", error);
      console.log("Query result:", data);

      if (error) throw error;

      let rows = data || [];
      
      // Apply filters client-side
      rows = rows.filter((p: any) => {
        if (type && p.property_type !== type) return false;
        if (minPrice && Number(p.price) < Number(minPrice)) return false;
        if (maxPrice && Number(p.price) > Number(maxPrice)) return false;
        if (query && !p.location?.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      });
      
      // resolve first image public url if stored
      const resolved = await Promise.all(rows.map(async (p: any) => {
        const images = p.images || [];
        let first = images[0];
        if (first && !first.startsWith("http")) {
          const { data: url } = supabase.storage.from("properties").getPublicUrl(first || "");
          first = url.publicUrl;
        }
        return { ...p, _firstImage: first };
      }));

      setProperties(resolved);
    } catch (err: any) {
      console.error("Error fetching properties:", err);
      setErrorMsg(err?.message ? String(err.message) : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e?: any) => {
    if (e) e.preventDefault();
    await fetch();
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
                <h1 className="text-3xl font-bold">Properties</h1>
                <p className="text-muted-foreground">Search, filter and discover approved properties.</p>
              </div>

              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Input placeholder="Search location (e.g. Nairobi)" value={query} onChange={(e) => setQuery(e.target.value)} />
                <Select value={type ?? ""} onValueChange={(v) => setType(v === "all" ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Min price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <div className="flex gap-2">
                  <Input placeholder="Max price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                  <Button type="submit">Search</Button>
                </div>
              </form>

              {errorMsg ? (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded p-4 mb-6">
                  <p className="font-semibold">Unable to load properties</p>
                  <pre className="whitespace-pre-wrap text-sm mt-2">{errorMsg}</pre>
                  <div className="mt-3">
                    <Button onClick={() => fetch()}>Retry</Button>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-lg text-muted-foreground">Loading properties…</p>
                </div>
              ) : properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-xl font-semibold text-muted-foreground mb-2">No properties found</p>
                  <p className="text-muted-foreground mb-6">Try adjusting your filters or search criteria.</p>
                  <Button onClick={() => { setQuery(""); setType(undefined); setMinPrice(""); setMaxPrice(""); fetch(); }}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
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
                      image={p._firstImage}
                      imageCount={(p.images || []).length}
                      status={p.status === "available" ? "For Sale" : p.status}
                    />
                  ))}
                </div>
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
