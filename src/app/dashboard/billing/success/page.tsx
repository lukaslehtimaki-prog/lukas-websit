import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireTenantContext, getTenantContext } from "@/lib/auth/tenant";
import { isStripeConfigured } from "@/lib/env";
import { planLimits } from "@/lib/plans";
import { syncTenantSubscription } from "@/lib/billing-sync";

export const metadata = {
  title: "Subscription started · Sitagio",
  robots: { index: false, follow: false },
};

/**
 * Checkout return page.
 *
 * Stripe sends the customer here instead of back to /dashboard/billing?success=1
 * so the paid conversion lands on its own URL — that is what an analytics goal
 * or an ad platform's conversion event can be pointed at. The old query-string
 * form still works for any checkout session already in flight.
 *
 * It performs the same immediate subscription pull the billing page did, so a
 * local run without a webhook tunnel still reflects the new plan at once.
 */
export default async function BillingSuccessPage() {
  let ctx = await requireTenantContext();
  if (isStripeConfigured()) {
    await syncTenantSubscription(ctx.tenantId);
    ctx = (await getTenantContext()) ?? ctx;
  }
  const plan = planLimits(ctx.planId);

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
        <CheckCircle2 className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        You&apos;re subscribed
      </h1>
      <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        Your {plan.label} plan is active. The receipt is on its way to your
        inbox from Stripe. If the plan below still looks wrong, give it a few
        seconds and refresh — Stripe confirms it in the background.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200/70 bg-white p-5 text-left dark:border-zinc-800/70 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Current plan</p>
        <p className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {plan.label}
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {plan.searches.toLocaleString("en-GB")} lead searches and{" "}
          {plan.sites.toLocaleString("en-GB")} AI websites a month.
        </p>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard/leads"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Find your first leads
        </Link>
        <Link
          href="/dashboard/billing"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Manage billing
        </Link>
      </div>
    </div>
  );
}
