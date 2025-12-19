import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Home, Building2, BookOpen, Info, Phone, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Home", to: "/", icon: Home },
  { label: "Properties", to: "/properties", icon: Building2 },
  { label: "Blog", to: "/blogs", icon: BookOpen },
  { label: "About", to: "/about", icon: Info },
  { label: "Contact", to: "/contact", icon: Phone },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <>
      {/* ===== TOP NAV ===== */}
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          animate={{
            backdropFilter: "blur(18px)",
            boxShadow: scrolled
              ? "0 10px 30px rgba(0,0,0,0.15)"
              : "none",
          }}
          className="bg-background/70 border-b border-border/60"
        >
          <nav className="container mx-auto px-6">
            <div
              className={`flex items-center justify-between transition-all ${
                scrolled ? "h-14" : "h-16"
              }`}
            >
              {/* Brand */}
              <Link to="/" className="flex items-baseline gap-1">
                <span className="font-serif text-2xl font-bold text-accent">
                  JULIN
                </span>
                <span className="text-2xl font-light text-foreground/90">
                  REAL ESTATE
                </span>
              </Link>

              {/* Desktop Links */}
              <div className="hidden md:flex items-center gap-2 relative">
                {NAV_LINKS.map(({ label, to }) => {
                  const active = isActive(to);
                  return (
                    <NavLink
                      key={label}
                      to={to}
                      className={`relative px-4 py-2 text-sm font-medium transition-colors
                        ${
                          active
                            ? "text-primary"
                            : "text-muted-foreground hover:text-primary"
                        }`}
                    >
                      {label}

                      {/* Active glow */}
                      {active && (
                        <>
                          <motion.span
                            layoutId="nav-glow"
                            className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-primary"
                          />
                          <span className="absolute inset-x-0 -bottom-2 h-4 blur-xl bg-primary/30" />
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>

              {/* Mobile Toggle */}
              <button
                onClick={() => setOpen(!open)}
                className="md:hidden h-10 w-10 rounded-full border bg-background/60 backdrop-blur flex items-center justify-center"
              >
                {open ? <X /> : <Menu />}
              </button>
            </div>

            {/* Mobile dropdown */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="md:hidden mt-3 rounded-2xl bg-card/90 backdrop-blur-xl border p-4 shadow-xl"
                >
                  {NAV_LINKS.map(({ label, to }) => (
                    <NavLink
                      key={label}
                      to={to}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-4 py-3 text-base hover:bg-muted"
                    >
                      {label}
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </motion.div>
      </motion.header>

      {/* ===== iOS STYLE BOTTOM NAV ===== */}
      <div className="fixed bottom-4 inset-x-0 z-50 md:hidden px-4">
        <div className="mx-auto max-w-md rounded-3xl bg-background/80 backdrop-blur-xl border shadow-xl">
          <div className="flex justify-between px-6 py-3">
            {NAV_LINKS.map(({ to, icon: Icon }) => {
              const active = isActive(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="relative flex flex-col items-center gap-1"
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-full ${
                      active ? "bg-primary/15 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>

                  {active && (
                    <motion.span
                      layoutId="bottom-indicator"
                      className="absolute -bottom-1 h-1 w-4 rounded-full bg-primary"
                    />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
