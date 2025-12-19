import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";
import { Link } from "react-router-dom";

const FooterLight = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 text-slate-700 mt-20 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="flex justify-center md:justify-start items-center gap-2 mb-4">
              <span className="font-serif text-2xl font-bold text-accent">
                JULIN
              </span>
              <span className="font-sans text-lg font-light tracking-wide">
                REAL ESTATE
              </span>
            </div>

            <p className="text-sm leading-relaxed text-slate-600 max-w-sm mx-auto md:mx-0">
              Premium real estate services. Connecting buyers and sellers across
              Kenya with trust, transparency, and excellence.
            </p>

            {/* Social Icons */}
            <div className="flex justify-center md:justify-start gap-4 mt-5">
              <a
                href="#"
                aria-label="Facebook"
                className="p-2 rounded-full bg-white shadow hover:text-accent transition"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="p-2 rounded-full bg-white shadow hover:text-accent transition"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="p-2 rounded-full bg-white shadow hover:text-accent transition"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h4 className="font-semibold text-base mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { name: "Home", href: "/" },
                { name: "Properties", href: "/properties" },
                { name: "About Us", href: "/about" },
                { name: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="hover:text-accent transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center md:text-left">
            <h4 className="font-semibold text-base mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-center md:justify-start items-center gap-3">
                <Phone className="h-4 w-4 text-accent" />
                <a href="tel:+254725671504" className="hover:text-accent">
                  +254 725 671 504
                </a>
              </li>

              <li className="flex justify-center md:justify-start items-center gap-3">
                <MessageCircle className="h-4 w-4 text-accent" />
                <a
                  href="https://wa.me/254725671504"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent"
                >
                  WhatsApp
                </a>
              </li>

              <li className="flex justify-center md:justify-start items-center gap-3">
                <Mail className="h-4 w-4 text-accent" />
                <a
                  href="mailto:juliusmurigi90@gmail.com"
                  className="hover:text-accent break-all"
                >
                  juliusmurigi90@gmail.com
                </a>
              </li>

              <li className="flex justify-center md:justify-start items-center gap-3">
                <MapPin className="h-4 w-4 text-accent" />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t text-center text-xs text-slate-500">
          © {currentYear} Julin Real Estate. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default FooterLight;
