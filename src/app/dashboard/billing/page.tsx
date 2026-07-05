import { requireTenantContext, getTenantContext } from "@/lib/auth/tenant";
import { isStripeConfigured } from "@/lib/env";
import { planLimits } from "@/lib/plans";
import { subscriptionLabel, hasActiveSubscription } from "@/lib/subscription";
import { syncTenantSubscription } from "@/lib/billing-sync";
import { PlanCards } from "@/components/billing/plan-cards";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Billing · Sitexa" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  let ctx = await requireTenantContext();
  const sp = await searchParams;
  const configured = isStripeConfigured();

  // On return from Stripe Checkout, pull the fresh subscription immediately
  // (works locally without a webhook tunnel).
  if (sp.success && configured) {
    await syncTenantSubscription(ctx.tenantId);
    ctx = (await getTenantContext()) ?? ctx;
  }

  const active = hasActiveSubscription(ctx.subscriptionStatus);
  const plan = planLimits(ctx.planId);
  const isOwner = ctx.role === "owner" || ctx.role === "admin";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Billing</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your plan, trial, and payment method.
        </p>
      </div>

      {sp.success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Your plan is starting — it can take a few seconds to reflect here.
          Refresh if the status below has not updated.
        </div>
      ) : null}
      {sp.canceled ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-sm text-zinc-600 dark:text-zinc-300">
          Checkout canceled — no charge was made.
        </div>
      ) : null}
      {!configured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Billing is not configured yet (Stripe keys missing). See README → Billing.
        </div>
      ) : null}

      <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Current plan</p>
            <p className="mt-0.5 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {plan.label}
            </p>
          </div>
          <Badge variant={active ? "success" : "default"}>
            {subscriptionLabel(ctx.subscriptionStatus, ctx.trialEnd)}
          </Badge>
        </div>
        {ctx.isPlatformAdmin ? (
          <p className="mt-3 text-sm text-indigo-600 dark:text-indigo-400">
            Platform admin — full access regardless of plan.
          </p>
        ) : active ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            {plan.searches.toLocaleString()} lead searches and {plan.sites}{" "}
            websites per month.
          </p>
        ) : (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Start a plan to unlock lead searches and AI website generation.
          </p>
        )}
      </div>

      <PlanCards
        currentPlan={ctx.planId}
        status={ctx.subscriptionStatus}
        configured={configured}
        isOwner={isOwner}
      />
    </div>
  );
}
