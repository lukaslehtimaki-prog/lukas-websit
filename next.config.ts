import type { NextConfig } from "next";

// Baseline security headers for every response.
const securityHeaders = [
  // Browsers must not MIME-sniff responses into executable types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nothing in the product is meant to be framed. The site editor's live
  // previews use srcdoc iframes, which are not network responses and are
  // therefore unaffected by this (verified against a real browser).
  { key: "X-Frame-Options", value: "DENY" },
  // Don't leak full URLs (which include site/lead ids) to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app never needs these browser capabilities.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Vercel sends HSTS too, but assert it in code so it survives a host change.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  /* Content-Security-Policy.
     `default-src` is deliberately permissive: /s/[id] and /r/[id] emit whole
     standalone documents with inline <style> and inline <script>, and the app
     itself ships Next's inline bootstrap. A strict script-src here would need
     a nonce rollout through the proxy and would take the product offline
     before it protected it. What this policy does buy, at zero compatibility
     risk, are the four directives that break real attacks outright:
       frame-ancestors 'none' — clickjacking
       object-src 'none'      — plugin-based XSS
       base-uri 'self'        — <base> injection hijacking every relative URL
       form-action 'self'     — form-target hijacking / credential exfil
     Follow-up: a full script-src CSP once a nonce rollout is planned. */
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
