import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("buyer_inquiries").select("*").order("created_at", { ascending: false });
      if (error) console.error(error);
      setInquiries(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const updateLead = async (id: string, status: string) => {
    try {
      await supabase.from("buyer_inquiries").update({ lead_status: status }).eq("id", id);
      setInquiries((q) => q.map((x) => (x.id === id ? { ...x, lead_status: status } : x)));
    } catch (err) {
      console.error(err);
      window.alert("Failed to update lead status");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Buyer Inquiries</h1>
      {loading ? (
        <p>Loading…</p>
      ) : inquiries.length === 0 ? (
        <p>No inquiries yet.</p>
      ) : (
        <div className="space-y-4">
          {inquiries.map((i) => (
            <div key={i.id} className="p-4 bg-card rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{i.buyer_name} • {i.buyer_phone}</div>
                <div className="text-sm text-muted-foreground">Property: {i.property_id}</div>
                <div className="text-sm text-muted-foreground">{i.message}</div>
              </div>
              <div className="flex gap-2 items-center">
                <select className="input" value={i.lead_status || "warm"} onChange={(e) => updateLead(i.id, e.target.value)}>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminInquiries;
