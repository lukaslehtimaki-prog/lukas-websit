import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "./client";
import { env } from "@/lib/env";
import type { BusinessInfo, SiteContent } from "@/lib/templates/types";

// Generates Finnish website copy from real business data using Claude (Sonnet by default).
// The contact block is filled from REAL Places/registry data — only the prose is AI-written.

const CONTENT_TOOL: Anthropic.Tool = {
  name: "build_website_content",
  description:
    "Produce website copy (in Finnish) for a local small business, tailored to its type.",
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
      ctaText: { type: "string", description: "Call-to-action button text" },
    },
    required: [
      "tagline",
      "heroHeading",
      "heroSubtext",
      "about",
      "services",
      "highlights",
      "ctaText",
    ],
  },
};

function buildPrompt(info: BusinessInfo): string {
  return [
    `Business name: ${info.name}`,
    info.category ? `Category: ${info.category}` : "",
    info.industryLabel ? `Registry industry: ${info.industryLabel}` : "",
    info.location || info.address
      ? `Location: ${info.location ?? info.address}`
      : "",
    "",
    "Write warm, professional, conversion-focused website copy in FINNISH for this local",
    "small business. Be specific to the business type — no generic filler. Provide 3–5",
    "concrete services with short descriptions and 4 short 'why choose us' highlights.",
  ]
    .filter(Boolean)
    .join("\n");
}

function assemble(info: BusinessInfo, ai: Partial<SiteContent>): SiteContent {
  return {
    businessName: info.name,
    tagline: ai.tagline ?? info.category ?? "",
    heroHeading: ai.heroHeading ?? info.name,
    heroSubtext: ai.heroSubtext ?? "",
    about: ai.about ?? "",
    services: Array.isArray(ai.services) ? ai.services.slice(0, 6) : [],
    highlights: Array.isArray(ai.highlights) ? ai.highlights.slice(0, 6) : [],
    ctaText: ai.ctaText ?? "Ota yhteyttä",
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
  return assemble(info, {
    tagline: info.category ?? "",
    heroHeading: info.name,
    heroSubtext: [info.category, info.location].filter(Boolean).join(" · "),
    about: `${info.name} on paikallinen yritys${
      info.location ? ` alueella ${info.location}` : ""
    }. Ota yhteyttä, niin kerromme lisää.`,
    services: [],
    highlights: [],
    ctaText: "Ota yhteyttä",
  });
}

export async function generateWebsiteContent(
  info: BusinessInfo,
): Promise<SiteContent> {
  const client = getAnthropic();
  const msg = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 1600,
    tools: [CONTENT_TOOL],
    tool_choice: { type: "tool", name: CONTENT_TOOL.name },
    messages: [{ role: "user", content: buildPrompt(info) }],
  });

  const block = msg.content.find((b) => b.type === "tool_use");
  const ai =
    block && block.type === "tool_use"
      ? (block.input as Partial<SiteContent>)
      : {};
  return assemble(info, ai);
}
