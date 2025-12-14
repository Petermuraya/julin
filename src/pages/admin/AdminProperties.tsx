import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, MessageCircle, Twitter, Send } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { AdminPropertiesHeader } from "@/components/admin/AdminPropertiesHeader";
import { AdminPropertiesFilters } from "@/components/admin/AdminPropertiesFilters";
import { AdminPropertiesTable } from "@/components/admin/AdminPropertiesTable";
import { PropertyForm as PropertyFormType, Property } from "@/types/property";

const SUPABASE_URL = "https://fakkzdfwpucpgndofgcu.supabase.co";

const emptyForm: PropertyFormType = {
  title: "",
  location: "",
  price: "",
  property_type: "land",
  description: "",
  seller_name: "",
  seller_phone: "",
  size: "",
  images: "",
  videos: "",
  latitude: "",
  longitude: "",
  bedrooms: "",
  bathrooms: "",
  features: "",
};

const AdminProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyFormType>(emptyForm);
  const [useUpload, setUseUpload] = useState(true);
  const [useVideoUpload, setUseVideoUpload] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [mapToken, setMapToken] = useState<string>("");
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const filteredProperties = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (typeFilter !== "all" && p.property_type !== typeFilter) return false;
    return true;
  });

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

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((f) => {
      if (f.size > 50 * 1024 * 1024) { // 50MB limit for videos
        toast({ title: "File too large", description: `${f.name} exceeds 50MB limit`, variant: "destructive" });
        return false;
      }
      if (!["video/mp4", "video/avi", "video/mov", "video/wmv", "video/webm"].includes(f.type)) {
        toast({ title: "Invalid file type", description: `${f.name} is not a supported video format`, variant: "destructive" });
        return false;
      }
      return true;
    });
    const totalVideos = existingVideos.length + videoFiles.length + validFiles.length;
    if (totalVideos > 3) {
      toast({ title: "Too many videos", description: "Maximum 3 videos allowed", variant: "destructive" });
      return;
    }
    setVideoFiles((prev) => [...prev, ...validFiles]);
  };

  const removeVideoFile = (index: number) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingVideo = (index: number) => {
    setExistingVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = handleFileSelect;
  const handleVideoUpload = handleVideoFileSelect;
  const removeImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };
  const removeVideo = (index: number) => {
    setExistingVideos((prev) => prev.filter((_, i) => i !== index));
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

  const generateShareContent = (property: any) => {
    const title = property.title;
    const price = `KES ${Number(property.price || 0).toLocaleString()}`;
    const location = property.location || "Kenya";
    const propertyUrl = `https://julina.co.ke/properties/${property.id}`;
    const imageUrl = property.images?.[0] || "";

    return {
      title,
      price,
      location,
      propertyUrl,
      imageUrl,
      description: `${title} - ${price} located in ${location}. View more details and contact seller.`
    };
  };

  const shareToFacebook = (property: any) => {
    const content = generateShareContent(property);
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.propertyUrl)}&quote=${encodeURIComponent(content.description)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = (property: any) => {
    const content = generateShareContent(property);
    const text = `${content.title} - ${content.price} in ${content.location}. ${content.propertyUrl}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = (property: any) => {
    const content = generateShareContent(property);
    const text = `*${content.title}*\n\n💰 Price: ${content.price}\n📍 Location: ${content.location}\n\n${content.description}\n\nView details: ${content.propertyUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToTelegram = (property: any) => {
    const content = generateShareContent(property);
    const text = `${content.title}\n\n💰 ${content.price}\n📍 ${content.location}\n\n${content.description}\n\n${content.propertyUrl}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(content.propertyUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToInstagram = (property: any) => {
    // Instagram doesn't have a direct share URL, so we'll copy to clipboard
    const content = generateShareContent(property);
    const text = `${content.title} - ${content.price} in ${content.location}\n\n${content.description}\n\nView: ${content.propertyUrl}`;
    
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to clipboard", description: "Paste this content into Instagram" });
    }).catch(() => {
      toast({ title: "Copy failed", description: "Please copy the content manually", variant: "destructive" });
    });
  };

  const shareToTikTok = (property: any) => {
    // TikTok doesn't have a direct share URL, so we'll copy to clipboard
    const content = generateShareContent(property);
    const text = `${content.title} - ${content.price} in ${content.location}\n\n${content.description}\n\nView: ${content.propertyUrl}`;
    
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to clipboard", description: "Paste this content into TikTok" });
    }).catch(() => {
      toast({ title: "Copy failed", description: "Please copy the content manually", variant: "destructive" });
    });
  };

  const uploadVideos = async (propertyId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < videoFiles.length; i++) {
      const file = videoFiles[i];
      setUploadProgress(`Uploading video ${i + 1}/${videoFiles.length}...`);

      const fileExt = file.name.split(".").pop();
      const fileName = `${propertyId}/videos/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images") // Using same bucket for simplicity
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("Video upload error:", uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/property-images/${fileName}`;
      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const uploadImages = async (propertyId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading image ${i + 1}/${files.length}...`);

      const fileExt = file.name.split(".").pop();
      const fileName = `${propertyId}/images/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("Image upload error:", uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/property-images/${fileName}`;
      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFiles([]);
    setVideoFiles([]);
    setExistingImages([]);
    setExistingVideos([]);
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
      videos: "",
      latitude: property.latitude?.toString() || "",
      longitude: property.longitude?.toString() || "",
      bedrooms: property.bedrooms?.toString() || "",
      bathrooms: property.bathrooms?.toString() || "",
      features: property.features?.join(", ") || "",
    });
    setExistingImages(property.images || []);
    setExistingVideos(property.video_url ? [property.video_url] : []);
    setFiles([]);
    setVideoFiles([]);
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
      let videoUrls: string[] = [...existingVideos];

      // If using URL input, parse those
      if (!useUpload && form.images) {
        const urlImages = form.images.split(",").map((s) => s.trim()).filter(Boolean);
        imageUrls = [...imageUrls, ...urlImages];
      }

      if (!useUpload && form.videos) {
        const urlVideos = form.videos.split(",").map((s) => s.trim()).filter(Boolean);
        videoUrls = [...videoUrls, ...urlVideos];
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
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        features: form.features ? form.features.split(",").map((f: string) => f.trim()).filter(Boolean) : null,
        is_admin_property: true,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        // UPDATE existing property
        if (useUpload && files.length > 0) {
          const uploadedUrls = await uploadImages(editingId);
          imageUrls = [...imageUrls, ...uploadedUrls];
        }
        if (useUpload && videoFiles.length > 0) {
          const uploadedVideoUrls = await uploadVideos(editingId);
          videoUrls = [...videoUrls, ...uploadedVideoUrls];
        }

        const { error } = await supabase
          .from("properties")
          .update({
            ...propertyData,
            images: imageUrls.length > 0 ? imageUrls : null,
            video_url: videoUrls.length > 0 ? videoUrls[0] : null
          })
          .eq("id", editingId);

        if (error) throw error;

        setProperties((p) =>
          p.map((x) => (x.id === editingId ? {
            ...x,
            ...propertyData,
            images: imageUrls,
            video_url: videoUrls[0] || null
          } : x))
        );
        toast({ title: "Success", description: "Property updated successfully." });
      } else {
        // CREATE new property
        const { data: newProperty, error: insertError } = await supabase
          .from("properties")
          .insert({
            ...propertyData,
            images: imageUrls.length > 0 ? imageUrls : null,
            video_url: videoUrls.length > 0 ? videoUrls[0] : null,
            status: "available" as const,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Upload images if using file upload
        if (useUpload && files.length > 0) {
          const uploadedUrls = await uploadImages(newProperty.id);
          imageUrls = [...imageUrls, ...uploadedUrls];
        }

        // Upload videos if using file upload
        if (useUpload && videoFiles.length > 0) {
          const uploadedVideoUrls = await uploadVideos(newProperty.id);
          videoUrls = [...videoUrls, ...uploadedVideoUrls];
        }

        // Update with uploaded media URLs
        if ((useUpload && files.length > 0) || (useUpload && videoFiles.length > 0)) {
          const { error: updateError } = await supabase
            .from("properties")
            .update({
              images: imageUrls.length > 0 ? imageUrls : null,
              video_url: videoUrls.length > 0 ? videoUrls[0] : null
            })
            .eq("id", newProperty.id);

          if (updateError) throw updateError;

          newProperty.images = imageUrls;
          newProperty.video_url = videoUrls[0] || null;
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

  const bulkDeleteProperties = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProperties.length} properties?`)) return;

    try {
      setLoading(true);

      // Delete associated files first
      for (const propertyId of selectedProperties) {
        const property = properties.find((p) => p.id === propertyId);
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
      }

      const { error } = await supabase
        .from("properties")
        .delete()
        .in("id", selectedProperties);

      if (error) throw error;

      setProperties((p) => p.filter((x) => !selectedProperties.includes(x.id)));
      setSelectedProperties([]);
      toast({ title: "Deleted", description: `${selectedProperties.length} properties removed successfully.` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || "Failed to delete properties.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateStatus = async (status: "available" | "pending" | "sold") => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("properties")
        .update({ status, updated_at: new Date().toISOString() })
        .in("id", selectedProperties);

      if (error) throw error;

      setProperties((p) =>
        p.map((x) => (selectedProperties.includes(x.id) ? { ...x, status } : x))
      );
      setSelectedProperties([]);
      toast({ title: "Updated", description: `${selectedProperties.length} properties updated to ${status}.` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || "Failed to update properties.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPropertiesHeader
        selectedProperties={selectedProperties}
        openAddDialog={openAddDialog}
        bulkUpdateStatus={bulkUpdateStatus}
        bulkDeleteProperties={bulkDeleteProperties}
      />

      {/* Filters and Search */}
      <AdminPropertiesFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
      />

      {/* Properties Table */}
      <AdminPropertiesTable
        properties={properties}
        loading={loading}
        filteredProperties={filteredProperties}
        selectedProperties={selectedProperties}
        setSelectedProperties={setSelectedProperties}
        updateStatus={updateStatus}
        openEditDialog={openEditDialog}
        deleteProperty={deleteProperty}
        shareToFacebook={shareToFacebook}
        shareToTwitter={shareToTwitter}
        shareToWhatsApp={shareToWhatsApp}
        shareToTelegram={shareToTelegram}
        shareToInstagram={shareToInstagram}
        shareToTikTok={shareToTikTok}
      />

      {/* Add/Edit Property Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => {
        setDialogOpen(v);
        if (!v) {
          setFiles([]);
          setVideoFiles([]);
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
            <DialogDescription>
              {editingId ? "Update the property details below." : "Fill in the details to add a new property."}
            </DialogDescription>
          </DialogHeader>
          <PropertyForm
            form={form}
            setForm={setForm}
            locationSearch={locationSearch}
            setLocationSearch={setLocationSearch}
            searchLocation={searchLocation}
            getCurrentLocation={getCurrentLocation}
            isLocating={isLocating}
            useUpload={useUpload}
            setUseUpload={setUseUpload}
            existingImages={existingImages}
            uploadProgress={uploadProgress}
            handleImageUpload={handleImageUpload}
            handleVideoUpload={handleVideoUpload}
            removeImage={removeImage}
            removeVideo={removeVideo}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveProperty}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
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
