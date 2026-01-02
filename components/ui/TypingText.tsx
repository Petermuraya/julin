import { useEffect, useState } from "react";

interface TypingTextProps {
  text: string;
  speed?: number; // ms per character
  className?: string;
  cursor?: boolean;
}

export default function TypingText({ text, speed = 40, className = "", cursor = true }: TypingTextProps) {
  const [visible, setVisible] = useState("");

  useEffect(() => {
    let i = 0;
    setVisible("");
    const id = setInterval(() => {
      setVisible((prev) => prev + text.charAt(i));
      i += 1;
      if (i >= text.length) {
        clearInterval(id);
      }
    }, speed);

    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <span className={className} aria-label={text}>
      {visible}
      {cursor && (
        <span aria-hidden="true" className="inline-block ml-1 w-[0.6ch] align-middle animate-blink">
          |
        </span>
      )}
    </span>
  );
}
