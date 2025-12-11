import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search, ChevronDown } from "lucide-react";

const AdminProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: "", location: "", price: "", property_type: "plot", description: "", seller_name: "", seller_phone: "", images: "" });
  const [useUpload, setUseUpload] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null as any);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProperties = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Properties</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage all properties in your portfolio</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 inline-flex items-center gap-2">
          <Plus size={18} />
          Add Property
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <Input
          placeholder="Search properties by title or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-2 h-10"
        />
      </div>

      {/* Properties Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Loading properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {searchQuery ? "No properties found matching your search" : "No properties yet"}
            </p>
            <Button onClick={() => setAddOpen(true)} variant="outline" className="mt-4">
              Add your first property
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Property
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Type
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredProperties.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{p.title}</div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{p.id.slice(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.location || "—"}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      KES {Number(p.price || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={p.status || "available"}
                        onValueChange={(v) => updateStatus(p.id, v)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className="capitalize text-xs"
                      >
                        {p.property_type || "land"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Property Dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => setAddOpen(v)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Property</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="col-span-2"
              />
              <Input
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
              <Input
                placeholder="Price (KES)"
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>

            <Select value={form.property_type} onValueChange={(v) => setForm((f) => ({ ...f, property_type: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plot">Plot</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="min-h-24"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Seller name"
                value={form.seller_name}
                onChange={(e) => setForm((f) => ({ ...f, seller_name: e.target.value }))}
              />
              <Input
                placeholder="Seller phone"
                value={form.seller_phone}
                onChange={(e) => setForm((f) => ({ ...f, seller_phone: e.target.value }))}
              />
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useUpload}
                    onChange={() => setUseUpload(false)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Image URLs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={useUpload}
                    onChange={() => setUseUpload(true)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload Images</span>
                </label>
              </div>
              {!useUpload ? (
                <Input
                  placeholder="Images (comma separated URLs)"
                  value={form.images}
                  onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
                  className="text-sm"
                />
              ) : (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setFiles(e.target.files)}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="cursor-pointer block">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {files && files.length > 0
                        ? `${files.length} file(s) selected`
                        : "Click to select images"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      PNG, JPG, WEBP up to 5MB each
                    </p>
                  </label>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setAdding(true);
                try {
                  // basic validation
                  if (!form.title.trim()) throw new Error("Title is required");
                  if (!form.price || Number(form.price) <= 0) throw new Error("Price must be a positive number");

                  const endpoint = import.meta.env.VITE_ADMIN_API_URL || "http://localhost:8787/admin/properties";

                  let response;
                  if (useUpload && files && files.length > 0) {
                    // Client-side validation to avoid sending bad files
                    const MAX_FILES = 6;
                    const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
                    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

                    if (files.length > MAX_FILES) throw new Error(`Too many files. Maximum is ${MAX_FILES}.`);
                    for (const f of Array.from(files)) {
                      if (!ALLOWED_TYPES.includes(f.type))
                        throw new Error(`Invalid file type: ${f.name}`);
                      if (f.size > MAX_FILE_BYTES)
                        throw new Error(`File too large: ${f.name}. Max size is ${MAX_FILE_BYTES} bytes.`);
                    }

                    const fd = new FormData();
                    fd.append("title", form.title);
                    fd.append("description", form.description || "");
                    fd.append("property_type", form.property_type);
                    fd.append("price", String(form.price));
                    fd.append("location", form.location || "");
                    fd.append("seller_name", form.seller_name || "");
                    fd.append("seller_phone", form.seller_phone || "");
                    for (const f of Array.from(files)) {
                      fd.append("files", f, f.name);
                    }

                    response = await fetch(endpoint, { method: "POST", body: fd });
                  } else {
                    const payload = {
                      title: form.title,
                      description: form.description || null,
                      property_type: form.property_type,
                      price: Number(form.price || 0),
                      location: form.location || "",
                      images: form.images ? form.images.split(",").map((s) => s.trim()) : null,
                      seller_name: form.seller_name || null,
                      seller_phone: form.seller_phone || null,
                    } as any;

                    response = await fetch(endpoint, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                  }

                  const json = await response.json();
                  if (!response.ok) throw new Error(json.error || "Failed to create property");

                  const created = json.property || json;
                  setProperties((p) => [created, ...p]);
                  setAddOpen(false);
                  setForm({
                    title: "",
                    location: "",
                    price: "",
                    property_type: "plot",
                    description: "",
                    seller_name: "",
                    seller_phone: "",
                    images: "",
                  });
                  setFiles(null as any);
                  setUseUpload(false);
                  toast({ title: "Success", description: "Property created successfully." });
                } catch (err: any) {
                  console.error(err);
                  toast({
                    title: "Error",
                    description: err?.message || "Failed to create property.",
                    variant: "destructive",
                  });
                } finally {
                  setAdding(false);
                }
              }}
              disabled={adding}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {adding ? "Creating..." : "Create Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProperties;
