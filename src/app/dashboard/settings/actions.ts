"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/env";
import {
  ensureConnectAccount,
  connectOnboardingUrl,
  refreshConnectStatus,
} from "@/lib/sites/connect";

export async function updateAccountAction(input: {
  workspaceName: string;
  fullName: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const ctx = await requireTenantContext();
  const workspaceName = input.workspaceName.trim();
  const fullName = input.fullName.trim();
  if (!workspaceName) return { error: "Workspace name can't be empty." };
  if (workspaceName.length > 100)
    return { error: "Workspace name is too long (max 100 characters)." };

  const supabase = await createClient();
  if (ctx.role === "owner" || ctx.role === "admin") {
    const { error } = await supabase
      .from("tenants")
      .update({ name: workspaceName, updated_at: new Date().toISOString() })
      .eq("id", ctx.tenantId);
    if (error) return { error: error.message };
  } else if (workspaceName !== ctx.tenantName) {
    return { error: "Only workspace owners can rename the workspace." };
  }

  const { error: pErr } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", ctx.userId);
  if (pErr) return { error: pErr.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function sendPasswordResetAction(): Promise<{
  ok?: boolean;
  error?: string;
}> {
  const ctx = await requireTenantContext();
  if (!ctx.email) return { error: "No email on file for this account." };
  const supabase = await createClient();
  const h = await headers();
  const origin =
    h.get("origin") ?? `https://${h.get("host") ?? "localhost:3000"}`;
  const { error } = await supabase.auth.resetPasswordForEmail(ctx.email, {
    redirectTo: `${origin}/reset-password`,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

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
