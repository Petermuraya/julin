import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail } from "lucide-react";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Properties", to: "/properties" },
  { label: "Blog", to: "/blogs" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      {/* Top utility bar */}
      <div className="hidden sm:block bg-primary text-primary-foreground">
        <div className="container mx-auto flex justify-between items-center px-4 py-2 text-sm">
          <div className="flex items-center gap-6">
            <a href="tel:+254725671504" className="flex items-center gap-2 hover:opacity-90">
              <Phone className="h-4 w-4" />
              <span>+254 725 671 504</span>
            </a>
            <a href="mailto:juliusmurigi90@gmail.com" className="flex items-center gap-2 hover:opacity-90">
              <Mail className="h-4 w-4" />
              <span>juliusmurigi90@gmail.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-baseline gap-1 font-display">
            <span className="text-2xl font-bold text-primary">JULIN</span>
            <span className="text-2xl font-light">REAL ESTATE</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className={() =>
                  `relative px-4 py-2 rounded-full text-sm font-medium transition-all ` +
                  (isActive(l.to)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-muted")
                }
              >
                {l.label}
                {isActive(l.to) && (
                  <span className="absolute inset-x-4 -bottom-px h-0.5 rounded bg-primary" />
                )}
              </NavLink>
            ))}
            <Button asChild size="lg" className="ml-2 rounded-full">
              <Link to="/contact">List Property</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-muted"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        <div
          className={`md:hidden overflow-hidden transition-[grid-template-rows,opacity] duration-300 ` +
          (open ? "grid grid-rows-[1fr] opacity-100" : "grid grid-rows-[0fr] opacity-0")}
        >
          <div className="min-h-0">
            <div className="mt-2 rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col">
                {navLinks.map((l) => (
                  <NavLink
                    key={l.label}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={() =>
                      `flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors ` +
                      (isActive(l.to)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-primary")
                    }
                  >
                    {l.label}
                    {isActive(l.to) && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </NavLink>
                ))}
                <Button asChild size="lg" className="mt-3 rounded-xl">
                  <Link to="/contact" onClick={() => setOpen(false)}>
                    List Property
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
