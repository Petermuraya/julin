import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search, Upload, X, Image as ImageIcon } from "lucide-react";

const SUPABASE_URL = "https://fakkzdfwpucpgndofgcu.supabase.co";

const AdminProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ 
    title: "", 
    location: "", 
    price: "", 
    property_type: "land" as "land" | "plot" | "house" | "apartment" | "commercial",
    description: "", 
    seller_name: "", 
    seller_phone: "", 
    size: "",
    images: "" 
  });
  const [useUpload, setUseUpload] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>("");
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

  const updateStatus = async (id: string, status: "available" | "pending" | "sold") => {
    try {
      await supabase.from("properties").update({ status }).eq("id", id);
      setProperties((p) => p.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: `${f.name} exceeds 5MB limit`, variant: "destructive" });
        return false;
      }
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)) {
        toast({ title: "Invalid file type", description: `${f.name} is not a supported image format`, variant: "destructive" });
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...validFiles].slice(0, 10)); // Max 10 images
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (propertyId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1}/${files.length}...`);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}-${i}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }
      
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/property-images/${fileName}`;
      uploadedUrls.push(publicUrl);
    }
    
    setUploadProgress("");
    return uploadedUrls;
  };

  const handleCreateProperty = async () => {
    setAdding(true);
    try {
      // Validation
      if (!form.title.trim()) throw new Error("Title is required");
      if (!form.location.trim()) throw new Error("Location is required");
      if (!form.price || Number(form.price) <= 0) throw new Error("Price must be a positive number");

      let imageUrls: string[] = [];

      // If using URL input
      if (!useUpload && form.images) {
        imageUrls = form.images.split(",").map(s => s.trim()).filter(Boolean);
      }

      // Create property first (to get the ID for image folder)
      const { data: newProperty, error: insertError } = await supabase
        .from("properties")
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          property_type: form.property_type,
          price: Number(form.price),
          location: form.location.trim(),
          size: form.size.trim() || null,
          seller_name: form.seller_name.trim() || null,
          seller_phone: form.seller_phone.trim() || null,
          images: imageUrls.length > 0 ? imageUrls : null,
          is_admin_property: true,
          status: "available" as const,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload images if using file upload
      if (useUpload && files.length > 0) {
        const uploadedUrls = await uploadImages(newProperty.id);
        
        // Update property with image URLs
        const { error: updateError } = await supabase
          .from("properties")
          .update({ images: uploadedUrls })
          .eq("id", newProperty.id);
        
        if (updateError) throw updateError;
        
        newProperty.images = uploadedUrls;
      }

      setProperties((p) => [newProperty, ...p]);
      setAddOpen(false);
      setForm({
        title: "",
        location: "",
        price: "",
        property_type: "land",
        description: "",
        seller_name: "",
        seller_phone: "",
        size: "",
        images: "",
      });
      setFiles([]);
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
      setUploadProgress("");
    }
  };

  const deleteProperty = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    
    try {
      // Delete images from storage first
      const property = properties.find(p => p.id === id);
      if (property?.images?.length) {
        const filePaths = property.images
          .map((url: string) => {
            const match = url.match(/property-images\/(.+)$/);
            return match ? match[1] : null;
          })
          .filter(Boolean);
        
        if (filePaths.length > 0) {
          await supabase.storage.from('property-images').remove(filePaths);
        }
      }

      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
      
      setProperties((p) => p.filter((x) => x.id !== id));
      toast({ title: "Deleted", description: "Property removed successfully." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || "Failed to delete property.", variant: "destructive" });
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Property</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">Type</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredProperties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.title} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                            <ImageIcon size={20} className="text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{p.title}</div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{p.images?.length || 0} images</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.location || "—"}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      KES {Number(p.price || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={p.status || "available"}
                        onValueChange={(v) => updateStatus(p.id, v as "available" | "pending" | "sold")}
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
                      <Badge variant="outline" className="capitalize text-xs">
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
                          onClick={() => deleteProperty(p.id)}
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

      {/* Add Property Dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) { setFiles([]); setUploadProgress(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Property</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Property Title *"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="col-span-2"
              />
              <Input
                placeholder="Location *"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
              <Input
                placeholder="Price (KES) *"
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select value={form.property_type} onValueChange={(v) => setForm((f) => ({ ...f, property_type: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="plot">Plot</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Size (e.g., 1/8 Acre, 50x100)"
                value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
              />
            </div>

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

            {/* Image Upload Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={useUpload}
                    onChange={() => setUseUpload(true)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload Images</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!useUpload}
                    onChange={() => setUseUpload(false)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Image URLs</span>
                </label>
              </div>

              {useUpload ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input" className="cursor-pointer block">
                      <Upload className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Click to select images
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        PNG, JPG, WEBP, GIF up to 5MB each (max 10 images)
                      </p>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {files.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Input
                  placeholder="Image URLs (comma separated)"
                  value={form.images}
                  onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
                  className="text-sm"
                />
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProperty}
              disabled={adding}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {adding ? (uploadProgress || "Creating...") : "Create Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProperties;