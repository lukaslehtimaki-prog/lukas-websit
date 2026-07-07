import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "./client";
import { env } from "@/lib/env";
import { LANGUAGE_NAMES, t } from "@/lib/templates/i18n";
import type { BusinessInfo, SiteContent, Vibe } from "@/lib/templates/types";

// Generates website copy in the business's own language using Claude. The contact
// block is filled from REAL Places/registry data — only the prose is AI-written.

const VIBES: Vibe[] = ["elegant", "bold", "warm", "minimal", "fresh", "luxury"];

const CONTENT_TOOL: Anthropic.Tool = {
  name: "build_website_content",
  description:
    "Produce website copy for a local small business, tailored to its type, in the requested language.",
  input_schema: {
    type: "object",
    properties: {
      tagline: { type: "string", description: "Short uppercase-style tagline" },
      heroHeading: { type: "string", description: "Punchy hero headline" },
      heroSubtext: { type: "string", description: "1–2 sentence hero subtext" },
      about: { type: "string", description: "A warm 'about us' paragraph" },
      services: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
          },
          required: ["title", "description"],
        },
        description: "3–5 services with short descriptions",
      },
      highlights: {
        type: "array",
        items: { type: "string" },
        description: "4 short 'why choose us' points",
      },
      stats: {
        type: "array",
        items: {
          type: "object",
          properties: {
            value: { type: "string", description: "Short figure, e.g. '100 %'" },
            label: { type: "string", description: "What the figure means" },
          },
          required: ["value", "label"],
        },
        description:
          "3–4 short trust points. NEVER invent unverifiable numbers (no fake customer counts or years). Use safe generic facts like local ownership, free quotes, guarantees.",
      },
      faq: {
        type: "array",
        items: {
          type: "object",
          properties: {
            q: { type: "string" },
            a: { type: "string" },
          },
          required: ["q", "a"],
        },
        description:
          "3–4 frequently asked questions with helpful 1–2 sentence answers, realistic for this business type. No invented facts (prices, exact policies).",
      },
      vibe: {
        type: "string",
        enum: VIBES,
        description: "The design mood that best fits this business",
      },
      ctaText: { type: "string", description: "Call-to-action button text" },
    },
    required: [
      "tagline",
      "heroHeading",
      "heroSubtext",
      "about",
      "services",
      "highlights",
      "stats",
      "faq",
      "vibe",
      "ctaText",
    ],
  },
};

function languageName(code: string | undefined): string {
  return LANGUAGE_NAMES[(code ?? "en").toLowerCase()] ?? "English";
}

function buildPrompt(info: BusinessInfo, language: string): string {
  return [
    `Business name: ${info.name}`,
    info.category ? `Category: ${info.category}` : "",
    info.industryLabel ? `Registry industry: ${info.industryLabel}` : "",
    info.location || info.address
      ? `Location: ${info.location ?? info.address}`
      : "",
    "",
    `Write warm, professional, conversion-focused website copy ENTIRELY IN ${languageName(
      language,
    ).toUpperCase()} for this local small business. Be specific to the business`,
    "type — no generic filler. Provide 3–5 concrete services with short descriptions,",
    "4 short 'why choose us' highlights, 3–4 safe trust stats (no invented numbers),",
    "and 3–4 realistic FAQ entries. Also pick the design vibe that best fits.",
  ]
    .filter(Boolean)
    .join("\n");
}

function assemble(
  info: BusinessInfo,
  ai: Partial<SiteContent>,
  language: string,
): SiteContent {
  const s = t(language);
  return {
    businessName: info.name,
    language,
    tagline: ai.tagline ?? info.category ?? "",
    heroHeading: ai.heroHeading ?? info.name,
    heroSubtext: ai.heroSubtext ?? "",
    about: ai.about ?? "",
    services: Array.isArray(ai.services) ? ai.services.slice(0, 6) : [],
    highlights: Array.isArray(ai.highlights) ? ai.highlights.slice(0, 6) : [],
    stats: Array.isArray(ai.stats) ? ai.stats.slice(0, 4) : [],
    faq: Array.isArray(ai.faq) ? ai.faq.slice(0, 6) : [],
    vibe: VIBES.includes(ai.vibe as Vibe) ? (ai.vibe as Vibe) : undefined,
    ctaText: ai.ctaText ?? s.navContact,
    contact: {
      address: info.address,
      phone: info.phone,
      email: info.email,
      hours: info.hours,
      mapsQuery: info.address ?? info.name,
    },
    source: info,
  };
}

/** Reasonable non-AI content so the builder still works without an Anthropic key. */
export function fallbackContent(info: BusinessInfo): SiteContent {
  const language = info.language ?? "en";
  const s = t(language);
  return assemble(
    info,
    {
      tagline: info.category ?? "",
      heroHeading: info.name,
      heroSubtext: [info.category, info.location].filter(Boolean).join(" · "),
      about: info.name,
      services: [],
      highlights: [],
      stats: [],
      faq: [],
      ctaText: s.navContact,
    },
    language,
  );
}

export async function generateWebsiteContent(
  info: BusinessInfo,
  languageOverride?: string,
): Promise<SiteContent> {
  const language = (languageOverride ?? info.language ?? "en").toLowerCase();
  const client = getAnthropic();
  const msg = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 2400,
    tools: [CONTENT_TOOL],
    tool_choice: { type: "tool", name: CONTENT_TOOL.name },
    messages: [{ role: "user", content: buildPrompt(info, language) }],
  });

  const block = msg.content.find((b) => b.type === "tool_use");
  const ai =
    block && block.type === "tool_use"
      ? (block.input as Partial<SiteContent>)
      : {};
  return assemble(info, ai, language);
}
