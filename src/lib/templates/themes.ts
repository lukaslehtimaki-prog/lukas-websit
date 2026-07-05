import type { SiteContent, TemplateId } from "./types";

// A "theme" is a complete visual identity — palette, type pairing, hero layout, and
// card treatment. Each generated site is assigned one deterministically (by a hash of
// the business name, biased to the chosen category), so two businesses in the same
// category get genuinely different-looking sites instead of a recoloured clone.

export type HeroStyle = "left" | "center" | "split";
export type CardStyle = "border" | "shadow" | "filled";

export type Theme = {
  id: string;
  categories: TemplateId[];
  accent: string;
  accent2: string;
  ink: string;
  muted: string;
  bg: string;
  surface: string;
  border: string;
  heroBg: string;
  heroText: string;
  heroMuted: string;
  onAccent: string;
  headingFont: string;
  bodyFont: string;
  googleFonts: string;
  radius: number;
  heroStyle: HeroStyle;
  cardStyle: CardStyle;
};

const gf = (families: string) =>
  `https://fonts.googleapis.com/css2?${families}&display=swap`;

export const THEMES: Theme[] = [
  // ---- Salon / beauty (elegant, refined) ----
  {
    id: "noir",
    categories: ["salon", "hospitality"],
    accent: "#b76e79",
    accent2: "#d8a7b1",
    ink: "#211b1e",
    muted: "#6b5f63",
    bg: "#faf7f5",
    surface: "#f3ebe9",
    border: "#e7dcd9",
    heroBg: "linear-gradient(135deg, #17131a, #2a1f28)",
    heroText: "#fdf7f5",
    heroMuted: "#d9c7cd",
    onAccent: "#ffffff",
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    googleFonts: gf(
      "family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600",
    ),
    radius: 4,
    heroStyle: "split",
    cardStyle: "shadow",
  },
  {
    id: "blush",
    categories: ["salon"],
    accent: "#d6336c",
    accent2: "#f06595",
    ink: "#2b1a22",
    muted: "#7a5c67",
    bg: "#ffffff",
    surface: "#fff5f8",
    border: "#f6dfe8",
    heroBg: "linear-gradient(135deg, #fff0f5, #ffe3ee)",
    heroText: "#2b1a22",
    heroMuted: "#7a5c67",
    onAccent: "#ffffff",
    headingFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Montserrat', system-ui, sans-serif",
    googleFonts: gf(
      "family=Cormorant+Garamond:wght@600;700&family=Montserrat:wght@400;500;600",
    ),
    radius: 20,
    heroStyle: "center",
    cardStyle: "filled",
  },
  {
    id: "sage",
    categories: ["salon", "trades"],
    accent: "#5f7a5f",
    accent2: "#86a586",
    ink: "#1f251f",
    muted: "#5c665c",
    bg: "#f7f9f6",
    surface: "#eef3ec",
    border: "#dde6da",
    heroBg: "linear-gradient(135deg, #eef3ec, #e2ebdf)",
    heroText: "#1f251f",
    heroMuted: "#5c665c",
    onAccent: "#ffffff",
    headingFont: "'Fraunces', Georgia, serif",
    bodyFont: "'Nunito Sans', system-ui, sans-serif",
    googleFonts: gf(
      "family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Nunito+Sans:wght@400;600;700",
    ),
    radius: 14,
    heroStyle: "left",
    cardStyle: "border",
  },
  // ---- Trades / services (strong, clean, trustworthy) ----
  {
    id: "steel",
    categories: ["trades"],
    accent: "#2563eb",
    accent2: "#3b82f6",
    ink: "#111827",
    muted: "#4b5563",
    bg: "#ffffff",
    surface: "#f1f5f9",
    border: "#e2e8f0",
    heroBg: "linear-gradient(135deg, #eff5ff, #e3edfd)",
    heroText: "#0b1220",
    heroMuted: "#475569",
    onAccent: "#ffffff",
    headingFont: "'Space Grotesk', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    googleFonts: gf(
      "family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600",
    ),
    radius: 8,
    heroStyle: "split",
    cardStyle: "shadow",
  },
  {
    id: "industrial",
    categories: ["trades", "hospitality"],
    accent: "#ea580c",
    accent2: "#fb923c",
    ink: "#1c1917",
    muted: "#57534e",
    bg: "#fafaf9",
    surface: "#f5f5f4",
    border: "#e7e5e4",
    heroBg: "linear-gradient(135deg, #1c1917, #292420)",
    heroText: "#fafaf9",
    heroMuted: "#d6cfc8",
    onAccent: "#ffffff",
    headingFont: "'Archivo', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    googleFonts: gf("family=Archivo:wght@600;800&family=Inter:wght@400;500;600"),
    radius: 6,
    heroStyle: "center",
    cardStyle: "filled",
  },
  {
    id: "forest",
    categories: ["trades"],
    accent: "#15803d",
    accent2: "#22c55e",
    ink: "#14231a",
    muted: "#4b5f52",
    bg: "#ffffff",
    surface: "#f0fdf4",
    border: "#d7efe0",
    heroBg: "linear-gradient(135deg, #ecfdf3, #dcfce7)",
    heroText: "#0f2318",
    heroMuted: "#43604e",
    onAccent: "#ffffff",
    headingFont: "'Manrope', system-ui, sans-serif",
    bodyFont: "'Manrope', system-ui, sans-serif",
    googleFonts: gf("family=Manrope:wght@400;600;800"),
    radius: 12,
    heroStyle: "left",
    cardStyle: "border",
  },
  {
    id: "slate",
    categories: ["trades", "salon"],
    accent: "#0f766e",
    accent2: "#14b8a6",
    ink: "#0f1c1b",
    muted: "#4b5b5a",
    bg: "#ffffff",
    surface: "#f0fdfa",
    border: "#dceeec",
    heroBg: "linear-gradient(135deg, #effcfa, #ddf6f3)",
    heroText: "#0b1a19",
    heroMuted: "#456260",
    onAccent: "#ffffff",
    headingFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    googleFonts: gf("family=Inter:wght@400;500;600;800"),
    radius: 12,
    heroStyle: "left",
    cardStyle: "shadow",
  },
  // ---- Hospitality (warm, appetizing) ----
  {
    id: "terracotta",
    categories: ["hospitality", "trades"],
    accent: "#c2410c",
    accent2: "#ea580c",
    ink: "#26160f",
    muted: "#6f574c",
    bg: "#fffaf5",
    surface: "#fdf1e7",
    border: "#f3e1d2",
    heroBg: "linear-gradient(135deg, #fdefe2, #f9ddc7)",
    heroText: "#26160f",
    heroMuted: "#6f574c",
    onAccent: "#ffffff",
    headingFont: "'Fraunces', Georgia, serif",
    bodyFont: "'Karla', system-ui, sans-serif",
    googleFonts: gf(
      "family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Karla:wght@400;600;700",
    ),
    radius: 16,
    heroStyle: "split",
    cardStyle: "filled",
  },
  {
    id: "bordeaux",
    categories: ["hospitality"],
    accent: "#9f1239",
    accent2: "#be123c",
    ink: "#241017",
    muted: "#6f5259",
    bg: "#fdf9f9",
    surface: "#f6eaec",
    border: "#ecd6da",
    heroBg: "linear-gradient(135deg, #1a1113, #2c1a1f)",
    heroText: "#fdf4f5",
    heroMuted: "#dcc3c8",
    onAccent: "#ffffff",
    headingFont: "'DM Serif Display', Georgia, serif",
    bodyFont: "'DM Sans', system-ui, sans-serif",
    googleFonts: gf(
      "family=DM+Serif+Display&family=DM+Sans:wght@400;500;700",
    ),
    radius: 4,
    heroStyle: "center",
    cardStyle: "shadow",
  },
  {
    id: "honey",
    categories: ["hospitality", "salon"],
    accent: "#b45309",
    accent2: "#d97706",
    ink: "#271c0e",
    muted: "#6d5c44",
    bg: "#fffbeb",
    surface: "#fef3c7",
    border: "#f3e6bf",
    heroBg: "linear-gradient(135deg, #fff7e0, #fdecc0)",
    heroText: "#271c0e",
    heroMuted: "#6d5c44",
    onAccent: "#ffffff",
    headingFont: "'Fraunces', Georgia, serif",
    bodyFont: "'DM Sans', system-ui, sans-serif",
    googleFonts: gf(
      "family=Fraunces:opsz,wght@9..144,500;9..144,600&family=DM+Sans:wght@400;500;700",
    ),
    radius: 18,
    heroStyle: "left",
    cardStyle: "border",
  },
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const CATEGORIES: TemplateId[] = ["salon", "trades", "hospitality"];

/**
 * Deterministically resolve a theme for a site: filter to themes appropriate for the
 * chosen category, then index by `designSeed` (set by the Shuffle button) or a hash of
 * the business name. Same input → same theme; different businesses → different themes.
 */
export function pickTheme(content: SiteContent, templateId: string): Theme {
  const category = (CATEGORIES.includes(templateId as TemplateId)
    ? templateId
    : "trades") as TemplateId;
  const pool = THEMES.filter((t) => t.categories.includes(category));
  const list = pool.length ? pool : THEMES;
  const seed =
    content.designSeed ??
    hashStr(content.businessName || content.source?.name || "site");
  return list[seed % list.length];
}
