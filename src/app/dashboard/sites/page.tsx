import Link from "next/link";
import { Plus, Globe } from "lucide-react";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { isAIConfigured } from "@/lib/env";
import { templateMeta } from "@/lib/templates/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Websites · Sitexa" };

type SiteRow = {
  id: string;
  title: string;
  template_id: string;
  status: string;
  updated_at: string;
};

const statusStyles: Record<string, string> = {
  draft: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300",
  generated: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300",
  published: "bg-emerald-100 text-emerald-700",
};

export default async function SitesPage() {
  await requireTenantContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("id,title,template_id,status,updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);
  const sites = (data ?? []) as unknown as SiteRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Websites</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            AI-generated single-page sites, each tied to the lead it came from.
          </p>
        </div>
        <Link
          href="/dashboard/sites/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" /> New site
        </Link>
      </div>

      {!isAIConfigured() ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Without <code className="font-mono">ANTHROPIC_API_KEY</code>, generated copy is
          basic placeholder text. Add the key and restart for full AI-written copy.
        </div>
      ) : null}

      {sites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Globe className="h-6 w-6" />
          </div>
          <p className="mt-4 font-medium text-zinc-900 dark:text-zinc-100">No websites yet</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Build one from a lead in the Lead Finder, or start from a Google Maps link.
          </p>
          <Link
            href="/dashboard/sites/new"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" /> New site
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/sites/${s.id}`}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition hover:border-indigo-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    statusStyles[s.status] ?? statusStyles.draft,
                  )}
                >
                  {s.status}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {templateMeta(s.template_id).name}
                </span>
              </div>
              <p className="mt-3 font-medium text-zinc-900 dark:text-zinc-100">{s.title}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Updated {new Date(s.updated_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
