import { useEffect, useRef, useState } from "react";

type Options = IntersectionObserverInit;

export function useInView<T extends HTMLElement = HTMLElement>(options?: Options) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            // once visible, we can unobserve for simple reveal behavior
            try { obs.unobserve(entry.target); } catch (e) {}
          }
        });
      },
      options || { threshold: 0.15 }
    );

    obs.observe(node as Element);

    return () => obs.disconnect();
  }, [ref, options]);

  return { ref, inView } as const;
}

export default useInView;
