import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { generateWhatsAppLink } from '@/lib/whatsapp';
import { supabase } from '@/integrations/supabase/client';

import type { Property } from '@/types/property';

interface Props {
  property: Property;
}

const PropertyContactSidebar: React.FC<Props> = ({ property }) => {
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (property) setMessage(`Hi, I'm interested in "${property.title}". Please share more details.`);
  }, [property]);

  const handleSubmitInquiry = async () => {
    if (!buyerName.trim() || !buyerPhone.trim()) {
      toast({ title: 'Missing info', description: "Please provide your name and phone number.", variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('buyer_inquiries').insert({
        property_id: property?.id,
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim(),
        buyer_email: buyerEmail.trim() || null,
        message: message.trim(),
      });

      if (error) throw error;

      toast({ title: 'Inquiry Sent!', description: "We'll get back to you shortly." });

      if (property?.seller_phone) {
        const waLink = generateWhatsAppLink(property.seller_phone, message);
        window.open(waLink, '_blank');
      }

      setBuyerName('');
      setBuyerPhone('');
      setBuyerEmail('');
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err?.message || 'Failed to submit inquiry.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sticky top-24 bg-card rounded-2xl border border-border p-6 shadow-lg">
      <h3 className="text-xl font-bold text-foreground mb-4">Interested in this property?</h3>

      {(property?.seller_name || property?.seller_phone) && (
        <div className="mb-6 p-4 bg-muted rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Contact</p>
          {property?.seller_name && <div className="font-semibold">{property.seller_name}</div>}
          {property?.seller_phone && <div className="text-sm text-muted-foreground">{property.seller_phone}</div>}
        </div>
      )}

      <div className="space-y-3">
        <Input placeholder="Your name" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
        <Input placeholder="Phone" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
        <Input placeholder="Email (optional)" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />

        <Button onClick={handleSubmitInquiry} disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Inquiry'}
        </Button>
      </div>
    </div>
  );
};

export default PropertyContactSidebar;
