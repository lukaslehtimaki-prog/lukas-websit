import Link from "next/link";
import { requireTenantContext } from "@/lib/auth/tenant";
import { planLimits } from "@/lib/plans";
import { isStripeConfigured } from "@/lib/env";
import {
  getConnectStatus,
  refreshConnectStatus,
  PLATFORM_COMMISSION_PCT,
} from "@/lib/sites/connect";
import { Appearance } from "@/components/settings/appearance";
import { Payouts } from "@/components/settings/payouts";

export const metadata = { title: "Settings · Sitovai" };
export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>;
}) {
  const ctx = await requireTenantContext();
  const plan = planLimits(ctx.planId);
  const sp = await searchParams;

  // Returning from Stripe onboarding: pull the fresh status before rendering.
  let connect = { accountId: null as string | null, ready: false };
  if (isStripeConfigured() && !ctx.isPlatformAdmin) {
    connect =
      sp.connect === "done"
        ? await refreshConnectStatus(ctx.tenantId).catch(() => connect)
        : await getConnectStatus(ctx.tenantId);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your workspace preferences.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Appearance
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Choose how the Sitovai dashboard looks. Saved on this device.
        </p>
        <div className="mt-4">
          <Appearance />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Website sale payouts
        </h2>
        <div className="mt-4">
          {ctx.isPlatformAdmin ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Platform account — your website sales are charged directly on the
              platform&apos;s Stripe, with no fee.
            </p>
          ) : (
            <Payouts
              hasAccount={Boolean(connect.accountId)}
              ready={connect.ready}
              commissionPct={PLATFORM_COMMISSION_PCT}
            />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Account
        </h2>
        <dl className="mt-4 divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {ctx.email}
            </dd>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-zinc-500 dark:text-zinc-400">Workspace</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {ctx.tenantName || "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-zinc-500 dark:text-zinc-400">Plan</dt>
            <dd className="flex items-center gap-3">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {plan.label}
              </span>
              <Link
                href="/dashboard/billing"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Manage
              </Link>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
