import React from "react";

/**
 * Sitagio brand mark — a browser window (the website builder) filled with the
 * indigo→violet→cyan gradient. Server-safe (no hooks); the gradient id is
 * static because every instance renders the same gradient, so a shared def is
 * fine. Full-bleed 32×32 so it reads at favicon size and existing rounded/
 * shadow utility classes still line up with the tile.
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
          id="sitagio-mark"
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
      <rect width="32" height="32" rx="8" fill="url(#sitagio-mark)" />
      {/* browser toolbar dots + divider */}
      <circle cx="6.5" cy="6" r="1.15" fill="#fff" fillOpacity=".9" />
      <circle cx="10" cy="6" r="1.15" fill="#fff" fillOpacity=".9" />
      <circle cx="13.5" cy="6" r="1.15" fill="#fff" fillOpacity=".9" />
      <rect x="0" y="9.2" width="32" height="0.9" fill="#fff" fillOpacity=".12" />
      {/* page layout */}
      <rect x="6" y="13.5" width="20" height="5" rx="1.6" fill="#fff" fillOpacity=".9" />
      <rect x="6" y="21.5" width="14" height="2.6" rx="1.3" fill="#fff" fillOpacity=".5" />
      <rect x="6" y="26" width="9" height="2.6" rx="1.3" fill="#fff" fillOpacity=".38" />
    </svg>
  );
}

/**
 * Sitagio wordmark — plain text, no colour-split trick (the old "Sitov" +
 * cyan "AI" treatment only worked because the name ended in "ai"; Sitagio
 * doesn't, and this product's whole brief is calm/unshouty, so a plain
 * wordmark fits better than forcing a new gimmick). Renders as a single
 * inline element inheriting font/size/weight from the parent. Drop in next
 * to <BrandMark/> where the logo lockup appears.
 */
export function Wordmark({ className }: { className?: string }) {
  return <span className={className}>Sitagio</span>;
}

export default BrandMark;
