import "server-only";
import { env } from "@/lib/env";

// Outbound email via Resend's REST API (no SDK dependency). Used for pitch emails;
// auth emails go through Supabase's SMTP separately. Plain text on purpose — cold
// outreach deliverability is better and it reads personal, not like a newsletter.

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
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
        reply_to: opts.replyTo ? [opts.replyTo] : undefined,
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
