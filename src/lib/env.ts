// Centralized environment access.
//
// NEXT_PUBLIC_* values are inlined by Next at build time wherever they are referenced
// literally as `process.env.NEXT_PUBLIC_*` (as below), so they reach the browser bundle.
//
// We intentionally do NOT throw at module load — that would break `next build` and `npm
// run dev` before the user has configured their keys. Validation is lazy.

export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  DIRECT_URL: process.env.DIRECT_URL ?? "",

  // Google Places (server-side; Phase 2)
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? "",

  // Anthropic / Claude (Phase 3)
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
  ANTHROPIC_FAST_MODEL:
    process.env.ANTHROPIC_FAST_MODEL ?? "claude-haiku-4-5-20251001",

  // HeyGen (avatar video generation) — optional; without it the app runs the
  // avatar-video flow in demo mode with a mock provider and sample output.
  HEYGEN_API_KEY: process.env.HEYGEN_API_KEY ?? "",

  // Resend (outbound pitch emails from the app)
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  RESEND_FROM_EMAIL:
    process.env.RESEND_FROM_EMAIL ?? "Sitovai <noreply@contact.sitovai.com>",

  // Platform admin allowlist (comma-separated emails)
  PLATFORM_ADMIN_EMAILS: process.env.PLATFORM_ADMIN_EMAILS ?? "",

  // Stripe (billing)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO ?? "",
  STRIPE_PRICE_PREMIUM: process.env.STRIPE_PRICE_PREMIUM ?? "",
};

export function isSupabaseConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. See README.md → Setup.",
    );
  }
}

export function isPlacesConfigured(): boolean {
  return Boolean(env.GOOGLE_MAPS_API_KEY);
}

export function isAIConfigured(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

/** Lowercased, trimmed list of platform-admin emails from PLATFORM_ADMIN_EMAILS. */
export function platformAdminEmails(): string[] {
  return env.PLATFORM_ADMIN_EMAILS.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isResendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY);
}

export function isHeyGenConfigured(): boolean {
  return Boolean(env.HEYGEN_API_KEY);
}

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}
