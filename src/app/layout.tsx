import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title =
  "Sitovai — find local businesses without a website & build them one with AI";
const description =
  "Sitovai finds local businesses with no website via Google Places and builds them ready-to-launch AI websites in their own language — all from one dashboard.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "Sitovai",
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
  authors: [{ name: "Sitovai" }],
  creator: "Sitovai",
  category: "business software",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Sitovai",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
