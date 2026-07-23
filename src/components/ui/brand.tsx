import React from "react";

/**
 * Sitovai brand mark — a location pin (find local businesses) inside the
 * indigo→violet→cyan tile. Server-safe (no hooks); the gradient id is static
 * because every instance renders the same gradient, so a shared def is fine.
 */
export function BrandMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="sitovai-mark"
          x1="4"
          y1="3"
          x2="28"
          y2="29"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6366f1" />
          <stop offset=".5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#sitovai-mark)" />
      <path
        fill="#fff"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 6.5c-4.3 0-7.8 3.4-7.8 7.6 0 5.4 6.7 10.8 7.3 11.3l.5.4.5-.4c.6-.5 7.3-5.9 7.3-11.3 0-4.2-3.5-7.6-7.8-7.6Zm0 10.4a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Z"
      />
    </svg>
  );
}

export default BrandMark;
