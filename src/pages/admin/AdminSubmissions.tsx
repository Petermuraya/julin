import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Submission = {
  id: string;
  title: string;
  seller_name: string;
  seller_phone: string;
  price: number;
  status: string | null;
  images?: string[] | null;
};

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

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
        property_type: "land",
        price: Number(form.price || 0),
        location: form.location || "",
        images: selected.images || null,
        seller_name: form.seller_name,
        seller_phone: form.seller_phone,
        is_admin_property: false,
        approved_at: new Date().toISOString(),
      } as any;

      const { data, error } = await supabase.from("properties").insert([payload]).select().single();
      if (error) throw error;

      await supabase.from("property_submissions").update({ status: "approved", created_property_id: data.id, reviewed_at: new Date().toISOString() }).eq("id", selected.id);

      setSubmissions((s) => s.filter((x) => x.id !== selected.id));
      closeReview();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to approve submission.", variant: "destructive" });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Property Submissions</h1>
      {loading ? (
        <p>Loading…</p>
      ) : submissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <div key={s.id} className="p-4 bg-card rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{s.title}</div>
                <div className="text-sm text-muted-foreground">{s.seller_name} • {s.seller_phone}</div>
                <div className="text-sm text-muted-foreground">KES {Number(s.price).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => handleReject(s)}>Reject</Button>
                <Button onClick={() => openReview(s)}>Review & Approve</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review modal */}
      <Dialog open={!!selected} onOpenChange={(v) => { if (!v) closeReview(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-2">
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              <Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              <Input placeholder="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <Input placeholder="Seller name" value={form.seller_name} onChange={(e) => setForm((f) => ({ ...f, seller_name: e.target.value }))} />
              <Input placeholder="Seller phone" value={form.seller_phone} onChange={(e) => setForm((f) => ({ ...f, seller_phone: e.target.value }))} />
            </div>
          )}
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeReview}>Cancel</Button>
              <Button onClick={handleApproveFromModal}>Approve & Publish</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubmissions;
