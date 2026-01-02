import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPhoneForWhatsApp, generateWhatsAppLink } from "lib/whatsapp";

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  property_type: string;
  location: string;
  seller_name: string;
  seller_phone: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

const  PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) {
        setError("Property not found");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("properties")
          .select("*")
          .eq("id", id)
          .eq("status", "available")
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Property not found");

        // Resolve image
        if (data.id) {
          const { data: bucket } = await supabase.storage.from("properties").list();
          const fileMap = new Map(
            bucket?.map((f) => [f.name.split(".")[0], f.name]) || []
          );
          const imageUrl = fileMap.has(data.id)
            ? supabase.storage.from("properties").getPublicUrl(fileMap.get(data.id)!).data.publicUrl
            : "";
          setProperty({ ...data, image: imageUrl });
        }
      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Failed to load property details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleContact = async () => {
    if (!buyerName || !buyerPhone || !property) return;

    setSubmitting(true);
    try {
      // Record inquiry
      const { error: insertError } = await supabase.from("buyer_inquiries").insert({
        property_id: property.id,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        message,
        inquiry_source: "property_detail_page",
      });

      if (insertError) throw insertError;

      // Redirect to WhatsApp
      const formattedPhone = formatPhoneForWhatsApp(property.seller_phone);
      const whatsappMessage = `Hi! I'm interested in "${property.title}" listed at KES ${property.price.toLocaleString()}. ${message || "Please provide more details."}`;
      const whatsappLink = generateWhatsAppLink(formattedPhone, whatsappMessage);

      window.open(whatsappLink, "_blank");

      // Reset and close
      setBuyerName("");
      setBuyerPhone("");
      setMessage("");
      setOpen(false);
    } catch (err) {
      console.error("Error recording inquiry:", err);
      alert("Failed to send inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-96 w-full mb-6" />
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-700 mb-4">{error || "Property not found"}</p>
          <Button onClick={() => navigate("/properties")}>
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  // SEO-optimized description
  const seoDescription = property.description.substring(0, 160) || 
    `${property.title} in ${property.location} at KES ${property.price.toLocaleString()}. Contact ${property.seller_name} for details.`;

  // Structured Data (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateProperty",
    name: property.title,
    description: property.description,
    image: property.image,
    price: property.price,
    priceCurrency: "KES",
    url: `${import.meta.env.BASE_URL}#/properties/${property.id}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location,
      addressCountry: "KE",
    },
    seller: {
      "@type": "Person",
      name: property.seller_name,
      telephone: property.seller_phone,
    },
    datePublished: new Date(property.created_at).toISOString(),
    dateModified: new Date(property.updated_at).toISOString(),
  };

  return (
    <>
      <Helmet>
        <title>{property.title} - KES {property.price.toLocaleString()} | Julin Real Estate</title>
        <meta name="description" content={seoDescription} />
        <meta
          name="keywords"
          content={`${property.property_type}, ${property.location}, Kenya, real estate, property for sale`}
        />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${import.meta.env.BASE_URL}#/properties/${property.id}`} />
        <meta property="og:title" content={property.title} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={property.image || ""} />
        <meta property="og:site_name" content="Julin Real Estate" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`${import.meta.env.BASE_URL}#/properties/${property.id}`} />
        <meta property="twitter:title" content={property.title} />
        <meta property="twitter:description" content={seoDescription} />
        <meta property="twitter:image" content={property.image || ""} />

        {/* Canonical & Pagination */}
        <link rel="canonical" href={`${import.meta.env.BASE_URL}#/properties/${property.id}`} />

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => navigate("/properties")}
            className="mb-6"
          >
            ← Back to Properties
          </Button>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Image & Details */}
            <div className="lg:col-span-2">
              {/* Image */}
              <div className="bg-white rounded-lg overflow-hidden shadow-md mb-6">
                {property.image ? (
                  <img
                    src={property.image}
                    alt={property.title}
                    loading="eager"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                    <span className="text-slate-600">Image not available</span>
                  </div>
                )}
              </div>

              {/* Property Info */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="mb-4">
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white mb-3">
                    {property.property_type.charAt(0).toUpperCase() +
                      property.property_type.slice(1)}
                  </Badge>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-slate-600 mb-4">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {property.location}
                  </div>
                </div>

                {/* Price - Prominent */}
                <div className="border-b border-slate-200 pb-4 mb-4">
                  <p className="text-slate-600 text-sm font-medium mb-1">Price</p>
                  <p className="text-4xl font-bold text-green-600">
                    KES {property.price.toLocaleString()}
                  </p>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-3">
                    Description
                  </h2>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {property.description}
                  </p>
                </div>

                {/* Seller Info */}
                <div className="bg-slate-50 rounded-md p-4">
                  <p className="text-sm text-slate-600 mb-2">Listed by</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {property.seller_name}
                  </p>
                  <p className="text-sm text-slate-600">
                    Phone: {property.seller_phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Contact CTA */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Interested?
                </h2>
                <p className="text-slate-600 mb-6">
                  Connect with {property.seller_name} via WhatsApp to discuss this
                  property.
                </p>
                <Button
                  onClick={() => setOpen(true)}
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white mb-3"
                >
                  Contact via WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    const whatsappLink = generateWhatsAppLink(
                      formatPhoneForWhatsApp(property.seller_phone),
                      `Hi! I'm interested in "${property.title}". Can you provide more information?`
                    );
                    window.open(whatsappLink, "_blank");
                  }}
                >
                  Direct WhatsApp
                </Button>

                {/* Quick Info Cards */}
                <div className="mt-6 space-y-3 pt-6 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Property Type</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {property.property_type.charAt(0).toUpperCase() +
                        property.property_type.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Location</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {property.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Listed</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(property.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Inquiry to {property.seller_name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Property Preview */}
            <div className="bg-slate-100 p-3 rounded-md">
              <p className="text-sm font-semibold text-slate-900">{property.title}</p>
              <p className="text-sm text-slate-600">
                KES {property.price.toLocaleString()} • {property.location}
              </p>
            </div>

            {/* Form */}
            <div>
              <label className="text-sm font-medium text-slate-700">Your Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Your Phone (WhatsApp)
              </label>
              <Input
                type="tel"
                placeholder="07XXXXXXXX"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Message</label>
              <Textarea
                placeholder="Ask about the property..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
                rows={3}
              />
            </div>

            <Button
              onClick={handleContact}
              disabled={submitting || !buyerName || !buyerPhone}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting ? "Sending..." : "Send via WhatsApp"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function PropertyDetailPage() {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn('Deprecated: use app/(public)/properties/[id]/page.tsx instead of src/pages/PropertyDetailPage.tsx');
  }
  return null;
}
