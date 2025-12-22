import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop
 * Scrolls the window to the top on route changes. If a hash is present and
 * matches an element id, it will scroll that element into view instead.
 */
export default function ScrollToTop(): null {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    try {
      if (hash) {
        const id = hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return null;
        }
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (e) {
      // ignore in non-browser environments
    }
    return null;
  }, [pathname, hash]);

  return null;
}
