import React from "react";

export const Spinner = ({ size = 36 }: { size?: number }) => (
  <div
    role="status"
    aria-live="polite"
    className="inline-flex items-center justify-center"
    style={{ width: size, height: size }}
  >
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="var(--muted-foreground, #e5e7eb)" strokeWidth="4" />
      <path d="M22 12a10 10 0 00-10-10" stroke="var(--primary, #0369a1)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  </div>
);

export default Spinner;
