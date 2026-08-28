import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import {
  verifyWhopSignature,
  planForWhopPlan,
  grantsAccess,
  type WhopEvent,
  type WhopMembership,
} from "@/lib/whop";

export const runtime = "nodejs";

/**
 * Whop webhook: turns a Whop membership into Sitagio access.
 *
 * A failure here means someone paid and got nothing, so DB errors return 500 and
 * let Whop retry rather than being swallowed behind a 200.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text(); // raw body required for signature verification

  const verified = verifyWhopSignature(raw, req.headers, env.WHOP_WEBHOOK_SECRET);
  if (!verified.ok) {
    console.warn("whop webhook rejected:", verified.reason);
    return new NextResponse(verified.reason, { status: 400 });
  }

  let event: WhopEvent;
  try {
    event = JSON.parse(raw) as WhopEvent;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const membership = event.data;
  if (!membership) return NextResponse.json({ received: true });

  try {
    switch (event.type) {
      case "membership.activated":
      case "membership.cancel_at_period_end_changed":
        await applyMembership(membership);
        break;
      case "membership.deactivated":
        await revokeMembership(membership);
        break;
      default:
        break; // Whop sends every event type; ignore the ones we don't sell on.
    }
  } catch (e) {
    console.error("whop webhook handler error:", event.type, e);
    return new NextResponse("Handler failed", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function emailOf(m: WhopMembership): string | null {
  const email = m.user?.email?.trim().toLowerCase();
  return email ? email : null;
}

async function applyMembership(m: WhopMembership): Promise<void> {
  const email = emailOf(m);
  const plan = planForWhopPlan(m.plan?.id, {
    pro: env.WHOP_PLAN_PRO,
    premium: env.WHOP_PLAN_PREMIUM,
  });

  if (!email) {
    // Missing email means the Whop app lacks member:email:read — fail loudly.
    throw new Error(`whop membership ${m.id} has no user email — check member:email:read`);
  }
  if (!plan) {
    console.warn(`whop plan ${m.plan?.id} is not mapped to a Sitagio plan; ignoring`);
    return;
  }
  if (!grantsAccess(m.status)) {
    await revokeMembership(m);
    return;
  }

  const supabase = createAdminClient();

  const { error: entErr } = await supabase.from("whop_entitlements").upsert(
    {
      email,
      plan_id: plan,
      active: true,
      whop_user_id: m.user?.id ?? null,
      whop_membership_id: m.id ?? null,
      whop_plan_id: m.plan?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (entErr) throw entErr;

  await applyToExistingAccount(supabase, email, plan, m.status ?? "active");
}

async function revokeMembership(m: WhopMembership): Promise<void> {
  const email = emailOf(m);
  if (!email) return;

  const supabase = createAdminClient();

  const { error: entErr } = await supabase
    .from("whop_entitlements")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("email", email);
  if (entErr) throw entErr;

  await applyToExistingAccount(supabase, email, "free", "canceled");
}

/**
 * If the buyer already has a Sitagio account, move their tenant now. If not, the
 * entitlement row is enough — handle_new_user() claims it at signup.
 */
async function applyToExistingAccount(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
  planId: string,
  status: string,
): Promise<void> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("current_tenant_id")
    .ilike("email", email)
    .maybeSingle();
  if (error) throw error;

  const tenantId = (profile as { current_tenant_id?: string } | null)?.current_tenant_id;
  if (!tenantId) return;

  const { error: upErr } = await supabase
    .from("tenants")
    .update({
      plan_id: planId,
      subscription_status: status === "past_due" ? "past_due" : status === "canceled" ? "canceled" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId);
  if (upErr) throw upErr;
}
