import "server-only";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe Connect (Express) plumbing for website-sale payouts. A user connects
// their own Stripe from Settings; their Buy-button payments are destination
// charges — the money lands in their account minus the platform commission,
// which stays in the platform's Stripe balance automatically.

/** Platform cut of every website sale made by a connected user, in percent. */
export const PLATFORM_COMMISSION_PCT = 15;

export type ConnectStatus = {
  accountId: string | null;
  ready: boolean;
};

export async function getConnectStatus(
  tenantId: string,
): Promise<ConnectStatus> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("tenants")
    .select("stripe_connect_account_id, stripe_connect_ready")
    .eq("id", tenantId)
    .maybeSingle();
  const row = data as {
    stripe_connect_account_id?: string | null;
    stripe_connect_ready?: boolean;
  } | null;
  return {
    accountId: row?.stripe_connect_account_id ?? null,
    ready: row?.stripe_connect_ready ?? false,
  };
}

/** The tenant's Express account, created on first use. */
export async function ensureConnectAccount(
  tenantId: string,
  email: string | null,
): Promise<string> {
  const existing = await getConnectStatus(tenantId);
  if (existing.accountId) return existing.accountId;

  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email: email ?? undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { tenant_id: tenantId },
  });
  const supabase = createAdminClient();
  await supabase
    .from("tenants")
    .update({ stripe_connect_account_id: account.id })
    .eq("id", tenantId);
  return account.id;
}

/** Hosted onboarding URL for the connected account. */
export async function connectOnboardingUrl(
  accountId: string,
  origin: string,
): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard/settings?connect=refresh`,
    return_url: `${origin}/dashboard/settings?connect=done`,
    type: "account_onboarding",
  });
  return link.url;
}

/** Re-checks readiness with Stripe and caches it on the tenant. */
export async function refreshConnectStatus(
  tenantId: string,
): Promise<ConnectStatus> {
  const status = await getConnectStatus(tenantId);
  if (!status.accountId) return status;
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(status.accountId);
  // Destination charges specifically require the transfers capability on the
  // connected account — charges_enabled alone isn't the right gate.
  const ready =
    account.capabilities?.transfers === "active" &&
    Boolean(account.payouts_enabled || account.charges_enabled);
  if (ready !== status.ready) {
    const supabase = createAdminClient();
    await supabase
      .from("tenants")
      .update({ stripe_connect_ready: ready })
      .eq("id", tenantId);
  }
  return { accountId: status.accountId, ready };
}
