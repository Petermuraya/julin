import { useEffect, useState } from "react";

export default function AdminTopProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      setProgress(pct);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="absolute left-0 top-0 right-0 h-0 pointer-events-none">
      <div
        className="h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 transition-width duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
