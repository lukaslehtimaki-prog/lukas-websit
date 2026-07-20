import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "./client";
import { env } from "@/lib/env";
import {
  DEFAULT_SECTION_ORDER,
  type SiteContent,
  type SectionId,
  type SiteKind,
} from "@/lib/templates/types";

// Conversational editor: the user describes a change in plain language and
// Claude returns a structured patch of only the fields that change. Applied
// over the current content — no full regeneration, so manual edits survive.

const SECTION_IDS = new Set<string>(DEFAULT_SECTION_ORDER);
const KINDS = new Set<string>(["standard", "booking", "membership"]);

const EDIT_TOOL: Anthropic.Tool = {
  name: "apply_website_edits",
  description:
    "Apply the requested edits to a small-business website. Return ONLY the fields that should change; omit everything that stays the same.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description:
          "One short sentence describing what you changed, in the site's language.",
      },
      businessName: { type: "string" },
      tagline: { type: "string" },
      heroHeading: { type: "string" },
      heroSubtext: { type: "string" },
      about: { type: "string" },
      ctaText: { type: "string" },
      announcement: {
        type: "string",
        description: "Top promo-bar text. Empty string hides the bar.",
      },
      accent: {
        type: "string",
        description:
          "Brand colour — a hex like #0e7c5a or a common name like green. Empty string resets it.",
      },
      services: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            price: { type: "string" },
          },
          required: ["title", "description"],
        },
      },
      highlights: { type: "array", items: { type: "string" } },
      stats: {
        type: "array",
        items: {
          type: "object",
          properties: {
            value: { type: "string" },
            label: { type: "string" },
          },
          required: ["value", "label"],
        },
      },
      faq: {
        type: "array",
        items: {
          type: "object",
          properties: { q: { type: "string" }, a: { type: "string" } },
          required: ["q", "a"],
        },
      },
      team: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            role: { type: "string" },
          },
          required: ["name", "role"],
        },
      },
      offer: {
        type: "object",
        description: "Special-offer band. Set removeOffer:true to remove it.",
        properties: {
          title: { type: "string" },
          text: { type: "string" },
          code: { type: "string" },
        },
      },
      removeOffer: { type: "boolean" },
      socials: {
        type: "array",
        items: {
          type: "object",
          properties: {
            platform: {
              type: "string",
              enum: [
                "facebook",
                "instagram",
                "tiktok",
                "youtube",
                "linkedin",
                "whatsapp",
              ],
            },
            url: { type: "string" },
          },
          required: ["platform", "url"],
        },
      },
      kind: {
        type: "string",
        enum: ["standard", "booking", "membership"],
        description:
          "standard, booking (adds a booking form), or membership (adds pricing tiers).",
      },
      membershipPlans: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            price: { type: "string" },
            period: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            highlight: { type: "boolean" },
          },
          required: ["name", "price", "period", "features"],
        },
      },
      sectionOrder: {
        type: "array",
        items: { type: "string" },
        description: `Order of sections. Valid ids: ${DEFAULT_SECTION_ORDER.join(", ")}.`,
      },
      hiddenSections: {
        type: "array",
        items: { type: "string" },
        description: "Section ids to hide.",
      },
      heroImage: {
        type: "string",
        description:
          "Main image — MUST be one of the provided existing image URLs.",
      },
      gallery: {
        type: "array",
        items: { type: "string" },
        description:
          "Gallery images in the desired order — only URLs from the provided existing images.",
      },
    },
    required: ["summary"],
  },
};

type EditInput = Record<string, unknown>;

// The model sometimes returns a colour name instead of hex; map common ones so
// "make it green" works. Unknown non-hex values are ignored (accent unchanged).
const NAMED_COLORS: Record<string, string> = {
  red: "#dc2626", orange: "#ea580c", amber: "#d97706", yellow: "#ca8a04",
  gold: "#b8860b", lime: "#65a30d", green: "#16a34a", emerald: "#059669",
  teal: "#0d9488", cyan: "#0891b2", sky: "#0284c7", blue: "#2563eb",
  indigo: "#4f46e5", violet: "#7c3aed", purple: "#9333ea", magenta: "#c026d3",
  pink: "#db2777", rose: "#e11d48", maroon: "#9f1239", brown: "#92400e",
  navy: "#1e3a8a", black: "#111827", slate: "#475569", gray: "#4b5563",
  grey: "#4b5563",
};

