import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  const fetch = async () => {
    setLoading(true);
    try {
      let builder = supabase.from("properties").select("*").eq("status", "available").not("approved_at", "is", null);

      if (type) builder = builder.eq("property_type", type);
      if (minPrice) builder = builder.gte("price", Number(minPrice));
      if (maxPrice) builder = builder.lte("price", Number(maxPrice));
      if (query) builder = builder.ilike("location", `%${query}%`);

      const { data, error } = await builder.order("created_at", { ascending: false });
      if (error) throw error;

      const rows = data || [];
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
    } catch (err) {
      console.error(err);
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
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground">Search, filter and discover approved properties.</p>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input placeholder="Search location (e.g. Nairobi)" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select onValueChange={(v) => setType(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
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

        {loading ? (
          <p>Loading…</p>
        ) : properties.length === 0 ? (
          <p>No properties match your filters.</p>
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
                phone={p.seller_phone || "+254700000000"}
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
  );
};

export default PropertiesPage;
