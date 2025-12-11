import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneForWhatsApp, generateWhatsAppLink } from "@/lib/whatsapp";

interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  propertyType: string;
  image: string;
  description: string;
  sellerPhone: string;
}

export default function PropertyCard({
  id,
  title,
  price,
  location,
  propertyType,
  image,
  description,
  sellerPhone,
}: PropertyCardProps) {
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleContact = async () => {
    if (!buyerName || !buyerPhone || !message) {
      alert("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      // Record inquiry in Supabase
      const { error } = await supabase.from("buyer_inquiries").insert({
        property_id: id,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        message,
        inquiry_source: "website_contact_form",
      });

      if (error) throw error;

      // Generate WhatsApp link and redirect
      const formattedPhone = formatPhoneForWhatsApp(sellerPhone);
      const whatsappMessage = `Hi! I'm interested in "${title}" listed at KES ${price.toLocaleString()}. ${message}`;
      const whatsappLink = generateWhatsAppLink(formattedPhone, whatsappMessage);

      window.open(whatsappLink, "_blank");

      // Reset form and close
      setBuyerName("");
      setBuyerPhone("");
      setMessage("");
      setOpen(false);
    } catch (err) {
      console.error("Error recording inquiry:", err);
      alert("Failed to process inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Image Container with proper dimensions for LCP */}
        <div className="relative w-full aspect-video bg-slate-200 overflow-hidden">
          {!imageError && image ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              width={400}
              height={300}
              decoding="async"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              title={title}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
              <span className="text-slate-600">Image not available</span>
            </div>
          )}
          
          {/* Property Type Badge - Overlaid on image */}
          <Badge
            className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white"
            variant="default"
          >
            {propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 hover:text-blue-600">
            {title}
          </h3>

          {/* Price - Prominent */}
          <div className="mb-3">
            <p className="text-2xl font-bold text-blue-600">
              KES {price.toLocaleString()}
            </p>
          </div>

          {/* Location */}
          <div className="flex items-center text-slate-600 mb-3">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{location}</span>
          </div>

          {/* Description - Truncated */}
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">
            {description}
          </p>

          {/* Contact Button */}
          <Button
            onClick={() => setOpen(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            aria-label={`Contact seller for ${title}`}
          >
            Contact Seller
          </Button>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Interested in {title}?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Property Preview in Modal */}
            <div className="bg-slate-100 p-3 rounded-md">
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-sm text-slate-600">KES {price.toLocaleString()}</p>
            </div>

            {/* Buyer Name */}
            <div>
              <label className="text-sm font-medium text-slate-700">Your Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                disabled={submitting}
                aria-label="Your name"
              />
            </div>

            {/* Buyer Phone */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Your Phone (WhatsApp)
              </label>
              <Input
                type="tel"
                placeholder="07XXXXXXXX or +254..."
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                disabled={submitting}
                aria-label="Your phone number"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Your Message (optional)
              </label>
              <Textarea
                placeholder="Tell the seller why you're interested..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
                rows={3}
                aria-label="Your inquiry message"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleContact}
              disabled={submitting || !buyerName || !buyerPhone}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting ? "Sending..." : "Send via WhatsApp"}
            </Button>

            {/* Info Text */}
            <p className="text-xs text-slate-600 text-center">
              We'll record your inquiry and redirect you to WhatsApp
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