function resolveAccent(input: string): string | null {
  const v = input.trim().toLowerCase();
  if (!v) return null;
  if (/^#?[0-9a-f]{3}$|^#?[0-9a-f]{6}$/.test(v))
    return v.startsWith("#") ? v : `#${v}`;
  return NAMED_COLORS[v] ?? null;
}

export type SiteEditResult = { content: SiteContent; summary: string };

export async function editSiteContentAI(
  content: SiteContent,
  instruction: string,
): Promise<SiteEditResult> {
  const knownImages = new Set(
    [content.heroImage, ...(content.gallery ?? [])].filter(Boolean) as string[],
  );

  const current = {
    businessName: content.businessName,
    tagline: content.tagline,
    heroHeading: content.heroHeading,
    heroSubtext: content.heroSubtext,
    about: content.about,
    ctaText: content.ctaText,
    announcement: content.announcement ?? "",
    accent: content.accent ?? "",
    services: content.services ?? [],
    highlights: content.highlights ?? [],
    stats: content.stats ?? [],
    faq: content.faq ?? [],
    team: content.team ?? [],
    offer: content.offer ?? null,
    socials: content.socials ?? [],
    kind: content.kind ?? "standard",
    membershipPlans: content.membershipPlans ?? [],
    sectionOrder: content.sectionOrder ?? DEFAULT_SECTION_ORDER,
    hiddenSections: content.hiddenSections ?? [],
    heroImage: content.heroImage ?? null,
    gallery: content.gallery ?? [],
  };

  const client = getAnthropic();
  const msg = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 3000,
    tools: [EDIT_TOOL],
    tool_choice: { type: "tool", name: EDIT_TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          "You are editing a local small-business website. Apply the user's",
          "requested change and return ONLY the fields that change via the tool.",
          "Keep the site's existing language. Never invent fake prices, phone",
          "numbers, reviews or statistics. For image changes, only use URLs from",
          "the EXISTING IMAGES list — never invent image URLs.",
          "",
          "CURRENT CONTENT (JSON):",
          JSON.stringify(current),
          "",
          `EXISTING IMAGES: ${JSON.stringify([...knownImages])}`,
          "",
          `USER REQUEST: ${instruction}`,
        ].join("\n"),
      },
    ],
  });

  const block = msg.content.find((b) => b.type === "tool_use");
  const out: EditInput =
    block && block.type === "tool_use" ? (block.input as EditInput) : {};

  return { content: applyPatch(content, out, knownImages), summary: summaryOf(out) };
}

function summaryOf(out: EditInput): string {
  const s = typeof out.summary === "string" ? out.summary.trim() : "";
  return s || "Applied your changes.";
}

/** Merge only recognised, validated fields from the AI patch over the content. */
function applyPatch(
  content: SiteContent,
  out: EditInput,
  knownImages: Set<string>,
): SiteContent {
  const next: SiteContent = { ...content };
  const str = (k: string) => (typeof out[k] === "string" ? (out[k] as string) : undefined);

  const bn = str("businessName");
  if (bn) next.businessName = bn;
  const tag = str("tagline");
  if (tag !== undefined) next.tagline = tag;
  const hh = str("heroHeading");
  if (hh) next.heroHeading = hh;
  const hs = str("heroSubtext");
  if (hs !== undefined) next.heroSubtext = hs;
  const ab = str("about");
  if (ab !== undefined) next.about = ab;
  const cta = str("ctaText");
  if (cta) next.ctaText = cta;

  const ann = str("announcement");
  if (ann !== undefined) next.announcement = ann.trim() || null;
  const accent = str("accent");
  if (accent !== undefined) {
    if (!accent.trim()) next.accent = null; // explicit reset
    else {
      const resolved = resolveAccent(accent);
      if (resolved) next.accent = resolved; // leave unchanged if unrecognised
    }
  }

  if (Array.isArray(out.services))
    next.services = (out.services as SiteContent["services"])
      .filter((s) => s && s.title)
      .slice(0, 12);
  if (Array.isArray(out.highlights))
    next.highlights = (out.highlights as string[])
      .filter((h) => typeof h === "string" && h.trim())
      .slice(0, 8);
  if (Array.isArray(out.stats))
    next.stats = (out.stats as NonNullable<SiteContent["stats"]>)
      .filter((s) => s && s.value && s.label)
      .slice(0, 4);
  if (Array.isArray(out.faq))
    next.faq = (out.faq as NonNullable<SiteContent["faq"]>)
      .filter((f) => f && f.q && f.a)
      .slice(0, 8);
  if (Array.isArray(out.team))
    next.team = (out.team as NonNullable<SiteContent["team"]>)
      .filter((m) => m && m.name)
      .slice(0, 12);
  if (Array.isArray(out.socials))
    next.socials = (out.socials as NonNullable<SiteContent["socials"]>)
      .filter((s) => s && s.platform && s.url)
      .slice(0, 6);
  if (Array.isArray(out.membershipPlans))
    next.membershipPlans = (
      out.membershipPlans as NonNullable<SiteContent["membershipPlans"]>
    )
      .filter((p) => p && p.name)
      .slice(0, 4);

  if (out.removeOffer === true) next.offer = null;
  else if (out.offer && typeof out.offer === "object") {
    const o = out.offer as { title?: string; text?: string; code?: string };
    if (o.title || o.text)
      next.offer = {
        title: o.title ?? "",
        text: o.text ?? "",
        ...(o.code ? { code: o.code } : {}),
      };
  }

  const kind = str("kind");
  if (kind && KINDS.has(kind)) next.kind = kind as SiteKind;

  if (Array.isArray(out.sectionOrder)) {
    const order = (out.sectionOrder as string[]).filter((id) =>
      SECTION_IDS.has(id),
    ) as SectionId[];
    if (order.length) next.sectionOrder = order;
  }
  if (Array.isArray(out.hiddenSections))
    next.hiddenSections = (out.hiddenSections as string[]).filter((id) =>
      SECTION_IDS.has(id),
    ) as SectionId[];

  // Images: never accept invented URLs — only ones already on the site.
  const hero = str("heroImage");
  if (hero && knownImages.has(hero)) next.heroImage = hero;
  if (Array.isArray(out.gallery)) {
    const g = (out.gallery as string[]).filter((u) => knownImages.has(u));
    next.gallery = g;
  }

  return next;
}
