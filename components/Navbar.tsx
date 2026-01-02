import { useEffect, useState, useCallback, useRef, useMemo, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Building2, BookOpen, Info, Phone, Menu, X, ChevronUp } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

// Constants
const SCROLL_THRESHOLD = 20;
const MOBILE_BREAKPOINT = 768;
const READING_SPEED_WPM = 200;
const SCROLL_UPDATE_THROTTLE = 100; // ms

// Types
interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  ariaLabel: string;
  sectionId?: string;
}

// Navigation Data
const NAV_LINKS: NavItem[] = [
  { label: "Home", to: "/", icon: Home, ariaLabel: "Go to homepage" },
  { label: "Properties", to: "/properties", icon: Building2, ariaLabel: "Browse properties", sectionId: "featured-properties" },
  { label: "Blog", to: "/blogs", icon: BookOpen, ariaLabel: "Read our blog", sectionId: "latest-posts" },
  { label: "About", to: "/about", icon: Info, ariaLabel: "Learn about us", sectionId: "our-story" },
  { label: "Contact", to: "/contact", icon: Phone, ariaLabel: "Contact us", sectionId: "contact-form" },
];

// Custom Hooks
const useScrollDetection = (threshold: number) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const rAF = useRef<number | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let mounted = true;

    const onFrame = () => {
      if (!mounted) return;
      setIsScrolled(lastScrollY.current > threshold);
      rAF.current = null;
    };

    const handleScroll = () => {
      lastScrollY.current = window.scrollY;
      if (rAF.current == null) {
        rAF.current = window.requestAnimationFrame(onFrame);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // seed initial state
    lastScrollY.current = window.scrollY;
    setIsScrolled(window.scrollY > threshold);

    return () => {
      mounted = false;
      window.removeEventListener("scroll", handleScroll);
      if (rAF.current != null) window.cancelAnimationFrame(rAF.current);
    };
  }, [threshold]);

  return isScrolled;
};

const useBreakpoint = (breakpoint: number) => {
  const [isBelowBreakpoint, setIsBelowBreakpoint] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const checkBreakpoint = () => {
      setIsBelowBreakpoint(window.innerWidth < breakpoint);
    };

    checkBreakpoint();
    
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkBreakpoint, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return isBelowBreakpoint;
};

const useBodyScrollLock = (isLocked: boolean) => {
  const lockRef = useRef<{ top: string; position: string; overflow: string; width: string; height: string } | null>(null);
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isLocked) {
      scrollYRef.current = window.scrollY;
      const bodyStyle = document.body.style;
      const computed = window.getComputedStyle(document.body);
      lockRef.current = {
        top: bodyStyle.top || '',
        position: bodyStyle.position || '',
        overflow: bodyStyle.overflow || computed.overflow || '',
        width: bodyStyle.width || '',
        height: bodyStyle.height || ''
      };

      bodyStyle.overflow = 'hidden';
      bodyStyle.position = 'fixed';
      bodyStyle.top = `-${scrollYRef.current}px`;
      bodyStyle.width = '100%';
      bodyStyle.height = '100vh';

      // hide main content from assistive tech while modal is open
      const main = document.querySelector('main') as HTMLElement | null;
      if (main) main.setAttribute('aria-hidden', 'true');

      return () => {
        const prev = lockRef.current;
        if (prev) {
          bodyStyle.overflow = prev.overflow;
          bodyStyle.position = prev.position;
          bodyStyle.top = prev.top;
          bodyStyle.width = prev.width;
          bodyStyle.height = prev.height;
        }
        if (main) main.removeAttribute('aria-hidden');
        window.scrollTo(0, scrollYRef.current);
        lockRef.current = null;
      };
    }
    return;
  }, [isLocked]);
};

const useEscapeKey = (callback: () => void, isActive: boolean) => {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") callback();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [callback, isActive]);
};

const useScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const [estimatedReadingTime, setEstimatedReadingTime] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0); // FLOAT 0-100
  
  const progressPercentage = useTransform(scrollYProgress, [0, 1], [0, 100]);

  useEffect(() => {
    const unsubscribe = progressPercentage.on("change", (latest) => {
      // keep float precision for animations; round only for UI text
      setScrollProgress(latest);
    });
    return () => unsubscribe();
  }, [progressPercentage]);

  useEffect(() => {
    const calculateReadingTime = () => {
      const article = document.querySelector("article, main, .content, .prose");
      if (article) {
        const text = article.textContent || "";
        const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        const time = Math.max(1, Math.ceil(wordCount / READING_SPEED_WPM));
        setEstimatedReadingTime(time);
      } else {
        setEstimatedReadingTime(0);
      }
    };

    const observer = new MutationObserver(calculateReadingTime);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      characterData: true 
    });

    const timeoutId = setTimeout(calculateReadingTime, 1000);
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return { scrollProgress, progressRounded: Math.round(scrollProgress), estimatedReadingTime, scrollYProgress };
};

const useThrottle = (value: number, limit: number) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

// Components
interface DesktopNavProps {
  isActive: (to: string) => boolean;
}

const DesktopNav = ({ isActive }: DesktopNavProps) => {

  return (
    <nav 
      className="hidden md:block" 
      aria-label="Main desktop navigation"
      role="navigation"
    >
      <div className="relative">
        <div className="relative flex items-center justify-center gap-1 bg-background/70 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm ring-1 ring-border/30">
          <ul className="relative flex items-center list-none m-0 p-0">
            {NAV_LINKS.map(({ label, to, ariaLabel, sectionId }, index) => {
              const isLinkActive = isActive(to);
              const isLastItem = index === NAV_LINKS.length - 1;
              
              return (
                <motion.li
                  key={`desktop-nav-${to}-${index}`}
                  className="relative m-0 p-0"
                  initial={false}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={to}
                    aria-label={ariaLabel || `Navigate to ${label}`}
                    className={`
                      relative z-10 block px-5 py-2 text-sm font-medium 
                      transition-all duration-200 rounded-lg
                      focus-visible:outline-none focus-visible:ring-2 
                      focus-visible:ring-primary/50 focus-visible:ring-offset-2 
                      focus-visible:ring-offset-background
                      focus-visible:z-20
                      select-none
                      ${isLinkActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10'}
                    `}
                    onClick={(e) => {
                      if (sectionId && router.pathname === to) {
                        e.preventDefault();
                        const element = document.getElementById(sectionId);
                        if (element) {
                          const headerOffset = 100;
                          const elementPosition = element.getBoundingClientRect().top;
                          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                          const newUrl = `${to}#${sectionId}`;
                          if (window.location.href !== newUrl) {
                            window.history.pushState(null, '', newUrl);
                          }
                        }
                      }
                    }}
                  >
                    {isLinkActive && (
                      <motion.div
                        layoutId="desktop-nav-background"
                        className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/15 to-primary/10 rounded-2xl border border-primary/20"
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 25 
                        }}
                        aria-hidden="true"
                      />
                    )}

                    <span className="relative z-10 whitespace-nowrap">
                      {label}
                    </span>

                    {isLinkActive && (
                      <motion.div
                        layoutId="desktop-nav-underline"
                        className="absolute bottom-2 left-4 right-4 h-[3px] rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 28,
                          mass: 0.8
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </Link>

                  {!isLastItem && (
                    <div 
                      className="absolute top-1/2 right-0 w-px h-4 -translate-y-1/2 
                               bg-gradient-to-b from-transparent via-border/30 to-transparent"
                      aria-hidden="true"
                    />
                  )}
                </motion.li>
              );
            })}
          </ul>
          
          {/* Removed the container-wide active indicator to avoid duplicate/misaligned
              underlines. Each active link already renders its own underline inside
              the NavLink, which aligns to the link width. */}
        </div>
      </div>
    </nav>
  );
};

