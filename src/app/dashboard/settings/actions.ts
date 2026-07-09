"use server";

import { headers } from "next/headers";
import { requireTenantContext } from "@/lib/auth/tenant";
import { isStripeConfigured } from "@/lib/env";
import {
  ensureConnectAccount,
  connectOnboardingUrl,
  refreshConnectStatus,
} from "@/lib/sites/connect";

export async function startConnectOnboardingAction(): Promise<{
  url?: string;
  error?: string;
}> {
  const ctx = await requireTenantContext();
  if (!isStripeConfigured())
    return { error: "Billing isn't set up yet (Stripe keys missing)." };
  if (ctx.role !== "owner" && ctx.role !== "admin")
    return { error: "Only workspace owners can connect payouts." };
  try {
    const accountId = await ensureConnectAccount(ctx.tenantId, ctx.email);
    const h = await headers();
    const origin =
      h.get("origin") ?? `https://${h.get("host") ?? "localhost:3000"}`;
    const url = await connectOnboardingUrl(accountId, origin);
    return { url };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Could not start Stripe onboarding. Try again in a moment.",
    };
  }
}

export async function refreshConnectStatusAction(): Promise<{
  ready?: boolean;
  error?: string;
}> {
  const ctx = await requireTenantContext();
  if (!isStripeConfigured())
    return { error: "Billing isn't set up yet (Stripe keys missing)." };
  try {
    const status = await refreshConnectStatus(ctx.tenantId);
    return { ready: status.ready };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not check the status.",
    };
  }
}
