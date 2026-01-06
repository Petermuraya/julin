import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Maximize,
  Phone,
  Play,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import type { Property } from "@/types/property";
import useInView from "@/hooks/use-in-view";
import { normalizeImageUrl } from "@/lib/imageUtils";

interface PropertyCardProps {
  property: Property;
  delay?: number;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const reveal = useInView<HTMLDivElement>();
  const {
    id,
    title,
    location,
    price,
    size,
    description,
    seller_phone,
    images = [],
    video_url,
    status,
  } = property;

  const queryClient = useQueryClient();

  // Inquiry dialog & form state
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [message, setMessage] = useState(`I'm interested in ${title}. Kindly share more details.`);

  const inquiryMutation = useMutation({
    mutationFn: async (payload: { property_id: string; buyer_name: string; buyer_phone: string; message: string }) => {
      const { error } = await supabase.from("buyer_inquiries").insert([payload]);
      if (error) throw error;
      return payload;
    },
    onSuccess: (vars) => {
      const waLink = generateWhatsAppLink(seller_phone || "", vars.message);
      setInquiryOpen(false);
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      window.open(waLink, "_blank");
    },
    onError: (err: Error) => {
      console.error(err);
      toast({ title: "Error", description: err?.message || "Failed to record inquiry.", variant: "destructive" });
    },
  });

  const handleContact = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!buyerName || !buyerPhone) {
      toast({ title: "Missing info", description: "Please provide your name and phone number.", variant: "destructive" });
      return;
    }
    inquiryMutation.mutate({ property_id: id, buyer_name: buyerName, buyer_phone: buyerPhone, message });
  };

  // Lightbox / gallery - normalize all image URLs
  const gallery = (images || []).map(img => normalizeImageUrl(img));
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const openLightboxAt = useCallback((i: number, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIndex(i);
    setLightboxOpen(true);
  }, []);

  const prev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((p) => (p - 1 + gallery.length) % Math.max(1, gallery.length));
  }, [gallery.length]);

  const next = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((p) => (p + 1) % Math.max(1, gallery.length));
  }, [gallery.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowLeft") prev();
      if (ev.key === "ArrowRight") next();
      if (ev.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, gallery.length, prev, next]);

  const statusLabel = status === "available" ? "For Sale" : status === "sold" ? "Sold" : status === "pending" ? "Pending" : String(status);

  return (
    <Link to={`/property/${id}`} className="block" aria-label={`View details for ${title}`}>
      <article
        ref={reveal.ref as React.RefObject<HTMLElement>}
        style={{ transitionDelay: `${(property as any).__delay ?? 0}ms` }}
        className={`group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 ${
          reveal.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Image */}
        <div className="relative h-64 overflow-hidden">
          <button
            onClick={(e) => openLightboxAt(0, e)}
            className="block w-full h-full p-0 border-0 bg-transparent cursor-zoom-in"
            aria-label={`Open gallery for ${title}`}
            title="Open gallery"
          >
            <img
              src={gallery[0] || "/placeholder.svg"}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          {/* Status */}
          <Badge
            className={`absolute top-4 left-4 ${
              statusLabel === "For Sale"
                ? "bg-primary text-primary-foreground"
                : statusLabel === "Sold"
                ? "bg-destructive text-destructive-foreground"
                : "bg-muted text-muted-foreground"
            }`}
            aria-hidden
          >
            {statusLabel}
          </Badge>

          {/* Media indicators */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="flex items-center gap-1 bg-navy/80 text-primary-foreground text-xs px-2 py-1 rounded">
              <ImageIcon className="h-3 w-3" />
              {gallery.length}
            </span>
            {video_url && (
              <span className="flex items-center gap-1 bg-accent/90 text-accent-foreground text-xs px-2 py-1 rounded">
                <Play className="h-3 w-3" />
                Video
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-display text-xl font-semibold text-foreground mb-2 line-clamp-1">
            {title}
          </h3>

          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm">{location}</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Maximize className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">{size}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-display text-2xl font-bold text-primary">{`KES ${Number(price).toLocaleString()}`}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={`tel:${seller_phone}`}
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Call seller of ${title}`}
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </Button>

                <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={(e) => (e.stopPropagation(), setInquiryOpen(true))}>Inquire</Button>
                  </DialogTrigger>

                  <DialogContent onClick={(e) => e.stopPropagation()} aria-describedby={undefined}>
                    <DialogHeader>
                      <DialogTitle>Contact Seller</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-2">
                      <Input placeholder="Your name" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
                      <Input placeholder="Your phone (e.g. 07xxxxxxxx)" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
                      <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
                    </div>

                    <DialogFooter>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={(e) => { e.stopPropagation(); setInquiryOpen(false); }}>Cancel</Button>
                        <Button onClick={handleContact} disabled={inquiryMutation.isPending}>
                          {inquiryMutation.isPending ? "Sending…" : "Send & WhatsApp"}
                        </Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Lightbox dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()} aria-describedby={undefined}>
          <DialogHeader className="sr-only">
            <DialogTitle>Property Gallery</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full max-w-3xl">
              {gallery.length > 0 ? (
                <>
                  <img src={gallery[index]} alt={`${title} (${index + 1}/${gallery.length})`} className="w-full h-[480px] object-cover rounded" />
                  <button aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded" onClick={prev}>
                    <ChevronLeft className="h-5 w-5 text-white" />
                  </button>
                  <button aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded" onClick={next}>
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                </>
              ) : (
                <div className="w-full h-64 bg-muted rounded flex items-center justify-center">
                  <ImageIcon />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto mt-2">
                {gallery.map((g, i) => (
                  <button
                    key={g + i}
                    onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                    className={`w-20 h-12 rounded overflow-hidden border ${i === index ? "ring-2 ring-primary" : "border-border"}`}
                    aria-label={`Show image ${i + 1}`}
                  >
                    <img src={g} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Link>
  );
};

export default PropertyCard;