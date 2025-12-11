// src/components/Contact_OPTIMIZED.tsx
// Optimized Contact component with form validation and DB persistence

import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPhoneForWhatsApp, generateWhatsAppLink } from "@/lib/whatsapp";

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

const ContactForm = () => {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  // Simple validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^(0|\+254)[0-9]{9}$/.test(form.phone.replace(/\s+/g, ""))) {
      newErrors.phone = "Invalid phone number (use 0xxxxxxxxx or +254xxxxxxxxx)";
    }

    if (!form.message.trim()) {
      newErrors.message = "Message is required";
    } else if (form.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus("error");
      setSubmitMessage("Please fix the errors below");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // 1. Save message to database
      const { error: dbError } = await supabase.from("site_messages").insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        subject: "Website Inquiry",
        source: "contact_form",
        status: "new",
      });

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Failed to save message. Please try again.");
      }

      // 2. Send via WhatsApp to admin
      const formattedPhone = formatPhoneForWhatsApp("+254700000000"); // Admin phone
      const whatsappMessage = `New contact form submission:\n\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\n\nMessage:\n${form.message}`;
      const whatsappLink = generateWhatsAppLink(formattedPhone, whatsappMessage);

      window.open(whatsappLink, "_blank");

      // 3. Show success
      setSubmitStatus("success");
      setSubmitMessage(
        "Thank you! Your message has been saved. You'll be redirected to WhatsApp to chat with our team."
      );

      // Reset form
      setForm({
        name: "",
        email: "",
        phone: "",
        message: "",
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus("idle");
        setSubmitMessage("");
      }, 5000);
    } catch (err) {
      console.error("Error submitting form:", err);
      setSubmitStatus("error");
      setSubmitMessage(
        err instanceof Error ? err.message : "An error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Status Messages */}
      {submitStatus === "success" && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800 font-medium">{submitMessage}</p>
        </div>
      )}

      {submitStatus === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 font-medium">{submitMessage}</p>
        </div>
      )}

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          Full Name *
        </label>
        <Input
          type="text"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="John Doe"
          disabled={isSubmitting}
          aria-label="Your full name"
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          Email Address *
        </label>
        <Input
          type="email"
          id="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="john@example.com"
          disabled={isSubmitting}
          aria-label="Your email address"
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      {/* Phone Field */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
          Phone Number (WhatsApp) *
        </label>
        <Input
          type="tel"
          id="phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="07XXXXXXXX or +254..."
          disabled={isSubmitting}
          aria-label="Your phone number"
          className={errors.phone ? "border-red-500" : ""}
        />
        {errors.phone && (
          <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
        )}
      </div>

      {/* Message Field */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
          Message *
        </label>
        <Textarea
          id="message"
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Tell us about your real estate inquiry..."
          disabled={isSubmitting}
          rows={4}
          aria-label="Your message"
          className={errors.message ? "border-red-500" : ""}
        />
        {errors.message && (
          <p className="text-red-600 text-sm mt-1">{errors.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>

      {/* Helper Text */}
      <p className="text-xs text-slate-600 text-center">
        All fields marked with * are required. We'll respond via WhatsApp within 2 hours.
      </p>
    </form>
  );
};

// Main Contact Page Component
const Contact = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us - Julin Real Estate Kenya</title>
        <meta
          name="description"
          content="Get in touch with Julin Real Estate. We're here to help you find or list properties in Kenya. Contact us via WhatsApp, phone, or email."
        />
        <meta
          name="keywords"
          content="contact real estate Kenya, properties inquiry, Nairobi real estate contact"
        />
        <link rel="canonical" href="https://julina.co.ke/contact" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Get in Touch</h1>
            <p className="text-xl text-slate-600">
              Have questions? We're here to help. Reach out to our team anytime.
            </p>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Contact Info */}
            <div className="space-y-6">
              {/* Info Card 1: WhatsApp */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371 0-.57 0-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.364-3.905 6.75-1.896 10.238 1.34 2.236 3.575 3.619 6.014 3.859 1.325.11 2.618-.242 3.787-.94.359.365.712.723 1.061 1.084 1.03 1.025 2.066 2.056 3.094 3.082.341.341.682.683 1.025 1.024.566-.554 1.12-1.118 1.662-1.695.65-.649 1.283-1.315 1.897-1.996-.655-.662-1.302-1.341-1.932-2.034-.316-.34-.628-.683-.937-1.03 1.32-1.33 2.165-3.064 2.165-5.024 0-3.898-3.162-7.061-7.061-7.061z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-slate-900">WhatsApp</h3>
                    <p className="text-slate-600 mt-2">
                      Message us on WhatsApp for instant support. Usually respond within 2 hours.
                    </p>
                    <a
                      href="https://wa.me/254700000000?text=Hi%20Julin%20Real%20Estate"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 font-medium mt-2 inline-block"
                    >
                      Open WhatsApp →
                    </a>
                  </div>
                </div>
              </div>

              {/* Info Card 2: Phone */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-slate-900">Phone</h3>
                    <p className="text-slate-600 mt-2">
                      Call us during business hours (9am - 6pm, Monday to Friday).
                    </p>
                    <a
                      href="tel:+254700000000"
                      className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                    >
                      +254 700 000 000
                    </a>
                  </div>
                </div>
              </div>

              {/* Info Card 3: Email */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-slate-900">Email</h3>
                    <p className="text-slate-600 mt-2">
                      Send us an email and we'll respond within 24 hours.
                    </p>
                    <a
                      href="mailto:info@julina.co.ke"
                      className="text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block"
                    >
                      info@julina.co.ke
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Send us a Message
              </h2>
              <ContactForm />
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  How do I list a property?
                </h3>
                <p className="text-slate-600">
                  Visit our "List Your Property" page or contact us directly. We'll guide you
                  through the process of submitting your property details, photos, and pricing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  How long does listing take?
                </h3>
                <p className="text-slate-600">
                  Once you submit your property details, our team reviews it within 24 hours.
                  Approved properties appear on our platform immediately.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  Is there a fee to list?
                </h3>
                <p className="text-slate-600">
                  Listing on Julin is FREE. We only charge a commission when your property is
                  sold or rented through our platform.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  How do buyers contact sellers?
                </h3>
                <p className="text-slate-600">
                  Buyers can contact sellers directly via WhatsApp through the property listing.
                  We never store buyer contact info for privacy protection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
