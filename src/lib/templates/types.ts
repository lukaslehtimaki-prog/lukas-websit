// Shared content + template types for the AI website builder.

export type SiteService = { title: string; description: string };

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
