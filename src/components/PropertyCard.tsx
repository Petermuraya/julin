import { MapPin, Maximize, Phone, Play, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PropertyCardProps {
  id: string;
  image?: string | undefined;
  title: string;
  location: string;
  price: string;
  size: string;
  details: string;
  phone: string;
  hasVideo?: boolean;
  imageCount?: number;
  status?: "For Sale" | "For Rent" | "Sold" | string;
}

const PropertyCard = ({
  id,
  image,
  title,
  location,
  price,
  size,
  details,
  phone,
  hasVideo = false,
  imageCount = 5,
  status = "For Sale",
}: PropertyCardProps) => {
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [message, setMessage] = useState(`I'm interested in ${title}. Kindly share more details.`);
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const inquiryMutation = useMutation(
    async (payload: { property_id: string; buyer_name: string; buyer_phone: string; message: string }) => {
      const { error } = await supabase.from("buyer_inquiries").insert([payload]);
      if (error) throw error;
      return payload;
    },
    {
      onSuccess: (vars) => {
        // open whatsapp and close dialog
        const waLink = generateWhatsAppLink(phone, vars.message);
        setOpen(false);
        // Invalidate properties to refresh any counts or recent inquiries UI
        queryClient.invalidateQueries(["properties"]);
        // navigate to whatsapp
        window.location.href = waLink;
      },
      onError: (err: any) => {
        console.error(err);
        toast({ title: "Error", description: err?.message || "Failed to record inquiry.", variant: "destructive" });
      },
    },
  );

  const handleContact = async () => {
    if (!buyerName || !buyerPhone) {
      toast({ title: "Missing info", description: "Please provide your name and phone number.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    inquiryMutation.mutate({ property_id: id, buyer_name: buyerName, buyer_phone: buyerPhone, message });
    setSubmitting(false);
  };

  return (
    <article className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
      {/* Image container */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Status badge */}
        <Badge 
          className={`absolute top-4 left-4 ${
            status === "For Sale" 
              ? "bg-primary text-primary-foreground" 
              : status === "For Rent" 
              ? "bg-accent text-accent-foreground" 
              : "bg-muted text-muted-foreground"
          }`}
        >
          {status}
        </Badge>

        {/* Media indicators */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <span className="flex items-center gap-1 bg-navy/80 text-primary-foreground text-xs px-2 py-1 rounded">
            <Image className="h-3 w-3" />
            {imageCount}
          </span>
          {hasVideo && (
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

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {details}
        </p>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-display text-2xl font-bold text-primary">{price}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a href={`tel:${phone}`} className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call Now
                </a>
              </Button>

              <Dialog open={open} onOpenChange={setOpen}>
                <Dialog.Trigger asChild>
                  <Button size="sm">Contact for More Info</Button>
                </Dialog.Trigger>
                <DialogContent>
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
                      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                      <Button onClick={handleContact} disabled={submitting}>{submitting ? 'Sending…' : 'Send & Open WhatsApp'}</Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PropertyCard;
