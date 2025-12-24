import { useState, FormEvent } from "react";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, AlertCircle, Loader, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import useInView from "@/hooks/use-in-view";

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
  subject?: string;
  inquiryType?: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
}

const Contact = () => {
  const header = useInView<HTMLDivElement>();
  const left = useInView<HTMLDivElement>();
  const formRef = useInView<HTMLDivElement>();
  const contactInfo: ContactInfo[] = [
    {
      icon: Phone,
      label: "Phone",
      value: "+254725671504",
      href: "tel:+254725671504",
      description: "Call us anytime",
    },
    {
      icon: Mail,
      label: "Email",
      value: "juliusmurigi90@gmail.com",
      href: "mailto:juliusmurigi90@gmail.com",
      description: "Response within 24 hours",
    },
    {
      icon: MapPin,
      label: "Office Location",
      value: "Nairobi, Kenya",
      href: "https://maps.google.com/?q=Nairobi+Kenya",
      description: "Visit our headquarters",
    },
    {
      icon: Clock,
      label: "Working Hours",
      value: "Mon - Sat: 8AM - 6PM",
      href: "#",
      description: "Sunday: 10AM - 4PM",
    },
  ];

  return (
    <section
      id="contact"
      className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 scroll-mt-16"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          ref={header.ref as React.RefObject<HTMLDivElement>}
          className={`text-center max-w-3xl mx-auto mb-12 md:mb-20 transition-all duration-700 ${header.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-sm uppercase tracking-wider mb-6">
            Get in Touch
          </span>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Contact Us Today
          </h2>

          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Have questions about properties or need real estate support? Reach out to our expert team.
            We're here to help with any inquiry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {/* Contact Info Cards */}
          <div
            ref={left.ref as React.RefObject<HTMLDivElement>}
            className={`lg:col-span-1 space-y-6 transition-all duration-700 ${left.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            {contactInfo.map((item, index) => (
              <a
                key={index}
                href={item.href}
                aria-label={`${item.label}: ${item.value}`}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                style={{ transitionDelay: `${index * 80}ms` }}
                className={cn(
                  "flex items-start gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200",
                  "hover:border-primary/30 hover:shadow-lg hover:bg-slate-50 transition-all duration-500",
                  left.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                )}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-6 w-6 text-white" />
                </div>

                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
                  <p className="font-semibold text-slate-900 text-sm md:text-base mt-1">{item.value}</p>
                  {item.description && (
                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  )}
                </div>
              </a>
            ))}

            {/* Why Choose Us */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/10 mt-8">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Why Choose Us
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>24/7 Real Estate Support</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>Property Valuation</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>Verified Listings</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div
              ref={formRef.ref as React.RefObject<HTMLDivElement>}
              className={`bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100 transition-all duration-700 ${formRef.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              <h3 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">Send Us a Message</h3>
              <p className="text-slate-600 mb-8 text-sm md:text-base">
                Fill in your details below. We'll save your inquiry and you'll be redirected to WhatsApp 
                to continue the conversation.
              </p>
              <ContactForm />
            </div>
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
    message: "",
    inquiryType: "general",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const ADMIN_PHONE = "+254725671504";

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^(\+254|0)[0-9]{9}$/.test(formData.phone.replace(/\s+/g, ""))) {
      newErrors.phone = "Invalid Kenyan phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
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
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check all fields and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to Supabase using direct API call
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/contact_submissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            message: formData.message.trim(),
            subject: formData.subject || "General Inquiry",
            inquiry_type: formData.inquiryType || "general",
            status: "new",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Supabase error:", errorData);
        throw new Error("Failed to save message");
      }

      // Show success message
      toast({
        title: "Success!",
        description: "Your message has been saved. Redirecting to WhatsApp...",
        variant: "default",
      });

      setIsSuccess(true);

      // Create concise WhatsApp message
      const whatsappMessage = `Hi! I'm reaching out about: ${formData.message.substring(0, 100)}${formData.message.length > 100 ? "..." : ""}%0A%0AYou can reach me at: ${formData.phone}`;
      const link = generateWhatsAppLink(ADMIN_PHONE, whatsappMessage);

      // Redirect after a short delay
      setTimeout(() => {
        window.open(link, "_blank");
        // Reset form
        setFormData({
          name: "",
          phone: "",
          email: "",
          message: "",
          inquiryType: "general",
        });
        setIsSuccess(false);
      }, 1000);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "Failed to save your message. Please try again.",
        variant: "destructive",
      });
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
      {/* Name and Inquiry Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="John Doe"
            className={cn(
              "h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary",
              errors.name && "border-red-500 focus:border-red-500"
            )}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" /> {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">
            Inquiry Type
          </Label>
          <select
            value={formData.inquiryType}
            onChange={(e) => handleChange("inquiryType", e.target.value)}
            className={cn(
              "h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900",
              "focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all",
              "text-sm font-medium disabled:bg-slate-50 disabled:text-slate-500"
            )}
            disabled={isSubmitting}
          >
            <option value="general">General Inquiry</option>
            <option value="property_inquiry">Property Inquiry</option>
            <option value="support">Support</option>
            <option value="partnership">Partnership</option>
          </select>
        </div>
      </div>

      {/* Phone and Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+254 712 345 678"
            className={cn(
              "h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary",
              errors.phone && "border-red-500 focus:border-red-500"
            )}
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" /> {errors.phone}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="you@example.com"
            className={cn(
              "h-11 rounded-xl border-slate-200 focus:border-primary focus:ring-primary",
              errors.email && "border-red-500 focus:border-red-500"
            )}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" /> {errors.email}
            </p>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">
          Message <span className="text-red-500">*</span>
          <span className="text-xs text-slate-500 font-normal ml-2">
            ({formData.message.length}/500)
          </span>
        </Label>
        <Textarea
          value={formData.message}
          onChange={(e) => {
            if (e.target.value.length <= 500) {
              handleChange("message", e.target.value);
            }
          }}
          placeholder="Tell us what you need assistance with..."
          className={cn(
            "rounded-xl border-slate-200 focus:border-primary focus:ring-primary min-h-28 resize-none",
            errors.message && "border-red-500 focus:border-red-500"
          )}
          maxLength={500}
          disabled={isSubmitting}
        />
        {errors.message && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3" /> {errors.message}
          </p>
        )}
        <p className="text-xs text-slate-500">
          Keep your message brief. You'll continue on WhatsApp after submission.
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || isSuccess}
        className={cn(
          "w-full h-12 text-base font-semibold rounded-xl transition-all duration-300",
          "flex items-center justify-center gap-2",
          isSuccess && "bg-green-600 hover:bg-green-600"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader className="h-5 w-5 animate-spin" />
            <span>Saving and redirecting...</span>
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle className="h-5 w-5" />
            <span>Redirecting to WhatsApp...</span>
          </>
        ) : (
          <>
            <MessageCircle className="h-5 w-5" />
            <span>Send and WhatsApp</span>
          </>
        )}
      </Button>

      <p className="text-xs text-slate-600 text-center">
        Your message will be saved in our system and you'll continue the conversation on WhatsApp.
      </p>
    </form>
  );
};
