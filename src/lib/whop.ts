import crypto from "node:crypto";

/**
 * Whop webhook support.
 *
 * Whop signs each delivery with HMAC-SHA256 over "{webhook-id}.{webhook-timestamp}.{raw body}",
 * base64-encoded, in the `webhook-signature` header as "v1,<sig>" (space-separated while a
 * secret is rotating, so any match counts).
 */

const MAX_SKEW_SECONDS = 5 * 60; // Whop's documented replay window.

export type WhopVerifyResult = { ok: true } | { ok: false; reason: string };

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function verifyWhopSignature(
  rawBody: string,
  headers: Headers,
  secret: string | undefined,
): WhopVerifyResult {
  if (!secret) return { ok: false, reason: "WHOP_WEBHOOK_SECRET not set" };

  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signature = headers.get("webhook-signature");
  if (!id || !timestamp || !signature) {
    return { ok: false, reason: "Missing webhook headers" };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "Bad webhook-timestamp" };
  if (Math.abs(Date.now() / 1000 - ts) > MAX_SKEW_SECONDS) {
    return { ok: false, reason: "Timestamp outside the replay window" };
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest("base64");

  const presented = signature
    .split(" ")
    .map((part) => part.split(",").pop() ?? "")
    .filter(Boolean);

  return presented.some((sig) => safeEqual(sig, expected))
    ? { ok: true }
    : { ok: false, reason: "Signature mismatch" };
}

export interface WhopMembership {
  id?: string;
  status?: string;
  user?: { id?: string; email?: string; username?: string };
  plan?: { id?: string };
  product?: { id?: string };
  metadata?: Record<string, unknown>;
}

export interface WhopEvent {
  id?: string;
  type?: string;
  data?: WhopMembership;
}

/** Sitagio's paid tiers. Whop plan ids come from env — they're created in Whop's dashboard. */
export type WhopPaidPlan = "pro" | "premium";

export function planForWhopPlan(
  planId: string | undefined,
  map: { pro: string; premium: string },
): WhopPaidPlan | null {
  if (!planId) return null;
  if (map.pro && planId === map.pro) return "pro";
  if (map.premium && planId === map.premium) return "premium";
  return null;
}

export function grantsAccess(status: string | undefined): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}
