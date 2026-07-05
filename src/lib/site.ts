// Canonical public site URL, resolved once for metadata / robots / sitemap.
// On Vercel, VERCEL_PROJECT_PRODUCTION_URL is the stable production domain and
// auto-updates when a custom domain is attached, so SEO tags follow the domain
// without a code change. NEXT_PUBLIC_SITE_URL can override; localhost for dev.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
