import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { siteUrl } from "@/lib/site";
import { PLAN_LIMITS } from "@/lib/plans";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const title =
  "Sitagio — find local businesses without a website & build them one with AI";
const description =
  "Sitagio finds local businesses with no website via Google Places and builds them ready-to-launch AI websites in their own language — all from one dashboard.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "Sitagio",
  keywords: [
    "lead generation",
    "local businesses",
    "no website leads",
    "AI website builder",
    "business registry",
    "Google Places leads",
    "local business outreach",
    "freelancer tools",
    "agency lead finder",
  ],
  authors: [{ name: "Sitagio" }],
  creator: "Sitagio",
  category: "business software",
  openGraph: {
    type: "website",
    siteName: "Sitagio",
    title,
    description,
    url: siteUrl,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/**
 * Organization + SoftwareApplication structured data, emitted once from the
 * root layout so every public page carries it.
 *
 * Prices are read from PLAN_LIMITS (src/lib/plans.ts), the same source the
 * pricing section renders from, so schema can never drift from the page.
 * No LocalBusiness and no street address: Sitagio sells software remotely.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Sitovai Agency",
      legalName: "Sitovai Agency",
      url: siteUrl,
      logo: `${siteUrl}/icon-512.png`,
      email: "support@sitovaiagency.com",
      vatID: "3638129-8",
      taxID: "3638129-8",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Helsinki",
        addressCountry: "FI",
      },
      sameAs: [],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      name: "Sitagio",
      url: siteUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description,
      publisher: { "@id": `${siteUrl}/#organization` },
      offers: [
        {
          "@type": "Offer",
          name: PLAN_LIMITS.pro.label,
          price: String(PLAN_LIMITS.pro.priceCents / 100),
          priceCurrency: "EUR",
          url: `${siteUrl}/signup?plan=pro`,
        },
        {
          "@type": "Offer",
          name: PLAN_LIMITS.premium.label,
          price: String(PLAN_LIMITS.premium.priceCents / 100),
          priceCurrency: "EUR",
          url: `${siteUrl}/signup?plan=premium`,
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Keyboard users must be able to jump the header nav on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-[#05060a] focus:shadow-lg"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
