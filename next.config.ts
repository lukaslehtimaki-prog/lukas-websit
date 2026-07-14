import type { NextConfig } from "next";

// Baseline security headers for every response. HSTS is added by Vercel.
const securityHeaders = [
  // Browsers must not MIME-sniff responses into executable types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The app has no legitimate cross-origin embedder (editor preview uses srcdoc).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Don't leak full URLs (which include site/lead ids) to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app never needs these browser capabilities.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
