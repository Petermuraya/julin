import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MapPin,
  Phone,
  Mail,
  Maximize,
  ChevronLeft,
  ChevronRight,
  X,
  Home,
  Calendar,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

const SUPABASE_URL = "https://fakkzdfwpucpgndofgcu.supabase.co";

interface Property {
  id: string;
  title: string;
  description: string | null;
  price: number;
  location: string;
  county: string | null;
  size: string | null;
  property_type: string;
  status: string;
  images: string[] | null;
  amenities: string[] | null;
  seller_name: string | null;
  seller_phone: string | null;
  seller_email: string | null;
  is_verified: boolean | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

const PropertyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mapToken, setMapToken] = useState<string>("");
  
  // Contact form state
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching property:", error);
        toast({ title: "Error", description: "Failed to load property", variant: "destructive" });
      }
      
      setProperty(data);
      if (data) {
        setMessage(`Hi, I'm interested in "${data.title}". Please share more details.`);
      }
      setLoading(false);
    };

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

    fetchProperty();
    fetchMapToken();
  }, [id]);

  // Initialize map when property and token are available
  useEffect(() => {
    if (!mapContainer.current || !property || !mapToken || map.current) return;
    
    // Default to Nairobi if no coordinates
    const lng = property.longitude || 36.8219;
    const lat = property.latitude || -1.2921;

    try {
      mapboxgl.accessToken = mapToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom: 14,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add marker
      new mapboxgl.Marker({ color: "#2563eb" })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<h3 class="font-semibold">${property.title}</h3><p>${property.location}</p>`
          )
        )
        .addTo(map.current);
    } catch (error) {
      console.error("Map initialization error:", error);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [property, mapToken]);

  const handleSubmitInquiry = async () => {
    if (!buyerName.trim() || !buyerPhone.trim()) {
      toast({ title: "Missing info", description: "Please provide your name and phone number.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("buyer_inquiries").insert({
        property_id: property?.id,
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim(),
        buyer_email: buyerEmail.trim() || null,
        message: message.trim(),
      });

      if (error) throw error;

      toast({ title: "Inquiry Sent!", description: "We'll get back to you shortly." });
      
      // Open WhatsApp
      if (property?.seller_phone) {
        const waLink = generateWhatsAppLink(property.seller_phone, message);
        window.open(waLink, "_blank");
      }

      // Reset form
      setBuyerName("");
      setBuyerPhone("");
      setBuyerEmail("");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || "Failed to submit inquiry.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const nextImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images!.length);
    }
  };

  const prevImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images!.length) % property.images!.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-8">The property you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/properties">Browse Properties</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const images = property.images?.length ? property.images : ["/placeholder.svg"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Back Button */}
      <div className="container mx-auto px-4 pt-24 pb-4">
        <Link
          to="/properties"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Properties
        </Link>
      </div>

      {/* Image Gallery */}
      <section className="container mx-auto px-4 pb-8">
        <div className="relative rounded-2xl overflow-hidden bg-muted">
          {/* Main Image */}
          <div
            className="relative h-[400px] md:h-[500px] cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={images[currentImageIndex]}
              alt={`${property.title} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-background/80 px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              {property.is_verified && (
                <Badge className="bg-green-600 text-white">
                  <CheckCircle size={14} className="mr-1" /> Verified
                </Badge>
              )}
              <Badge className={property.status === "available" ? "bg-primary" : "bg-muted"}>
                {property.status === "available" ? "For Sale" : property.status}
              </Badge>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Property Details & Contact */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Price */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{property.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin size={18} className="text-primary" />
                <span>{property.location}{property.county ? `, ${property.county}` : ""}</span>
              </div>
              <p className="text-4xl font-bold text-primary">
                KES {Number(property.price).toLocaleString()}
              </p>
            </div>

            {/* Quick Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card p-4 rounded-xl border border-border">
                <Home size={24} className="text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-semibold capitalize">{property.property_type}</p>
              </div>
              {property.size && (
                <div className="bg-card p-4 rounded-xl border border-border">
                  <Maximize size={24} className="text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-semibold">{property.size}</p>
                </div>
              )}
              <div className="bg-card p-4 rounded-xl border border-border">
                <Calendar size={24} className="text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Listed</p>
                <p className="font-semibold">{new Date(property.created_at).toLocaleDateString()}</p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border">
                <MapPin size={24} className="text-primary mb-2" />
                <p className="text-sm text-muted-foreground">County</p>
                <p className="font-semibold">{property.county || "—"}</p>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Features & Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Location</h2>
              <div
                ref={mapContainer}
                className="w-full h-[400px] rounded-xl overflow-hidden border border-border"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {property.location}{property.county ? `, ${property.county}` : ""}
              </p>
            </div>
          </div>

          {/* Sidebar - Contact Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl border border-border p-6 shadow-lg">
              <h3 className="text-xl font-bold text-foreground mb-4">Interested in this property?</h3>
              
              {/* Seller Info */}
              {(property.seller_name || property.seller_phone) && (
                <div className="mb-6 p-4 bg-muted rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Contact</p>
                  {property.seller_name && (
                    <p className="font-semibold text-foreground">{property.seller_name}</p>
                  )}
                  {property.seller_phone && (
                    <a
                      href={`tel:${property.seller_phone}`}
                      className="flex items-center gap-2 text-primary hover:underline mt-1"
                    >
                      <Phone size={16} />
                      {property.seller_phone}
                    </a>
                  )}
                </div>
              )}

              {/* Contact Form */}
              <div className="space-y-4">
                <Input
                  placeholder="Your Name *"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
                <Input
                  placeholder="Your Phone *"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                />
                <Input
                  placeholder="Your Email"
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                />
                <Textarea
                  placeholder="Your Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button
                  onClick={handleSubmitInquiry}
                  disabled={submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? "Sending..." : "Send Inquiry & WhatsApp"}
                </Button>
                
                {property.seller_phone && (
                  <Button variant="outline" asChild className="w-full" size="lg">
                    <a href={`tel:${property.seller_phone}`}>
                      <Phone size={18} className="mr-2" />
                      Call Now
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X size={32} />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2"
          >
            <ChevronLeft size={40} />
          </button>
          
          <img
            src={images[currentImageIndex]}
            alt={`${property.title} - Image ${currentImageIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2"
          >
            <ChevronRight size={40} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-lg">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PropertyDetailPage;