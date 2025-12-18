import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, Mail } from "lucide-react";

type NavItem = {
  label: string;
  to: string;
};

const NAV_LINKS: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Properties", to: "/properties" },
  { label: "Blog", to: "/blogs" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  const desktopLinkClass = (active: boolean) =>
    [
      "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-primary",
    ].join(" ");

  const mobileLinkClass = (active: boolean) =>
    [
      "flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-primary",
    ].join(" ");

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      {/* Utility Bar */}
      <div className="hidden sm:block bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center gap-6 px-4 py-2 text-sm">
          <a
            href="tel:+254725671504"
            className="flex items-center gap-2 hover:opacity-90"
          >
            <Phone className="h-4 w-4" />
            <span>+254 725 671 504</span>
          </a>

          <a
            href="mailto:juliusmurigi90@gmail.com"
            className="flex items-center gap-2 hover:opacity-90"
          >
            <Mail className="h-4 w-4" />
            <span>juliusmurigi90@gmail.com</span>
          </a>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-baseline gap-1 font-display">
            <span className="text-2xl font-bold text-primary">JULIN</span>
            <span className="text-2xl font-light">REAL ESTATE</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, to }) => {
              const active = isActive(to);

              return (
                <NavLink key={label} to={to} className={desktopLinkClass(active)}>
                  {label}
                  {active && (
                    <span className="absolute inset-x-4 -bottom-px h-0.5 rounded bg-primary" />
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border transition hover:bg-muted"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <div className="mt-2 rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col">
                {NAV_LINKS.map(({ label, to }) => {
                  const active = isActive(to);

                  return (
                    <NavLink
                      key={label}
                      to={to}
                      onClick={() => setOpen(false)}
                      className={mobileLinkClass(active)}
                    >
                      {label}
                      {active && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
