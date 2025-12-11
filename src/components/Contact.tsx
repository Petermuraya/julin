import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import { useState } from "react";

const Contact = () => {
  const contactInfo = [
    {
      icon: Phone,
      label: "Phone",
      value: "+254 700 000 000",
      href: "tel:+254700000000",
    },
    {
      icon: Mail,
      label: "Email",
      value: "juliusmurigi90@gmail.com",
      href: "mailto:juliusmurigi90@gmail.com",
    },
    {
      icon: MapPin,
      label: "Location",
      value: "Nairobi, Kenya",
      href: "#",
    },
    {
      icon: Clock,
      label: "Working Hours",
      value: "Mon - Sat: 8AM - 6PM",
      href: "#",
    },
  ];

  return (
    <section id="contact" className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-accent font-semibold text-sm uppercase tracking-widest mb-4">
            Get In Touch
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Contact Us Today
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Ready to find your dream property or list yours? Reach out to us and let us help you with your real estate journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="flex items-start gap-4 p-6 bg-primary-foreground/10 rounded-xl hover:bg-primary-foreground/15 transition-colors"
                >
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-primary-foreground/70 mb-1">
                      {item.label}
                    </p>
                    <p className="font-semibold">{item.value}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card text-card-foreground rounded-2xl p-8 shadow-xl">
            <h3 className="font-display text-xl font-semibold mb-6">
              Send Us a Message
            </h3>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

const ContactForm = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const adminPhone = "+254700000000"; // replace with your admin/office WhatsApp number

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const wa = generateWhatsAppLink(adminPhone, `Hello, my name is ${name}. ${message} (Phone: ${phone} | Email: ${email})`);
    window.location.href = wa;
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Your Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Phone Number</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Email Address</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Message</label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Tell us about the property you're looking for..." />
      </div>
      <Button variant="default" size="lg" className="w-full" type="submit">
        <Send className="h-5 w-5" />
        Send Message via WhatsApp
      </Button>
    </form>
  );
};
