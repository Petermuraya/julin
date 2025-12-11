import { useState, FormEvent } from "react";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Types
interface ContactInfo {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
  description?: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
}

const Contact = () => {
  const contactInfo: ContactInfo[] = [
    {
      icon: Phone,
      label: "Phone",
      value: "+254725671504",
      href: "tel:+254725671504",
      description: "Call us anytime"
    },
    {
      icon: Mail,
      label: "Email",
      value: "juliusmurigi90@gmail.com",
      href: "mailto:juliusmurigi90@gmail.com",
      description: "Response within 24 hours"
    },
    {
      icon: MapPin,
      label: "Office Location",
      value: "Nairobi, Kenya",
      href: "https://maps.google.com/?q=Nairobi+Kenya",
      description: "Visit our headquarters"
    },
    {
      icon: Clock,
      label: "Working Hours",
      value: "Mon - Sat: 8AM - 6PM",
      href: "#",
      description: "Sunday: 10AM - 4PM"
    },
  ];

  return (
    <section 
      id="contact" 
      className="py-20 bg-primary text-primary-foreground scroll-mt-16"
      aria-labelledby="contact-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-accent font-semibold text-sm uppercase tracking-widest mb-4 px-4 py-1 bg-accent/10 rounded-full">
            Get In Touch
          </span>
          <h2 
            id="contact-heading" 
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          >
            Contact Us Today
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
            Ready to find your dream property or list yours? Reach out to us and let our experts guide you through your real estate journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-start gap-4 p-6 bg-primary-foreground/10 rounded-xl",
                    "hover:bg-primary-foreground/15 transition-all duration-300",
                    "hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary"
                  )}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  aria-label={`${item.label}: ${item.value}`}
                >
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-primary-foreground/70 mb-1 font-medium">
                      {item.label}
                    </p>
                    <p className="font-semibold text-lg mb-1">{item.value}</p>
                    {item.description && (
                      <p className="text-sm text-primary-foreground/60">
                        {item.description}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
            
            {/* Additional Information */}
            <div className="p-6 bg-primary-foreground/10 rounded-xl">
              <h3 className="font-semibold text-lg mb-3">Why Choose Us</h3>
              <ul className="space-y-2 text-primary-foreground/80">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>24/7 Customer Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>Free Property Valuation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>Market Insights & Reports</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card text-card-foreground rounded-2xl p-8 shadow-2xl">
            <h3 className="font-display text-2xl font-semibold mb-2">
              Send Us a Message
            </h3>
            <p className="text-muted-foreground mb-6">
              Fill out the form below and we'll get back to you within 24 hours.
            </p>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

const ContactForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    message: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ADMIN_PHONE = "+254725671504";

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Optional: Store form data in your backend first
      // await saveContactForm(formData);
      
      // Generate WhatsApp message
      const whatsappMessage = `*New Contact Form Submission*
      
Name: ${formData.name}
Phone: ${formData.phone}
Email: ${formData.email}

Message:
${formData.message}

Sent via Website Contact Form`;
      
      const whatsappLink = generateWhatsAppLink(
        ADMIN_PHONE,
        whatsappMessage
      );

      // Success toast
      toast({
        title: "Redirecting to WhatsApp",
        description: "Your message has been prepared. Opening WhatsApp...",
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = whatsappLink}
          >
            Open Now
          </Button>
        ),
      });

      // Redirect after a short delay
      setTimeout(() => {
        window.open(whatsappLink, '_blank');
        setIsSubmitting(false);
        
        // Clear form
        setFormData({ name: "", phone: "", email: "", message: "" });
      }, 2000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-muted-foreground">
            Your Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="John Doe"
            className={errors.name ? "border-destructive" : ""}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <div id="name-error" className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-3 w-3" />
              {errors.name}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-muted-foreground">
            Phone Number *
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+254 7XX XXX XXX"
            className={errors.phone ? "border-destructive" : ""}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <div id="phone-error" className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-3 w-3" />
              {errors.phone}
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-muted-foreground">
          Email Address *
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="you@example.com"
          className={errors.email ? "border-destructive" : ""}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <div id="email-error" className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            {errors.email}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message" className="text-muted-foreground">
          Your Message *
        </Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          placeholder="Tell us about the property you're looking for, preferred location, budget, and any specific requirements..."
          rows={5}
          className={errors.message ? "border-destructive" : ""}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message && (
          <div id="message-error" className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            {errors.message}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Please provide as much detail as possible for better assistance.
        </p>
      </div>
      
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            Preparing message...
          </>
        ) : (
          <>
            <Send className="h-5 w-5 mr-2" />
            Send Message via WhatsApp
          </>
        )}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        By submitting this form, you agree to our{" "}
        <a href="/privacy" className="text-accent hover:underline">
          Privacy Policy
        </a>
        . We'll respond within 24 hours.
      </p>
    </form>
  );
};