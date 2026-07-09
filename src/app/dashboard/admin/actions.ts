"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createAdminClient } from "@/lib/supabase/admin";

// Affiliate management — platform admin only. The affiliates table has no RLS
// policies, so all access goes through the service-role client after an
// explicit admin check.

const CODE_RE = /^[a-z0-9-]{3,32}$/;

async function requirePlatformAdmin() {
  const ctx = await requireTenantContext();
  if (!ctx.isPlatformAdmin) throw new Error("Not authorized.");
  return ctx;
}

export async function createAffiliateAction(input: {
  name: string;
  code: string;
  email?: string;
  commissionPct?: number;
}): Promise<{ ok?: boolean; error?: string }> {
  try {
    await requirePlatformAdmin();
  } catch {
    return { error: "Not authorized." };
  }

  const name = input.name.trim();
  const code = input.code.trim().toLowerCase();
  const email = input.email?.trim() || null;
  const pct = Math.min(90, Math.max(0, Math.round(input.commissionPct ?? 20)));
  if (!name) return { error: "Give the affiliate a name." };
  if (!CODE_RE.test(code))
    return {
      error: "Code must be 3–32 characters: lowercase letters, numbers, dashes.",
    };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Enter a valid email (or leave it empty)." };

  const supabase = createAdminClient();
  const { data: created, error } = await supabase
    .from("affiliates")
    .insert({
      name,
      code,
      email,
      commission_bps: pct * 100,
    })
    .select("id")
    .single();
  if (error) {
    return {
      error: error.code === "23505"
        ? `The code "${code}" is already taken.`
        : error.message,
    };
  }
  // If the email belongs to a Sitovai account, link their workspace so the
  // partner discount kicks in on their own subscription.
  if (email && created) await tryLinkAffiliateTenant(created.id, email);
  revalidatePath("/dashboard/admin");
  return { ok: true };
}

/** Match an affiliate's email to a user account → link their workspace. */
async function tryLinkAffiliateTenant(
  affiliateId: string,
  email: string,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (!profile) return false;
  const { data: membership } = await supabase
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", (profile as { id: string }).id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const tenantId = (membership as { tenant_id?: string } | null)?.tenant_id;
  if (!tenantId) return false;
  // Unique constraint: a workspace can back at most one affiliate.
  const { error } = await supabase
    .from("affiliates")
    .update({ tenant_id: tenantId })
    .eq("id", affiliateId);
  return !error;
}

export async function linkAffiliateAccountAction(
  id: string,
): Promise<{ ok?: boolean; error?: string }> {
  try {
    await requirePlatformAdmin();
  } catch {
    return { error: "Not authorized." };
  }
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("affiliates")
    .select("email")
    .eq("id", id)
    .maybeSingle();
  const email = (data as { email?: string | null } | null)?.email;
  if (!email) return { error: "Add an email to this affiliate first." };
  const linked = await tryLinkAffiliateTenant(id, email);
  if (!linked)
    return {
      error:
        "No Sitovai account found with that email (or its workspace already backs another affiliate).",
    };
  revalidatePath("/dashboard/admin");
  return { ok: true };
}

export async function setAffiliateActiveAction(
  id: string,
  active: boolean,
): Promise<{ ok?: boolean; error?: string }> {
  try {
    await requirePlatformAdmin();
  } catch {
    return { error: "Not authorized." };
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("affiliates")
    .update({ active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { ok: true };
}
