import Link from "next/link";
import { requireTenantContext } from "@/lib/auth/tenant";
import {
  effectiveLimits,
  hasActiveSubscription,
  subscriptionLabel,
} from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Usage · Sitovai" };

export default async function UsagePage() {
  const ctx = await requireTenantContext();
  const limits = effectiveLimits(
    ctx.planId,
    ctx.subscriptionStatus,
    ctx.isPlatformAdmin,
  );
  const active =
    hasActiveSubscription(ctx.subscriptionStatus) || ctx.isPlatformAdmin;
  const supabase = await createClient();

  const now = new Date();
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  const [{ count: searchCount }, { count: siteGenCount }] =
    await Promise.all([
      supabase
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("kind", "lead_search")
        .gte("created_at", startOfMonth),
      supabase
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("kind", "site_generation")
        .gte("created_at", startOfMonth),
    ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Usage</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Resets at the start of each month.
          </p>
        </div>
        <Badge variant={active ? "success" : "default"}>
          {subscriptionLabel(ctx.subscriptionStatus, ctx.trialEnd)}
        </Badge>
      </div>

      {!active ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <span>
            Your workspace is read-only. Subscribe to a plan to run searches
            and build sites.
          </span>
          <Link
            href="/dashboard/billing"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white transition hover:bg-zinc-800"
          >
            Choose a plan
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Meter
          label="Lead searches"
          used={searchCount ?? 0}
          limit={limits.searches}
        />
        <Meter
          label="Websites generated"
          used={siteGenCount ?? 0}
          limit={limits.sites}
        />
      </div>
    </div>
  );
}

function Meter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return (
    <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {used} / {limit.toLocaleString()}
        </p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
