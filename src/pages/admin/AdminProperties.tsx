import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
      if (error) console.error(error);
      setProperties(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await supabase.from("properties").update({ status }).eq("id", id);
      setProperties((p) => p.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch (err) {
      console.error(err);
      window.alert("Failed to update status");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Properties</h1>
      {loading ? (
        <p>Loading…</p>
      ) : properties.length === 0 ? (
        <p>No properties found.</p>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => (
            <div key={p.id} className="p-4 bg-card rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{p.title}</div>
                <div className="text-sm text-muted-foreground">{p.location} • KES {Number(p.price).toLocaleString()}</div>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-sm">{p.status}</span>
                <button className="btn btn-outline" onClick={() => updateStatus(p.id, 'sold')}>Mark Sold</button>
                <button className="btn btn-ghost" onClick={() => updateStatus(p.id, 'available')}>Mark Available</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProperties;
