import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, Search } from "lucide-react";

type Submission = {
  id: string;
  title: string;
  seller_name: string;
  seller_phone: string;
  price: number;
  status: string | null;
  images?: string[] | null;
  property_type?: string;
};

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubmissions = submissions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.seller_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("property_submissions").select("*").order("created_at", { ascending: false });
      if (error) console.error(error);
      setSubmissions((data || []) as Submission[]);
      setLoading(false);
    };
    load();
  }, []);

  const handleApprove = async (submission: Submission) => {
    try {
      // Insert into properties
      const { data, error } = await supabase.from("properties").insert([
        {
          title: submission.title,
          description: null,
          property_type: "land",
          price: submission.price,
          location: "",
          images: submission.images,
          seller_name: submission.seller_name,
          seller_phone: submission.seller_phone,
          is_admin_property: false,
          approved_at: new Date().toISOString(),
        },
      ]).select().single();

      if (error) throw error;

      // Update submission with reference to created property and status
      await supabase.from("property_submissions").update({ status: "approved", created_property_id: data.id, reviewed_at: new Date().toISOString() }).eq("id", submission.id);

      setSubmissions((s) => s.filter((x) => x.id !== submission.id));
        toast({ title: "Approved", description: "Submission approved and published." });
    } catch (err) {
      console.error(err);
        toast({ title: "Error", description: "Failed to approve submission.", variant: "destructive" });
    }
  };

  const handleReject = async (submission: Submission) => {
    try {
      await supabase.from("property_submissions").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", submission.id);
      setSubmissions((s) => s.filter((x) => x.id !== submission.id));
        toast({ title: "Rejected", description: "Submission rejected." });
    } catch (err) {
      console.error(err);
        toast({ title: "Error", description: "Failed to reject submission.", variant: "destructive" });
    }
  };

  // Modal state
  const [selected, setSelected] = useState<Submission | null>(null);
  const [form, setForm] = useState({ title: "", price: "", location: "", description: "", seller_name: "", seller_phone: "" });

  const openReview = (s: Submission) => {
    setSelected(s);
    setForm({
      title: s.title || "",
      price: String(s.price || ""),
      location: "",
      description: "",
      seller_name: s.seller_name || "",
      seller_phone: s.seller_phone || "",
    });
  };

  const closeReview = () => {
    setSelected(null);
  };

  const handleApproveFromModal = async () => {
    if (!selected) return;
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        property_type: (selected.property_type || "land") as "land" | "plot" | "house" | "apartment" | "commercial",
        price: Number(form.price || 0),
        location: form.location || "",
        images: selected.images || null,
        seller_name: form.seller_name,
        seller_phone: form.seller_phone,
        is_admin_property: false,
        approved_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from("properties").insert([payload]).select().single();
      if (error) throw error;

      await supabase.from("property_submissions").update({ status: "approved", created_property_id: data.id, reviewed_at: new Date().toISOString() }).eq("id", selected.id);

      setSubmissions((s) => s.filter((x) => x.id !== selected.id));
      closeReview();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Error", description: message || "Failed to approve submission.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Property Submissions</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Review and approve seller submissions</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <Input
          placeholder="Search by property title or seller name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-2 h-10"
        />
      </div>

      {/* Submissions Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {searchQuery ? "No submissions found matching your search" : "No pending submissions"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Submission Info */}
                <div className="col-span-2">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{s.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Submitted by <strong>{s.seller_name}</strong>
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      Pending
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p>
                      <strong>Price:</strong> KES {Number(s.price).toLocaleString()}
                    </p>
                    <p>
                      <strong>Seller Phone:</strong> {s.seller_phone}
                    </p>
                    {s.images && s.images.length > 0 && (
                      <p>
                        <strong>Images:</strong> {s.images.length} file(s)
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 md:justify-start">
                  <Button
                    onClick={() => openReview(s)}
                    className="bg-blue-600 hover:bg-blue-700 inline-flex items-center justify-center gap-2"
                  >
                    <Eye size={18} />
                    Review
                  </Button>
                  <Button
                    onClick={() => handleReject(s)}
                    variant="destructive"
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={!!selected} onOpenChange={(v) => { if (!v) closeReview(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Review & Approve Submission</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-4">
              <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Original Submission Details</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="font-medium text-slate-900 dark:text-white">{selected.title}</p>
                  <p className="text-slate-600 dark:text-slate-400">Seller: {selected.seller_name}</p>
                  <p className="text-slate-600 dark:text-slate-400">Phone: {selected.seller_phone}</p>
                  <p className="text-slate-600 dark:text-slate-400">Price: KES {Number(selected.price).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Property Title
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Price (KES)
                  </label>
                  <Input
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    type="number"
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Location
                  </label>
                  <Input
                    placeholder="Location"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className="h-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Description
                </label>
                <Textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Seller Name
                  </label>
                  <Input
                    placeholder="Seller name"
                    value={form.seller_name}
                    onChange={(e) => setForm((f) => ({ ...f, seller_name: e.target.value }))}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Seller Phone
                  </label>
                  <Input
                    placeholder="Seller phone"
                    value={form.seller_phone}
                    onChange={(e) => setForm((f) => ({ ...f, seller_phone: e.target.value }))}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={closeReview}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveFromModal}
              className="bg-green-600 hover:bg-green-700 inline-flex items-center gap-2"
            >
              <Check size={18} />
              Approve & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubmissions;
