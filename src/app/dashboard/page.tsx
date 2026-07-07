import type { ReactNode } from "react";
import Link from "next/link";
import { Search, Globe, ArrowRight } from "lucide-react";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Overview · Sitovai" };

export default async function DashboardOverview() {
  const ctx = await requireTenantContext();
  const supabase = await createClient();

  const [
    { count: leadCount },
    { count: noWebsiteCount },
    { count: siteCount },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("website_status", "no_website"),
    supabase.from("sites").select("*", { count: "exact", head: true }),
  ]);

  const firstName = (ctx.fullName || ctx.email || "there")
    .split("@")[0]
    .split(" ")[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Welcome, {firstName}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          A snapshot of {ctx.tenantName || "your workspace"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Leads" value={leadCount ?? 0} />
        <Stat label="No-website leads" value={noWebsiteCount ?? 0} />
        <Stat label="Websites built" value={siteCount ?? 0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          href="/dashboard/leads"
          icon={<Search className="h-5 w-5" />}
          title="Find leads"
          desc="Describe a niche and location to find local businesses with no website."
        />
        <ActionCard
          href="/dashboard/sites"
          icon={<Globe className="h-5 w-5" />}
          title="Build a website"
          desc="Turn a lead into a ready-to-launch site with AI-generated copy."
        />
      </div>
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

function ActionCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition hover:border-indigo-300 hover:shadow-sm"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1 font-medium text-zinc-900 dark:text-zinc-100">
          {title}
          <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
        </p>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{desc}</p>
      </div>
    </Link>
  );
}
