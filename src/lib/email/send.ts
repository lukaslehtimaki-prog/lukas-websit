import "server-only";
import { env } from "@/lib/env";

// Outbound email via Resend's REST API (no SDK dependency). Used for pitch emails;
// auth emails go through Supabase's SMTP separately. Always sends a plain-text
// part alongside any HTML — multipart keeps cold-outreach deliverability decent.

/**
 * We send from a no-reply address on a send-only domain, so without this a
 * recipient hitting Reply is writing into a black hole. Callers that have a
 * better reply target (e.g. the lead's own address) pass `replyTo` and win.
 */
const DEFAULT_REPLY_TO = "support@sitovaiagency.com";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) {
    return { ok: false, error: "Email sending is not configured (RESEND_API_KEY)." };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        reply_to: [opts.replyTo ?? DEFAULT_REPLY_TO],
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { ok: false, error: body.message ?? `Send failed (${res.status}).` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the email service." };
  }
}
