import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Home, FileText, MessageSquare, CheckCircle, Clock, ArrowRight } from "lucide-react";

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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Quick overview — manage properties, submissions and leads
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link to="/admin/properties" className="inline-flex items-center gap-2">
              <Home size={18} />
              Properties
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/submissions" className="inline-flex items-center gap-2">
              <FileText size={18} />
              Submissions
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Properties */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Properties</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{counts.properties}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                <span className="inline-block bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                  {counts.verified} verified
                </span>
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <Home size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Pending Submissions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Submissions</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{counts.submissions}</p>
              <Button asChild size="sm" variant="ghost" className="mt-3 h-auto p-0 text-xs text-blue-600 dark:text-blue-400">
                <Link to="/admin/submissions" className="inline-flex items-center gap-1">
                  Review submissions <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
              <Clock size={24} className="text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Buyer Inquiries */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Buyer Inquiries</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{counts.inquiries}</p>
              <Button asChild size="sm" variant="ghost" className="mt-3 h-auto p-0 text-xs text-blue-600 dark:text-blue-400">
                <Link to="/admin/inquiries" className="inline-flex items-center gap-1">
                  View leads <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
              <MessageSquare size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">Active</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">All systems operational</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Submissions</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/submissions">View All</Link>
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
              ))}
            </div>
          ) : recentSubmissions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No recent submissions</p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="flex gap-3">
                    {s._firstImage ? (
                      <img
                        src={s._firstImage}
                        alt={s.title}
                        className="w-16 h-12 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-slate-300 dark:bg-slate-600 rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 dark:text-white text-sm truncate">
                        {s.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {s.seller_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        KES {Number(s.price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 h-7 text-xs"
                      onClick={() => openConfirm("reject", s)}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700"
                      onClick={() => openConfirm("approve", s)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Inquiries */}
        <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Inquiries</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/inquiries">View All</Link>
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
              ))}
            </div>
          ) : recentInquiries.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No recent inquiries</p>
          ) : (
            <div className="space-y-3">
              {recentInquiries.map((q) => (
                <div
                  key={q.id}
                  className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 dark:text-white text-sm">
                        {q.buyer_name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        📱 {q.buyer_phone}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                        {(q.message || "").slice(0, 60)}
                        {(q.message || "").length > 60 ? "..." : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`flex-shrink-0 text-xs ${
                        q.lead_status === "hot"
                          ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700"
                          : q.lead_status === "warm"
                          ? "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700"
                          : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700"
                      }`}
                    >
                      {q.lead_status || "Warm"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Properties */}
        <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Properties</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/properties">View All</Link>
            </Button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
              ))}
            </div>
          ) : recentProperties.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No recent properties</p>
          ) : (
            <div className="space-y-3">
              {recentProperties.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="flex gap-3">
                    {p._firstImage ? (
                      <img
                        src={p._firstImage}
                        alt={p.title}
                        className="w-16 h-12 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-slate-300 dark:bg-slate-600 rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 dark:text-white text-sm truncate">
                        {p.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {p.location}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          KES {Number(p.price || 0).toLocaleString()}
                        </p>
                        {p.is_verified && (
                          <Badge variant="secondary" className="text-xs h-5">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                    </div>
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
            <DialogTitle className="text-lg">
              {confirmAction === "approve" ? "✓ Approve Submission" : "✗ Reject Submission"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {confirmAction === "approve" ? (
              <p className="text-slate-700 dark:text-slate-300">
                Are you sure you want to approve and publish <strong>{confirmItem?.title}</strong>? It will be
                visible to buyers immediately.
              </p>
            ) : (
              <p className="text-slate-700 dark:text-slate-300">
                Are you sure you want to reject <strong>{confirmItem?.title}</strong>? The seller will be
                notified.
              </p>
            )}
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                className={
                  confirmAction === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {confirmAction === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
