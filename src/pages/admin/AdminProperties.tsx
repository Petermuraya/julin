import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search, Upload, X, Image as ImageIcon, MapPin, Navigation } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const SUPABASE_URL = "https://fakkzdfwpucpgndofgcu.supabase.co";

type PropertyForm = {
  title: string;
  location: string;
  price: string;
  property_type: "land" | "plot" | "house" | "apartment" | "commercial";
  description: string;
  seller_name: string;
  seller_phone: string;
  size: string;
  images: string;
  latitude: string;
  longitude: string;
};

const emptyForm: PropertyForm = {
  title: "",
  location: "",
  price: "",
  property_type: "land",
  description: "",
  seller_name: "",
  seller_phone: "",
  size: "",
  images: "",
  latitude: "",
  longitude: "",
};

const AdminProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyForm>(emptyForm);
  const [useUpload, setUseUpload] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapToken, setMapToken] = useState<string>("");
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const filteredProperties = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    const fetchMapToken = async () => {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-mapbox-token`);
        const data = await response.json();
        if (data.token) {
          setMapToken(data.token);
        }
      } catch (error) {
        console.error("Failed to fetch Mapbox token:", error);
      }
    };
    fetchMapToken();
  }, []);

  // Initialize map when dialog opens and we have coordinates
  useEffect(() => {
    if (!dialogOpen || !mapToken) return;

    const timeoutId = setTimeout(() => {
      const mapContainer = document.getElementById('property-map');
      if (!mapContainer) return;

      const lat = form.latitude ? parseFloat(form.latitude) : -1.2921; // Nairobi default
      const lng = form.longitude ? parseFloat(form.longitude) : 36.8219;

      mapboxgl.accessToken = mapToken;

      const newMap = new mapboxgl.Map({
        container: mapContainer,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: form.latitude && form.longitude ? 15 : 10,
      });

      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

      const newMarker = new mapboxgl.Marker({ color: '#2563eb', draggable: true })
        .setLngLat([lng, lat])
        .addTo(newMap);

      // Update form when marker is dragged
      newMarker.on('dragend', () => {
        const lngLat = newMarker.getLngLat();
        setForm((f) => ({
          ...f,
          latitude: lngLat.lat.toString(),
          longitude: lngLat.lng.toString(),
        }));
      });

      // Update marker when coordinates change
      const updateMarker = () => {
        if (form.latitude && form.longitude) {
          const newLat = parseFloat(form.latitude);
          const newLng = parseFloat(form.longitude);
          newMarker.setLngLat([newLng, newLat]);
          newMap.setCenter([newLng, newLat]);
        }
      };

      setMap(newMap);
      setMarker(newMarker);

      // Listen for coordinate changes
      const handleCoordsChange = () => updateMarker();
      // We can't directly listen to form changes, so we'll update on dialog close

      return () => {
        newMap.remove();
        setMap(null);
        setMarker(null);
      };
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timeoutId);
  }, [dialogOpen, mapToken]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (marker && form.latitude && form.longitude) {
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      marker.setLngLat([lng, lat]);
      map?.setCenter([lng, lat]);
    }
  }, [form.latitude, form.longitude, marker, map]);

  const loadProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setProperties(data || []);
    setLoading(false);
  };

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
    const validFiles = selectedFiles.filter((f) => {
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
    const totalImages = existingImages.length + files.length + validFiles.length;
    if (totalImages > 10) {
      toast({ title: "Too many images", description: "Maximum 10 images allowed", variant: "destructive" });
      return;
    }
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation is not supported by this browser.", variant: "destructive" });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm((f) => ({ ...f, latitude: latitude.toString(), longitude: longitude.toString() }));
        toast({ title: "Location captured", description: "Your current location has been set." });
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({ title: "Location error", description: "Failed to get your location. Please check permissions.", variant: "destructive" });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const searchLocation = async () => {
    if (!locationSearch.trim() || !mapToken) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationSearch)}.json?access_token=${mapToken}&limit=1`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setForm((f) => ({ ...f, latitude: lat.toString(), longitude: lng.toString() }));
        toast({ title: "Location found", description: `Coordinates set for: ${data.features[0].place_name}` });
      } else {
        toast({ title: "Location not found", description: "Please try a different search term.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({ title: "Search error", description: "Failed to search location.", variant: "destructive" });
    }
  };

  const uploadImages = async (propertyId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1}/${files.length}...`);

      const fileExt = file.name.split(".").pop();
      const fileName = `${propertyId}/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/property-images/${fileName}`;
      uploadedUrls.push(publicUrl);
    }

    setUploadProgress("");
    return uploadedUrls;
  };

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFiles([]);
    setExistingImages([]);
    setUseUpload(true);
    setDialogOpen(true);
  };

  const openEditDialog = (property: any) => {
    setEditingId(property.id);
    setForm({
      title: property.title || "",
      location: property.location || "",
      price: property.price?.toString() || "",
      property_type: property.property_type || "land",
      description: property.description || "",
      seller_name: property.seller_name || "",
      seller_phone: property.seller_phone || "",
      size: property.size || "",
      images: "",
      latitude: property.latitude?.toString() || "",
      longitude: property.longitude?.toString() || "",
    });
    setExistingImages(property.images || []);
    setFiles([]);
    setUseUpload(true);
    setDialogOpen(true);
  };

  const handleSaveProperty = async () => {
    setSaving(true);
    try {
      // Validation
      if (!form.title.trim()) throw new Error("Title is required");
      if (!form.location.trim()) throw new Error("Location is required");
      if (!form.price || Number(form.price) <= 0) throw new Error("Price must be a positive number");

      let imageUrls: string[] = [...existingImages];

      // If using URL input, parse those
      if (!useUpload && form.images) {
        const urlImages = form.images.split(",").map((s) => s.trim()).filter(Boolean);
        imageUrls = [...imageUrls, ...urlImages];
      }

      const propertyData = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        property_type: form.property_type,
        price: Number(form.price),
        location: form.location.trim(),
        size: form.size.trim() || null,
        seller_name: form.seller_name.trim() || null,
        seller_phone: form.seller_phone.trim() || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        is_admin_property: true,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        // UPDATE existing property
        if (useUpload && files.length > 0) {
          const uploadedUrls = await uploadImages(editingId);
          imageUrls = [...imageUrls, ...uploadedUrls];
        }

        const { error } = await supabase
          .from("properties")
          .update({ ...propertyData, images: imageUrls.length > 0 ? imageUrls : null })
          .eq("id", editingId);

        if (error) throw error;

        setProperties((p) =>
          p.map((x) => (x.id === editingId ? { ...x, ...propertyData, images: imageUrls } : x))
        );
        toast({ title: "Success", description: "Property updated successfully." });
      } else {
        // CREATE new property
        const { data: newProperty, error: insertError } = await supabase
          .from("properties")
          .insert({
            ...propertyData,
            images: imageUrls.length > 0 ? imageUrls : null,
            status: "available" as const,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Upload images if using file upload
        if (useUpload && files.length > 0) {
          const uploadedUrls = await uploadImages(newProperty.id);
          imageUrls = [...imageUrls, ...uploadedUrls];

          const { error: updateError } = await supabase
            .from("properties")
            .update({ images: imageUrls })
            .eq("id", newProperty.id);

          if (updateError) throw updateError;

          newProperty.images = imageUrls;
        }

        setProperties((p) => [newProperty, ...p]);
        toast({ title: "Success", description: "Property created successfully." });
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setFiles([]);
      setExistingImages([]);
      setEditingId(null);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err?.message || "Failed to save property.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setUploadProgress("");
    }
  };

  const deleteProperty = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      const property = properties.find((p) => p.id === id);
      if (property?.images?.length) {
        const filePaths = property.images
          .map((url: string) => {
            const match = url.match(/property-images\/(.+)$/);
            return match ? match[1] : null;
          })
          .filter(Boolean);

        if (filePaths.length > 0) {
          await supabase.storage.from("property-images").remove(filePaths);
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
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700 inline-flex items-center gap-2">
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
            <Button onClick={openAddDialog} variant="outline" className="mt-4">
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
                          onClick={() => openEditDialog(p)}
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

      {/* Add/Edit Property Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => {
        setDialogOpen(v);
        if (!v) {
          setFiles([]);
          setUploadProgress("");
          setEditingId(null);
          setLocationSearch("");
          setIsLocating(false);
          // Clean up map
          if (map) {
            map.remove();
            setMap(null);
            setMarker(null);
          }
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editingId ? "Edit Property" : "Add New Property"}</DialogTitle>
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

            {/* Location/Map Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Property Location
              </h3>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for a location..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={searchLocation}
                    variant="outline"
                    size="sm"
                  >
                    Search
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={getCurrentLocation}
                    variant="outline"
                    size="sm"
                    disabled={isLocating}
                    className="flex items-center gap-2"
                  >
                    <Navigation size={16} />
                    {isLocating ? "Getting Location..." : "Use My Location"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Latitude"
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                  />
                  <Input
                    placeholder="Longitude"
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                  />
                </div>

                {form.latitude && form.longitude && (
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Coordinates: {parseFloat(form.latitude).toFixed(6)}, {parseFloat(form.longitude).toFixed(6)}
                  </div>
                )}

                <div id="property-map" className="w-full h-64 rounded-lg border border-slate-200 dark:border-slate-700"></div>
              </div>
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

              {/* Existing Images (for editing) */}
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Images</p>
                  <div className="grid grid-cols-4 gap-2">
                    {existingImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveProperty}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (uploadProgress || "Saving...") : (editingId ? "Update Property" : "Create Property")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProperties;
