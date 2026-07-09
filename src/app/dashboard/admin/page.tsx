import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { desc, sql, gte } from "drizzle-orm";
import { requireTenantContext } from "@/lib/auth/tenant";
import { getAdminDb, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { planLimits } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site";
import {
  AffiliatesPanel,
  type AffiliateRow,
} from "@/components/admin/affiliates-panel";

export const metadata = { title: "Admin · Sitovai" };

type CountRow = { tenantId: string; n: number };

export default async function AdminPage() {
  const ctx = await requireTenantContext();
  if (!ctx.isPlatformAdmin) redirect("/dashboard");

  if (!env.DATABASE_URL) {
    return (
      <AdminShell>
        <Notice>
          Set <code className="font-mono">DATABASE_URL</code> in{" "}
          <code className="font-mono">.env.local</code> to enable the platform
          admin view.
        </Notice>
      </AdminShell>
    );
  }

  let tenantsRows: (typeof schema.tenants.$inferSelect)[] = [];
  let members = new Map<string, number>();
  let leads = new Map<string, number>();
  let sites = new Map<string, number>();
  let usageByKind = new Map<string, number>();

  try {
    const db = getAdminDb();
    const toMap = (rows: CountRow[]) =>
      new Map(rows.map((r) => [r.tenantId, r.n]));
    const monthStart = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
    );
    const [t, m, l, s, u] = await Promise.all([
      db
        .select()
        .from(schema.tenants)
        .orderBy(desc(schema.tenants.createdAt))
        .limit(200),
      db
        .select({
          tenantId: schema.memberships.tenantId,
          n: sql<number>`count(*)::int`,
        })
        .from(schema.memberships)
        .groupBy(schema.memberships.tenantId),
      db
        .select({
          tenantId: schema.leads.tenantId,
          n: sql<number>`count(*)::int`,
        })
        .from(schema.leads)
        .groupBy(schema.leads.tenantId),
      db
        .select({
          tenantId: schema.sites.tenantId,
          n: sql<number>`count(*)::int`,
        })
        .from(schema.sites)
        .groupBy(schema.sites.tenantId),
      db
        .select({
          kind: schema.usageEvents.kind,
          // sum, not count: batch kinds record quantity = batch size
          n: sql<number>`coalesce(sum(${schema.usageEvents.quantity}), 0)::int`,
        })
        .from(schema.usageEvents)
        .where(gte(schema.usageEvents.createdAt, monthStart))
        .groupBy(schema.usageEvents.kind),
    ]);
    tenantsRows = t;
    members = toMap(m);
    leads = toMap(l);
    sites = toMap(s);
    usageByKind = new Map(u.map((r) => [r.kind, r.n]));
  } catch {
    return (
      <AdminShell>
        <Notice>
          Could not read the database. Make sure you have applied{" "}
          <code className="font-mono">supabase/migrations/0001_init.sql</code> and
          that <code className="font-mono">DATABASE_URL</code> is correct.
        </Notice>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Tenants" value={tenantsRows.length} />
        <Stat
          label="Total leads"
          value={[...leads.values()].reduce((a, b) => a + b, 0)}
        />
        <Stat
          label="Total sites"
          value={[...sites.values()].reduce((a, b) => a + b, 0)}
        />
        <Stat label="Searches (mo)" value={usageByKind.get("lead_search") ?? 0} />
        <Stat
          label="Sites built (mo)"
          value={usageByKind.get("site_generation") ?? 0}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Workspace</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Leads</th>
              <th className="px-4 py-3">Sites</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {tenantsRows.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{t.name}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {planLimits(t.planId).label}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{members.get(t.id) ?? 0}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{leads.get(t.id) ?? 0}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{sites.get(t.id) ?? 0}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {tenantsRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  No tenants yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AffiliatesSection />
    </AdminShell>
  );
}

/**
 * Affiliate roster + performance, via the service-role client (independent of
 * DATABASE_URL). Commission ≈ referred paying subs × plan price × 90%
 * (the referred discount) × the affiliate's rate.
 */
async function AffiliatesSection() {
  const supabase = createAdminClient();
  const { data: affRows, error } = await supabase
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    return (
      <Notice>
        The affiliate program needs a one-time database setup: run{" "}
        <code className="font-mono">supabase/migrations/0005_affiliates.sql</code>{" "}
        in the Supabase SQL editor.
      </Notice>
    );
  }
  const list = (affRows ?? []) as {
    id: string;
    code: string;
    name: string;
    email: string | null;
    commission_bps: number;
    clicks: number;
    active: boolean;
    tenant_id: string | null;
  }[];

  const { data: refRows } = await supabase
    .from("tenants")
    .select("referred_by_code, plan_id, subscription_status")
    .not("referred_by_code", "is", null);
  const referred = (refRows ?? []) as {
    referred_by_code: string;
    plan_id: string;
    subscription_status: string | null;
  }[];

  const rows: AffiliateRow[] = list.map((a) => {
    const mine = referred.filter((t) => t.referred_by_code === a.code);
    const paying = mine.filter((t) => t.subscription_status === "active");
    const trialing = mine.filter((t) => t.subscription_status === "trialing");
    const monthlyCommissionCents = paying.reduce(
      (sum, t) =>
        sum +
        Math.round(
          planLimits(t.plan_id).priceCents * 0.9 * (a.commission_bps / 10000),
        ),
      0,
    );
    return {
      ...a,
      signups: mine.length,
      paying: paying.length,
      trialing: trialing.length,
      monthlyCommissionCents,
    };
  });

  return <AffiliatesPanel affiliates={rows} baseUrl={siteUrl} />;
}

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Platform admin</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Every tenant and their usage. Visible to platform admins only.
        </p>
      </div>
      {children}
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}
