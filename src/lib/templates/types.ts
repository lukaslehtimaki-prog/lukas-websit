// Shared content + template types for the AI website builder.

export type SiteService = { title: string; description: string };

export type SiteReview = {
  author: string;
  rating: number; // 1–5
  text: string;
  relativeTime: string | null; // e.g. "2 months ago"
};

/** Drives which extra section a generated site gets. */
export type SiteKind = "standard" | "booking" | "membership";

export type MembershipPlan = {
  name: string;
  price: string; // e.g. "29,90 €"
  period: string; // e.g. "/kk"
  features: string[];
  highlight?: boolean;
};

export type BusinessInfo = {
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  hours: string[] | null;
  website: string | null;
  location: string | null;
  businessId: string | null;
  industryLabel: string | null;
};

export type SiteContent = {
  businessName: string;
  tagline: string;
  heroHeading: string;
  heroSubtext: string;
  about: string;
  services: SiteService[];
  highlights: string[];
  ctaText: string;
  contact: {
    address: string | null;
    phone: string | null;
    email: string | null;
    hours: string[] | null;
    mapsQuery: string | null;
  };
  /** Real Google reviews to show as testimonials (optional). */
  reviews?: SiteReview[];
  /** Business type → extra section (booking form for salons, pricing for gyms). */
  kind?: SiteKind;
  /** Membership tiers, shown when kind is "membership". */
  membershipPlans?: MembershipPlan[];
  /** Public URL of the hero image (optional). */
  heroImage?: string | null;
  /** Public URLs of gallery images (optional). */
  gallery?: string[];
  /** Seed to reroll the visual design; when unset a hash of the name is used. */
  designSeed?: number;
  /** Original business data, kept so AI copy can be regenerated later. */
  source?: BusinessInfo;
};

export type TemplateId = "salon" | "trades" | "hospitality";

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
  accent: string;
  font: string;
};

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "salon",
    name: "Salon & Beauty",
    description: "Barbershops, hairdressers, beauty & wellness.",
    accent: "#7c3aed",
    font: "'Georgia', 'Times New Roman', serif",
  },
  {
    id: "trades",
    name: "Trades & Services",
    description: "Contractors, cleaning, gyms, professional services.",
    accent: "#0ea5e9",
    font: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  {
    id: "hospitality",
    name: "Restaurant & Café",
    description: "Restaurants, cafés, bakeries, local food.",
    accent: "#e11d48",
    font: "'Georgia', 'Iowan Old Style', serif",
  },
];

export function templateMeta(id: string): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
