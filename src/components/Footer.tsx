import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative overflow-hidden text-primary-foreground py-16 mt-20"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay for luxury feel */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>

      <div className="relative container mx-auto px-6 sm:px-6 lg:px-20 text-primary-foreground">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="font-serif text-3xl font-bold text-accent tracking-wide">
                JULIN
              </span>
              <span className="font-sans text-2xl font-light">
                REAL ESTATE
              </span>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed text-lg md:text-base">
              Premium real estate services connecting buyers and sellers across
              Kenya with transparency, trust, and excellence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-xl font-semibold mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3 text-lg md:text-base">
              {[
                { name: "Home", href: "/" },
                { name: "Properties", href: "/properties" },
                { name: "About Us", href: "/about" },
                { name: "Contact", href: "/contact" },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-accent transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-xl font-semibold mb-5">
              Contact Us
            </h4>
            <ul className="space-y-4 text-lg md:text-base">
              <li className="flex items-center gap-4">
                <Phone className="h-6 w-6 text-accent" />
                <a
                  href="tel:+254725671504"
                  className="text-primary-foreground/70 hover:text-accent transition-colors"
                >
                  +254 725 671 504
                </a>
              </li>
              <li className="flex items-center gap-4">
                <MessageCircle className="h-6 w-6 text-accent" />
                <a
                  href="https://wa.me/254725671504"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/70 hover:text-accent transition-colors"
                >
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-4">
                <Mail className="h-6 w-6 text-accent" />
                <a
                  href="mailto:juliusmurigi90@gmail.com"
                  className="text-primary-foreground/70 hover:text-accent transition-colors"
                >
                  Email
                </a>
              </li>
              <li className="flex items-center gap-4">
                <MapPin className="h-6 w-6 text-accent" />
                <span className="text-primary-foreground/70">Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-primary-foreground/20 pt-8 text-center">
          <p className="text-primary-foreground/60 text-sm md:text-base">
            © {currentYear} Julin Real Estate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
