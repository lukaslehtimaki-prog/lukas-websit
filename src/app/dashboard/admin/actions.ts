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
  const { error } = await supabase.from("affiliates").insert({
    name,
    code,
    email,
    commission_bps: pct * 100,
  });
  if (error) {
    return {
      error: error.code === "23505"
        ? `The code "${code}" is already taken.`
        : error.message,
    };
  }
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
