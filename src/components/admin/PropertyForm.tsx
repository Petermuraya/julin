import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Upload, X, Image as ImageIcon, Video, Play } from "lucide-react";
import { PropertyForm as PropertyFormType } from "@/types/property";

interface PropertyFormProps {
  form: PropertyFormType;
  setForm: (form: PropertyFormType | ((prev: PropertyFormType) => PropertyFormType)) => void;
  locationSearch: string;
  setLocationSearch: (value: string) => void;
  searchLocation: () => void;
  getCurrentLocation: () => void;
  isLocating: boolean;
  useUpload: boolean;
  setUseUpload: (value: boolean) => void;
  existingImages: string[];
  uploadProgress: string | null;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  removeVideo: (index: number) => void;
}

export const PropertyForm = ({
  form,
  setForm,
  locationSearch,
  setLocationSearch,
  searchLocation,
  getCurrentLocation,
  isLocating,
  useUpload,
  setUseUpload,
  existingImages,
  uploadProgress,
  handleImageUpload,
  handleVideoUpload,
  removeImage,
  removeVideo,
}: PropertyFormProps) => {
  return (
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

      {/* Only show bedrooms, bathrooms, and features for non-land properties */}
      {form.property_type !== 'land' && form.property_type !== 'plot' && (
        <div className="grid grid-cols-3 gap-4">
          <Input
            placeholder="Bedrooms"
            type="number"
            value={form.bedrooms}
            onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
          />
          <Input
            placeholder="Bathrooms"
            type="number"
            value={form.bathrooms}
            onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))}
          />
          <Input
            placeholder="Features (comma separated)"
            value={form.features}
            onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
          />
        </div>
      )}

      {/* Location/Map Section */}
      <div className="border border-border rounded-lg p-4">
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
            <div className="text-sm text-muted-foreground">
              Coordinates: {parseFloat(form.latitude).toFixed(6)}, {parseFloat(form.longitude).toFixed(6)}
            </div>
          )}

          <div id="property-map" className="w-full h-64 rounded-lg border border-border"></div>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={useUpload}
              onChange={() => setUseUpload(true)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-foreground">Upload Images</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!useUpload}
              onChange={() => setUseUpload(false)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-foreground">Image URLs</span>
          </label>
        </div>

        {/* Existing Images (for editing) */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground mb-2">Current Images</p>
            <div className="grid grid-cols-4 gap-2">
              {existingImages.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Property ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Drag and drop images here, or click to select
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>Choose Images</span>
                  </Button>
                </label>
              </div>
              {uploadProgress && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress}
                  </p>
                </div>
              )}
            </div>

            {/* Image URLs textarea */}
            <Textarea
              placeholder="Or enter image URLs (one per line)"
              value={form.images}
              onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
              className="min-h-20"
            />
          </div>
        ) : (
          <Textarea
            placeholder="Enter image URLs (one per line)"
            value={form.images}
            onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
            className="min-h-20"
          />
        )}
      </div>

      {/* Video Upload Section */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Video size={20} />
          Property Videos
        </h3>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Drag and drop videos here, or click to select
              </p>
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>Choose Videos</span>
                </Button>
              </label>
            </div>
          </div>

          {/* Video URLs textarea */}
          <Textarea
            placeholder="Or enter video URLs (one per line)"
            value={form.videos}
            onChange={(e) => setForm((f) => ({ ...f, videos: e.target.value }))}
            className="min-h-20"
          />
        </div>
      </div>
    </div>
  );
};