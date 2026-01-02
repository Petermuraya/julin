import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.scrollTo) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      }
    } catch {
      // ignore
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
