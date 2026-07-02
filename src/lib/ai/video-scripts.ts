import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "./client";
import { env } from "@/lib/env";
import { toneLabel } from "@/lib/video/avatars";

// Generates short-form sales scripts for AI avatar videos from a product brief using
// Claude (Sonnet by default). One call produces N variations with distinct hooks/angles —
// that's what makes a "series". Scripts are spoken word only: the avatar reads them verbatim.

export type ProductBrief = {
  name: string;
  description: string;
  sellingPoints: string[];
  tone: string;
  /** Persona description of the presenting avatar, for voice/character fit. */
  persona: string;
  variationCount: number;
};

export type ScriptVariation = {
  hook: string;
  script: string;
};

const SCRIPTS_TOOL: Anthropic.Tool = {
  name: "build_video_scripts",
  description:
    "Produce short-form video sales scripts for an AI spokesperson to read aloud.",
  input_schema: {
    type: "object",
    properties: {
      variations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            hook: {
              type: "string",
              description:
                "2–4 word label for this variation's angle, e.g. 'Pain point', 'Social proof', 'Question hook'",
            },
            script: {
              type: "string",
              description:
                "The full spoken script: 60–75 words, plain spoken prose, ends with a call to action",
            },
          },
          required: ["hook", "script"],
        },
        description: "The requested number of script variations, each with a distinct angle",
      },
    },
    required: ["variations"],
  },
};

function buildPrompt(brief: ProductBrief): string {
  return [
    `Product: ${brief.name}`,
    brief.description ? `Description: ${brief.description}` : "",
    brief.sellingPoints.length > 0
      ? `Key selling points:\n${brief.sellingPoints.map((p) => `- ${p}`).join("\n")}`
      : "",
    `Presenter persona: ${brief.persona}`,
    `Tone: ${toneLabel(brief.tone)}`,
    "",
    `Write ${brief.variationCount} short-form video sales script variation(s) for this product,`,
    "to be read aloud by an AI spokesperson in a 15–30 second social video (TikTok/Reels style).",
    "",
    "Rules:",
    "- Each variation must open with a DIFFERENT hook/angle (pain point, question hook,",
    "  social proof, bold claim, '3 reasons' list, before/after — pick distinct ones).",
    "- 60–75 words per script (≈30 seconds spoken). Spoken prose only: no stage directions,",
    "  no emoji, no hashtags, no markdown, no camera notes.",
    "- First sentence must grab attention within 2 seconds.",
    "- Concrete benefits over vague praise; use the selling points.",
    "- End every script with a clear call to action.",
    "- Write in the language of the product info provided above.",
  ]
    .filter(Boolean)
    .join("\n");
}

function clean(variations: ScriptVariation[], count: number): ScriptVariation[] {
  return variations
    .filter((v) => v && typeof v.script === "string" && v.script.trim().length > 0)
    .slice(0, count)
    .map((v) => ({
      hook: (v.hook ?? "").trim() || "Pitch",
      script: v.script.trim(),
    }));
}

/** Usable non-AI scripts so the flow still works without an Anthropic key. */
export function fallbackScripts(brief: ProductBrief): ScriptVariation[] {
  const points = brief.sellingPoints.filter(Boolean);
  const base: ScriptVariation[] = [
    {
      hook: "Direct pitch",
      script:
        `Let me tell you about ${brief.name}. ${brief.description} ` +
        (points.length > 0 ? `What makes it great? ${points.slice(0, 3).join(". ")}. ` : "") +
        `Don't take my word for it — try ${brief.name} yourself today.`,
    },
    {
      hook: "Question hook",
      script:
        `Still looking for the right solution? ${brief.name} might be exactly what you need. ` +
        `${brief.description} ` +
        (points[0] ? `The best part: ${points[0]}. ` : "") +
        `Check out ${brief.name} today — you won't regret it.`,
    },
    {
      hook: "Three reasons",
      script:
        `Three reasons people love ${brief.name}. ` +
        (points.length >= 3
          ? `One: ${points[0]}. Two: ${points[1]}. Three: ${points[2]}. `
          : `${brief.description} `) +
        `See for yourself — get ${brief.name} now.`,
    },
    {
      hook: "Bold claim",
      script:
        `This is the upgrade you didn't know you needed: ${brief.name}. ${brief.description} ` +
        (points[0] ? `${points[0]}. ` : "") +
        `Thousands are already on board. Try ${brief.name} today.`,
    },
    {
      hook: "Problem / solution",
      script:
        `We've all been there — settling for something that almost works. ${brief.name} fixes that. ` +
        `${brief.description} ` +
        (points[1] ? `Plus, ${points[1]}. ` : "") +
        `Make the switch to ${brief.name} today.`,
    },
  ];
  return base.slice(0, Math.max(1, Math.min(brief.variationCount, base.length)));
}

export async function generateVideoScripts(
  brief: ProductBrief,
): Promise<ScriptVariation[]> {
  const client = getAnthropic();
  const msg = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 2000,
    tools: [SCRIPTS_TOOL],
    tool_choice: { type: "tool", name: SCRIPTS_TOOL.name },
    messages: [{ role: "user", content: buildPrompt(brief) }],
  });

  const block = msg.content.find((b) => b.type === "tool_use");
  const ai =
    block && block.type === "tool_use"
      ? (block.input as { variations?: ScriptVariation[] })
      : {};
  const variations = clean(
    Array.isArray(ai.variations) ? ai.variations : [],
    brief.variationCount,
  );
  return variations.length > 0 ? variations : fallbackScripts(brief);
}
