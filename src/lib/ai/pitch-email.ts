import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "./client";
import { env } from "@/lib/env";
import { LANGUAGE_NAMES } from "@/lib/templates/i18n";

// Drafts a short, personal sales email pitching the finished website to the
// business, in the business's own language. The user edits before sending.

const PITCH_TOOL: Anthropic.Tool = {
  name: "write_pitch_email",
  description: "Write a short sales email pitching a ready-made website.",
  input_schema: {
    type: "object",
    properties: {
      subject: {
        type: "string",
        description: "Email subject, under 60 characters, no spammy caps",
      },
      body: {
        type: "string",
        description:
          "Plain-text email body. Must contain the placeholder [WEBSITE_LINK] exactly once on its own line.",
      },
    },
    required: ["subject", "body"],
  },
};

export async function generatePitchEmail(opts: {
  businessName: string;
  category: string | null;
  location: string | null;
  language: string;
  liveUrl: string;
  senderName: string;
}): Promise<{ subject: string; body: string }> {
  const langName =
    LANGUAGE_NAMES[opts.language.toLowerCase()] ?? "English";
  const client = getAnthropic();
  const msg = await client.messages.create({
    model: env.ANTHROPIC_FAST_MODEL,
    max_tokens: 900,
    tools: [PITCH_TOOL],
    tool_choice: { type: "tool", name: PITCH_TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          `Business: ${opts.businessName}`,
          opts.category ? `Type: ${opts.category}` : "",
          opts.location ? `Location: ${opts.location}` : "",
          `Sender: ${opts.senderName}`,
          "",
          `Write a short, personal sales email ENTIRELY IN ${langName.toUpperCase()}`,
          "to this business owner. Context: the sender noticed the business has no",
          "website, went ahead and built them a complete, ready-to-launch one, and is",
          "sharing it. The email is delivered with a large preview image of the site",
          "and a button linking to it, so the email's job is to make them click and",
          "want to keep it.",
          "",
          "Structure:",
          "- Subject: specific and curiosity-driving, like a note from a person, not a",
          "  campaign. Mention the business by name or what was made for them.",
          "- Opening line: show this is about THEIR business specifically (their trade,",
          "  their town) — never a generic 'I help businesses grow' opener.",
          "- The hook: you already built their website. It exists, it's finished, the",
          "  link below shows it. No 'would you be interested' — it's show, then tell.",
          "- One or two concrete benefits a local business owner actually feels:",
          "  customers who search their name find a professional site, it works on",
          "  phones, people can call or find them in one tap.",
          "- Close: looking is free and takes a minute; if they like it, it's theirs —",
          "  reply or use the button below the message. If not, no hard feelings.",
          "",
          "Tone: a skilled human wrote this in two minutes — warm, direct, confident,",
          "zero corporate speak, zero pressure tactics. Short sentences, short",
          "paragraphs (it's read on a phone). 100-170 words. Never invent claims,",
          "statistics, prices, or fake deadlines. Include the placeholder",
          "[WEBSITE_LINK] exactly once on its own line where the link should go.",
          `Sign off with the sender's name (${opts.senderName}).`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  });

  const block = msg.content.find((b) => b.type === "tool_use");
  const out =
    block && block.type === "tool_use"
      ? (block.input as { subject?: string; body?: string })
      : {};
  const subject = (out.subject ?? `${opts.businessName} — website`).slice(0, 120);
  let body = out.body ?? "";
  body = body.includes("[WEBSITE_LINK]")
    ? body.replaceAll("[WEBSITE_LINK]", opts.liveUrl)
    : `${body.trim()}\n\n${opts.liveUrl}`;
  return { subject, body };
}
