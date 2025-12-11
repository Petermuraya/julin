import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

type ConfirmAction = "approve" | "reject" | null;

const AdminDashboard = () => {
  const [counts, setCounts] = useState({ properties: 0, submissions: 0, inquiries: 0, verified: 0 });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmItem, setConfirmItem] = useState<any | null>(null);

  const openConfirm = (action: "approve" | "reject", item: any) => {
    setConfirmAction(action);
    setConfirmItem(item);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    if (!confirmAction || !confirmItem) return setConfirmOpen(false);
    const prev = recentSubmissions;
    setRecentSubmissions((s) => s.filter((x) => x.id !== confirmItem.id));
    setCounts((c) => ({ ...c, submissions: Math.max(0, c.submissions - 1) }));

    setConfirmOpen(false);
    try {
      if (confirmAction === "approve") {
        await handleApprove(confirmItem);
      } else {
        await handleReject(confirmItem);
      }
    } catch (err) {
      setRecentSubmissions(prev);
      toast({ title: "Error", description: "Action failed. Changes rolled back.", variant: "destructive" });
    } finally {
      setConfirmAction(null);
      setConfirmItem(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, sRes, iRes, vRes, subsRes, inqRes, propRes] = await Promise.all([
          supabase.from("properties").select("id", { count: "exact" }),
          supabase.from("property_submissions").select("id", { count: "exact" }),
          supabase.from("buyer_inquiries").select("id", { count: "exact" }),
          supabase.from("properties").select("id", { count: "exact" }).eq("is_verified", true),
          supabase.from("property_submissions").select("id,title,seller_name,seller_phone,price,status,images").order("created_at", { ascending: false }).limit(5),
          supabase.from("buyer_inquiries").select("id,buyer_name,buyer_phone,property_id,message,lead_status,created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("properties").select("id,title,location,price,status,is_verified,images").order("created_at", { ascending: false }).limit(5),
        ]);

        const p = pRes.count ?? 0;
        const s = sRes.count ?? 0;
        const i = iRes.count ?? 0;
        const v = vRes.count ?? 0;

        setCounts({ properties: p, submissions: s, inquiries: i, verified: v });
        setRecentSubmissions((subsRes.data as any[]) || []);
        // Resolve first image url for submissions
        const subs = ((subsRes.data as any[]) || []).map((s) => {
          const images = s.images || [];
          let first = images[0];
          if (first && !first.startsWith("http")) {
            const { data: url } = supabase.storage.from("properties").getPublicUrl(first || "");
            first = url.publicUrl;
          }
          return { ...s, _firstImage: first };
        });
        setRecentSubmissions(subs);
        setRecentInquiries((inqRes.data as any[]) || []);
        // Resolve first image public urls for recent properties
        const props = ((propRes.data as any[]) || []).map((p) => {
          const images = p.images || [];
          let first = images[0];
          if (first && !first.startsWith("http")) {
            const { data: url } = supabase.storage.from("properties").getPublicUrl(first || "");
            first = url.publicUrl;
          }
          return { ...p, _firstImage: first };
        });

        setRecentProperties(props);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApprove = async (submission: any) => {
    try {
      // create a new property from submission
      const payload: any = {
        title: submission.title,
        description: submission.description || null,
        property_type: submission.property_type || "land",
        price: submission.price || 0,
        location: submission.location || "",
        images: submission.images || null,
        seller_name: submission.seller_name || submission.seller_name,
        seller_phone: submission.seller_phone || submission.seller_phone,
        is_admin_property: false,
        approved_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from("properties").insert([payload]).select().single();
      if (error) throw error;

      await supabase.from("property_submissions").update({ status: "approved", created_property_id: data.id, reviewed_at: new Date().toISOString() }).eq("id", submission.id);

      // update local state
      setRecentSubmissions((s) => s.filter((x) => x.id !== submission.id));
      setCounts((c) => ({ ...c, properties: c.properties + 1, submissions: Math.max(0, c.submissions - 1) }));
      toast({ title: "Approved", description: "Submission approved and published.", variant: "default" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to approve submission.", variant: "destructive" });
    }
  };

  const handleReject = async (submission: any) => {
    try {
      await supabase.from("property_submissions").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", submission.id);
      setRecentSubmissions((s) => s.filter((x) => x.id !== submission.id));
      setCounts((c) => ({ ...c, submissions: Math.max(0, c.submissions - 1) }));
      toast({ title: "Rejected", description: "Submission rejected.", variant: "default" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to reject submission.", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Quick overview — manage properties, submissions and leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="hero" asChild>
            <Link to="/admin/properties">Manage Properties</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/submissions">Review Submissions</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-card rounded flex flex-col">
          <div className="text-sm text-muted-foreground">Total Properties</div>
          <div className="text-3xl font-bold">{counts.properties}</div>
          <div className="mt-2">
            <Badge variant="outline">Verified: {counts.verified}</Badge>
          </div>
        </div>
        <div className="p-4 bg-card rounded flex flex-col">
          <div className="text-sm text-muted-foreground">Pending Submissions</div>
          <div className="text-3xl font-bold">{counts.submissions}</div>
          <div className="mt-2 text-sm text-muted-foreground">Review and publish quality listings</div>
        </div>
        <div className="p-4 bg-card rounded flex flex-col">
          <div className="text-sm text-muted-foreground">Buyer Inquiries</div>
          <div className="text-3xl font-bold">{counts.inquiries}</div>
          <div className="mt-2 text-sm text-muted-foreground">Follow up leads and track status</div>
        </div>
        <div className="p-4 bg-card rounded flex flex-col">
          <div className="text-sm text-muted-foreground">Quick Actions</div>
            <div className="mt-3 flex gap-2">
            <Button asChild size="sm"><Link to="/admin/submissions">Review Submissions</Link></Button>
            <Button variant="secondary" asChild size="sm"><Link to="/admin/inquiries">View Leads</Link></Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="col-span-1 lg:col-span-1">
          <h2 className="text-lg font-medium mb-3">Recent Submissions</h2>
          {loading ? (
            <p>Loading…</p>
          ) : recentSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent submissions.</p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((s) => (
                <div key={s.id} className="p-3 bg-card rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {s._firstImage ? (
                      <img src={s._firstImage} alt={s.title} className="w-20 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-20 h-14 bg-muted rounded" />
                    )}
                    <div>
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-sm text-muted-foreground">{s.seller_name} • KES {Number(s.price || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{s.status || 'pending'}</span>
                    <Button variant="destructive" size="sm" onClick={() => openConfirm('reject', s)}>
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => openConfirm('approve', s)}>Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="col-span-1 lg:col-span-1">
          <h2 className="text-lg font-medium mb-3">Recent Inquiries</h2>
          {loading ? (
            <p>Loading…</p>
          ) : recentInquiries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent inquiries.</p>
          ) : (
            <div className="space-y-3">
              {recentInquiries.map((q) => (
                <div key={q.id} className="p-3 bg-card rounded">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{q.buyer_name} • {q.buyer_phone}</div>
                      <div className="text-sm text-muted-foreground">{(q.message || '').slice(0, 80)}{(q.message || '').length > 80 ? '…' : ''}</div>
                      <div className="text-sm text-muted-foreground">Property: {q.property_id}</div>
                    </div>
                    <div className="ml-2">
                      <Badge variant="outline">{q.lead_status || 'warm'}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="col-span-1 lg:col-span-1">
          <h2 className="text-lg font-medium mb-3">Recent Properties</h2>
          {loading ? (
            <p>Loading…</p>
          ) : recentProperties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent properties.</p>
          ) : (
            <div className="space-y-3">
              {recentProperties.map((p) => (
                <div key={p.id} className="p-3 bg-card rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {p._firstImage ? (
                      <img src={p._firstImage} alt={p.title} className="w-20 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-20 h-14 bg-muted rounded" />
                    )}
                    <div>
                      <div className="font-semibold">{p.title}</div>
                      <div className="text-sm text-muted-foreground">{p.location} • KES {Number(p.price || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.is_verified && <Badge variant="default">Verified</Badge>}
                    <Button variant="ghost" size="sm" asChild><Link to="/admin/properties">Open</Link></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmAction === "approve" ? "Approve Submission" : "Reject Submission"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {confirmAction === "approve" ? (
              <p>Are you sure you want to approve and publish this submission?</p>
            ) : (
              <p>Are you sure you want to reject this submission? This action can be reversed later.</p>
            )}
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={onConfirm}>{confirmAction === "approve" ? "Approve" : "Reject"}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
