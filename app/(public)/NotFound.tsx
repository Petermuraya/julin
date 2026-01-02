import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Moon, Star } from "lucide-react";

// Use a narrow Sentry type and load it dynamically at runtime to avoid
// bundling the package in environments where it's not installed.
type SentryType = {
  captureMessage: (msg: string, opts?: unknown) => void;
  init?: (opts?: unknown) => void;
  configureScope?: (fn: (scope: unknown) => void) => void;
  withScope?: (fn: (scope: unknown) => void) => void;
};

const Sentry: SentryType | null = null;

const REDIRECT_SECONDS = 8;

const fadeContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const float = {
  initial: { y: -20 },
  animate: {
    y: [ -20, 0, -20 ],
    transition: { duration: 6, repeat: Infinity },
  },
};

const twinkle = {
  initial: { opacity: 0.3 },
  animate: {
    opacity: [0.3, 0.7, 0.3],
    transition: { duration: 4, repeat: Infinity },
  },
};

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // --- Sentry observability (safe & structured) - disabled for now
    // (async () => {
    //   try {
    //     const mod = await import('@sentry/react');
    //     Sentry = mod as unknown as SentryType;
    //   } catch {
    //     Sentry = null;
    //   }

    //   try {
    //     Sentry?.captureMessage("404 – Route Not Found", {
    //       level: "warning",
    //       tags: { type: "routing", status: "404" },
    //       extra: {
    //         path: location.pathname,
    //         search: location.search,
    //         referrer: document.referrer || "direct",
    //         userAgent: navigator.userAgent,
    //       },
    //     });
    //   } catch {
    //     // Fail silently — UX must never depend on telemetry
    //   }
    // })();

    // Decrement countdown every second and redirect immediately when it reaches 0.
    intervalRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Ensure any pending timeout is cleared and navigate home.
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          navigate("/", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Fallback timeout in case interval is blocked or the tab becomes inactive.
    timeoutRef.current = window.setTimeout(() => {
      navigate("/", { replace: true });
      timeoutRef.current = null;
    }, REDIRECT_SECONDS * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [location.pathname, location.search, navigate]);

  const progress = (countdown / REDIRECT_SECONDS) * 100;

  return (
    <motion.main
      variants={fadeContainer}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative flex min-h-screen items-center justify-center overflow-hidden
                 bg-gradient-to-b from-sky-300 via-sky-150 to-white px-4"
    >
      {/* Stars */}
      <motion.div variants={twinkle} initial="initial" animate="animate">
        <Star className="absolute top-16 left-10 text-sky-400" size={22} />
        <Star className="absolute top-44 right-20 text-sky-300" size={18} />
        <Star className="absolute bottom-36 left-28 text-sky-300" size={20} />
      </motion.div>

      <section className="relative z-10 w-full max-w-xl text-center">
        {/* Moon */}
        <motion.div
          variants={float}
          initial="initial"
          animate="animate"
          className="mx-auto mb-8 flex h-24 w-24 items-center justify-center
                     rounded-full bg-sky-300/40 shadow-xl backdrop-blur"
        >
          <Moon size={42} className="text-sky-800" />
        </motion.div>

        {/* Code */}
        <h1 className="text-8xl font-extrabold text-sky-500/30 mb-3">
          404
        </h1>

        <h2 className="text-3xl font-bold text-sky-900 mb-4">
          Lost in Space
        </h2>

        <p className="text-lg text-sky-700 mb-6 leading-relaxed">
          The page you’re looking for drifted beyond our radar.
          <br />
          Returning you safely home in{" "}
          <span className="font-semibold">{countdown}</span> seconds.
        </p>

        {/* Progress bar */}
        <div className="mx-auto mb-8 h-2 w-64 overflow-hidden rounded-full bg-sky-200">
          <motion.div
            className="h-full bg-sky-500"
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg
                         bg-sky-600 px-6 py-3 font-medium text-white
                         shadow-md transition hover:bg-sky-700"
            >
              <Home size={18} />
              Home
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-lg
                         border border-sky-300 px-6 py-3 font-medium
                         text-sky-700 transition hover:bg-sky-100"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </motion.div>
        </div>
      </section>
    </motion.main>
  );
};

export default function NotFound() {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn('Deprecated: use app/not-found.tsx instead of src/pages/NotFound.tsx');
  }
  return null;
}
