import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: "", location: "", price: "", property_type: "plot", description: "", seller_name: "", seller_phone: "", images: "" });
  const [useUpload, setUseUpload] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null as any);

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
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <div>
          <Button onClick={() => setAddOpen(true)}>Add Property</Button>
        </div>
      </div>
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

      {/* Add Property Dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => setAddOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Property</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <Input placeholder="Price" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            <Select value={form.property_type} onValueChange={(v) => setForm((f) => ({ ...f, property_type: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plot">plot</SelectItem>
                <SelectItem value="house">house</SelectItem>
                <SelectItem value="land">land</SelectItem>
                <SelectItem value="apartment">apartment</SelectItem>
                <SelectItem value="commercial">commercial</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <Input placeholder="Seller name" value={form.seller_name} onChange={(e) => setForm((f) => ({ ...f, seller_name: e.target.value }))} />
            <Input placeholder="Seller phone" value={form.seller_phone} onChange={(e) => setForm((f) => ({ ...f, seller_phone: e.target.value }))} />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" checked={!useUpload} onChange={() => setUseUpload(false)} />
                <span>Image URLs</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={useUpload} onChange={() => setUseUpload(true)} />
                <span>Upload Images</span>
              </label>
            </div>
            {!useUpload ? (
              <Input placeholder="Images (comma separated URLs)" value={form.images} onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))} />
            ) : (
              <input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />
            )}
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                setAdding(true);
                try {
                  // basic validation
                  if (!form.title.trim()) throw new Error('Title is required');
                  if (!form.price || Number(form.price) <= 0) throw new Error('Price must be a positive number');

                  const endpoint = (import.meta.env.VITE_ADMIN_API_URL) || 'http://localhost:8787/admin/properties';

                  let response;
                  if (useUpload && files && files.length > 0) {
                    // Client-side validation to avoid sending bad files
                    const MAX_FILES = 6;
                    const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
                    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

                    if (files.length > MAX_FILES) throw new Error(`Too many files. Maximum is ${MAX_FILES}.`);
                    for (const f of Array.from(files)) {
                      if (!ALLOWED_TYPES.includes(f.type)) throw new Error(`Invalid file type: ${f.name}`);
                      if (f.size > MAX_FILE_BYTES) throw new Error(`File too large: ${f.name}. Max size is ${MAX_FILE_BYTES} bytes.`);
                    }

                    const fd = new FormData();
                    fd.append('title', form.title);
                    fd.append('description', form.description || '');
                    fd.append('property_type', form.property_type);
                    fd.append('price', String(form.price));
                    fd.append('location', form.location || '');
                    fd.append('seller_name', form.seller_name || '');
                    fd.append('seller_phone', form.seller_phone || '');
                    for (const f of Array.from(files)) {
                      fd.append('files', f, f.name);
                    }

                    response = await fetch(endpoint, { method: 'POST', body: fd });
                  } else {
                    const payload = {
                      title: form.title,
                      description: form.description || null,
                      property_type: form.property_type,
                      price: Number(form.price || 0),
                      location: form.location || '',
                      images: form.images ? form.images.split(',').map(s => s.trim()) : null,
                      seller_name: form.seller_name || null,
                      seller_phone: form.seller_phone || null,
                    } as any;

                    response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  }

                  const json = await response.json();
                  if (!response.ok) throw new Error(json.error || 'Failed to create property');

                  const created = json.property || json;
                  setProperties((p) => [created, ...p]);
                  setAddOpen(false);
                  setForm({ title: "", location: "", price: "", property_type: "plot", description: "", seller_name: "", seller_phone: "", images: "" });
                  setFiles(null as any);
                  setUseUpload(false);
                  toast({ title: 'Created', description: 'Property created successfully.' });
                } catch (err: any) {
                  console.error(err);
                  toast({ title: 'Error', description: err?.message || 'Failed to create property.', variant: 'destructive' });
                } finally {
                  setAdding(false);
                }
              }}>{adding ? 'Saving…' : 'Create'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProperties;
