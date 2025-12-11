import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [counts, setCounts] = useState({ properties: 0, submissions: 0, inquiries: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [{ count: p }, { count: s }, { count: i }] = await Promise.all([
          supabase.from("properties").select("id", { count: "exact" }),
          supabase.from("property_submissions").select("id", { count: "exact" }),
          supabase.from("buyer_inquiries").select("id", { count: "exact" }),
        ]);

        setCounts({ properties: p ?? 0, submissions: s ?? 0, inquiries: i ?? 0 });
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-card rounded">
          <div className="text-sm text-muted-foreground">Properties</div>
          <div className="text-3xl font-bold">{counts.properties}</div>
        </div>
        <div className="p-4 bg-card rounded">
          <div className="text-sm text-muted-foreground">Submissions</div>
          <div className="text-3xl font-bold">{counts.submissions}</div>
        </div>
        <div className="p-4 bg-card rounded">
          <div className="text-sm text-muted-foreground">Inquiries</div>
          <div className="text-3xl font-bold">{counts.inquiries}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