interface ScrollIndicatorProps {
  progress: number;
  readingTime: number;
}

const ScrollIndicator = ({ progress, readingTime }: ScrollIndicatorProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // derive visibility from the single source of truth (progress)
  const isClient = typeof window !== 'undefined';
  const pageTallEnough = isClient ? document.documentElement.scrollHeight > window.innerHeight * 1.2 : false;
  const safeProgress = Math.max(0, Math.min(100, Number(progress || 0)));
  const R = 20;
  const C = 2 * Math.PI * R; // circumference
  const dashOffset = C * (1 - safeProgress / 100);
  const isVisible = pageTallEnough && safeProgress > 3 && safeProgress < 99;

  const handleBackToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const remainingTime = useMemo(() => {
    if (!readingTime || readingTime <= 0) return null;
    
    const totalSeconds = readingTime * 60;
    const remainingSeconds = totalSeconds * ((100 - progress) / 100);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.floor(remainingSeconds % 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [progress, readingTime]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.9, x: 20 }}
      animate={{ 
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0.9,
        x: isVisible ? 0 : 20
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3"
      role="progressbar"
      aria-valuenow={Math.round(safeProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Scroll progress`}
      aria-valuetext={
        readingTime && readingTime > 0
          ? `${Math.round(safeProgress)}% — ${remainingTime ?? ''} remaining`
          : `${Math.round(safeProgress)}%`
      }
    >
      <div 
        className="relative w-12 h-12 cursor-pointer group"
        onClick={handleBackToTop}
        onMouseEnter={() => setShowTooltip(true)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        role="button"
        tabIndex={0}
        aria-label={`Back to top. Scroll progress: ${progress}%`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBackToTop();
          }
        }}
      >
        <div className="absolute inset-0 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg" />
        
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            className="text-border"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <motion.circle
            cx="24"
            cy="24"
            r={R}
            fill="none"
            stroke="currentColor"
            className="text-primary"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={String(C)}
            strokeDashoffset={dashOffset}
            initial={false}
            transition={{ duration: 0.25 }}
          />
        </svg>
        
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">
              {Math.round(safeProgress)}%
            </span>
          </div>
        
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap pointer-events-none"
            >
              <div className="relative bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
                <div className="text-sm font-medium text-foreground">
                  {Math.round(safeProgress)}% scrolled
                </div>
                {remainingTime && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <div className="text-xs text-muted-foreground">
                      ~{remainingTime} remaining
                    </div>
                  </>
                )}
                <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-background" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {progress < 10 && (
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-muted-foreground"
          aria-hidden="true"
        >
          <ChevronUp className="h-4 w-4 rotate-180" />
        </motion.div>
      )}
    </motion.div>
  );
};

interface MobileScrollIndicatorProps {
  progress: number;
}

const MobileScrollIndicator = ({ progress }: MobileScrollIndicatorProps) => {
  // derive visibility directly from progress to avoid competing listeners
  const showProgress = progress > 5 && progress < 95;

  const handleProgressClick = () => {
    const sections = document.querySelectorAll("section[id], article, main, [class*='content']");
    let targetSection = null;
    
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.3 && rect.bottom >= window.innerHeight * 0.3) {
        targetSection = section;
        break;
      }
    }
    
    if (targetSection) {
      const nextSection = targetSection.nextElementSibling;
      if (nextSection && nextSection instanceof HTMLElement) {
        const headerOffset = 80;
        const elementPosition = nextSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const throttledProgress = progress; // use smooth RAF-driven progress directly

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: showProgress ? 0 : 100 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="fixed bottom-20 left-4 right-4 z-30 md:hidden"
      role="progressbar"
      aria-valuenow={Math.round(throttledProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Scroll progress: ${throttledProgress}%`}
    >
      <div 
        className="relative h-3 bg-background/80 backdrop-blur-sm rounded-full border border-border/50 shadow-lg overflow-hidden cursor-pointer active:scale-95 transition-transform"
        onClick={handleProgressClick}
        role="button"
        tabIndex={0}
        aria-label={`Jump to next section. Progress: ${throttledProgress}%`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleProgressClick();
          }
        }}
      >
        <div className="absolute inset-0 bg-muted/30" />
        
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/80 to-primary"
          style={{ width: `${throttledProgress}%` }}
          initial={false}
          transition={{ duration: 0.2 }}
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-primary-foreground mix-blend-difference select-none">
            {Math.round(throttledProgress)}%
          </span>
        </div>
        
        <div className="absolute inset-y-0 left-0 right-0 flex justify-between px-2">
          {[0, 25, 50, 75, 100].map((marker) => (
            <div
              key={marker}
              className="w-px h-full bg-border/50"
              style={{ 
                marginLeft: `calc(${marker}% - 1px)`,
                transform: marker === 50 ? 'scaleY(1.5)' : 'scaleY(1)'
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isActive: (to: string) => boolean;
  scrollProgress: number;
}

const MobileMenu = ({ isOpen, onClose, isActive, scrollProgress }: MobileMenuProps) => {
  const location = useLocation();
  const menuRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  useBodyScrollLock(isOpen);
  useEscapeKey(onClose, isOpen);

  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (isOpen && firstLinkRef.current) {
      setTimeout(() => {
        firstLinkRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Focus trap: keep focus inside the mobile menu while it's open
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const el = menuRef.current;
    const selector = 'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(el.querySelectorAll<HTMLElement>(selector)).filter(f => !f.hasAttribute('disabled'));
    if (focusable.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/90 backdrop-blur-xl z-40 md:hidden"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            ref={(node) => { menuRef.current = node as unknown as HTMLElement; }}
            className="md:hidden fixed top-0 right-0 bottom-0 w-80 max-w-full z-50 flex flex-col bg-card border-l shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">Navigation</h2>
                <div className="text-sm text-muted-foreground mt-1">
                  Scroll progress: {scrollProgress}%
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="p-2 rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {NAV_LINKS.map(({ label, to, icon: Icon, ariaLabel }, index) => {
                const active = isActive(to);
                return (
                  <NavLink
                    ref={index === 0 ? firstLinkRef : undefined}
                    key={`mobile-${to}-${index}`}
                    to={to}
                    aria-label={ariaLabel}
                    aria-current={active ? "page" : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-4 py-4 text-base font-medium transition-all
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                       ${isActive
                         ? "bg-primary/10 text-primary shadow-sm"
                         : "hover:bg-muted hover:translate-x-1"
                       }`
                    }
                    onClick={onClose}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    {active && (
                      <motion.div
                        layoutId="mobile-active"
                        className="h-2 w-2 rounded-full bg-primary flex-shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </NavLink>
                );
              })}
            </nav>
            
            <div className="p-4 border-t">
              <div className="text-xs text-muted-foreground mb-2">Current scroll</div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={false}
                  style={{ width: `${scrollProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface BottomNavProps {
  isActive: (to: string) => boolean;
  scrollProgress: number;
}

const BottomNav = ({ isActive, scrollProgress }: BottomNavProps) => {
  // derive visibility purely from central progress
  const showMiniProgress = scrollProgress > 3;
  const throttledProgress = scrollProgress; // keep float from RAF-driven source

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      aria-label="Bottom navigation"
    >
      <div className="container mx-auto px-4 pb-4">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="mx-auto max-w-md rounded-2xl bg-background/95 backdrop-blur-xl border shadow-xl overflow-hidden"
        >
              {showMiniProgress && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 3, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="rounded-t-2xl overflow-hidden"
              role="progressbar"
              aria-valuenow={throttledProgress}
            >
              <div 
                className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-200"
                style={{ width: `${throttledProgress}%` }} 
              />
            </motion.div>
          )}

          <div className="flex justify-between items-center px-4 py-2">
            {NAV_LINKS.map(({ to, icon: Icon, ariaLabel }) => {
              const active = isActive(to);
              return (
                <NavLink
                  key={`bottom-${to}`}
                  to={to}
                  aria-label={ariaLabel}
                  aria-current={active ? "page" : undefined}
                  className="relative flex flex-col items-center p-2 rounded-lg focus-visible:outline-none 
                           focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      active
                        ? "bg-primary/15 text-primary shadow-sm"
                        : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>

                  {active && (
                    <>
                      <motion.span
                        layoutId="bottom-indicator"
                        className="absolute -bottom-1 h-1 w-6 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      {throttledProgress > 0 && throttledProgress < 100 && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary/80"
                          aria-hidden="true"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </motion.div>
      </div>
    </nav>
  );
};

// Main Component
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useBreakpoint(MOBILE_BREAKPOINT);
  const isScrolled = useScrollDetection(SCROLL_THRESHOLD);
  const router = useRouter();
  const { scrollProgress, estimatedReadingTime } = useScrollProgress();

  const isActive = useCallback((to: string) => {
    if (to === "/") return router.pathname === "/";
    return router.pathname.startsWith(to);
  }, [router.pathname]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const navHeight = isScrolled ? "h-16" : "h-20";
  const logoHeight = isScrolled
    ? "h-12 sm:h-14 md:h-16 lg:h-20"
    : "h-16 sm:h-20 md:h-24 lg:h-28";

  useLayoutEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }, [isMenuOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed inset-x-0 top-0 z-50"
        role="banner"
      >
        <motion.div
          animate={{
            backdropFilter: isScrolled ? "blur(20px)" : "blur(10px)",
            backgroundColor: isScrolled 
              ? "rgba(var(--background-rgb), 0.85)" 
              : "rgba(var(--background-rgb), 0.7)",
            boxShadow: isScrolled 
              ? "0 10px 30px rgba(0,0,0,0.15), 0 0 0 1px rgba(var(--border-rgb), 0.1)" 
              : "0 4px 12px rgba(0,0,0,0.05)",
          }}
          className={`relative border-b border-border/40 transition-all duration-300 ${navHeight}`}
        >
          <div className="container mx-auto px-4 sm:px-6 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex-shrink-0">
                <Link
                  to="/"
                  aria-label="Julin Real Estate - Home"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
                           focus-visible:ring-offset-2 rounded-lg inline-block bg-transparent"
                >
                  <motion.img
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? '/'}logo.png`}
                    alt="Julin Real Estate Logo"
                    className={`${logoHeight} w-auto object-contain transition-all duration-300`}
                    width={160}
                    height={64}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    loading="eager"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      console.error('Failed to load logo image');
                    }}
                  />
                </Link>
              </div>

              <DesktopNav isActive={isActive} />

              <div className="md:hidden flex-shrink-0">
                <motion.button
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-menu"
                  onClick={toggleMenu}
                  whileTap={{ scale: 0.95 }}
                  className="h-10 w-10 rounded-full border bg-background/80 backdrop-blur 
                           flex items-center justify-center hover:bg-muted transition-colors
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                           relative"
                >
                  {isMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <>
                      <Menu className="h-5 w-5" />
                      {scrollProgress > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      )}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.header>

      <ScrollIndicator 
        progress={scrollProgress} 
        readingTime={estimatedReadingTime} 
      />
      
      {isMobile && (
        <MobileScrollIndicator progress={scrollProgress} />
      )}

      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={closeMenu} 
        isActive={isActive}
        scrollProgress={scrollProgress}
      />

      {isMobile && (
        <BottomNav 
          isActive={isActive} 
          scrollProgress={scrollProgress}
        />
      )}
    </>
  );
}