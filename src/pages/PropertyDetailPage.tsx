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

import PropertyGallery from '@/components/property/PropertyGallery';
import PropertyMap from '@/components/property/PropertyMap';
import PropertyDetails from '@/components/property/PropertyDetails';
import PropertyContactSidebar from '@/components/property/PropertyContactSidebar';

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

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching property:', error);
        toast({ title: 'Error', description: 'Failed to load property', variant: 'destructive' });
      }

      setProperty(data);
      setLoading(false);
    };

    fetchProperty();
  }, [id]);





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
      <PropertyGallery property={property} />

      {/* Property Details & Contact */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <PropertyDetails property={property} />
            <PropertyMap property={property} />
          </div>

          <div className="lg:col-span-1">
            <PropertyContactSidebar property={property} />
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
};

export default PropertyDetailPage;