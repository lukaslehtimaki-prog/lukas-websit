import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { NewSiteForm, type LeadOption } from "@/components/sites/new-site-form";

export const metadata = { title: "New website · Sitexa" };

export default async function NewSitePage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  await requireTenantContext();
  const { leadId } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("id,name,address,website_status")
    .order("website_status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(300);
  const leads = (data ?? []) as unknown as LeadOption[];

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/dashboard/sites"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" /> Back to websites
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Create a website</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Pick a lead or paste a Google Maps link, choose a template, and let AI fill it in.
        </p>
      </div>
      <NewSiteForm leads={leads} preselectedLeadId={leadId ?? null} />
    </div>
  );
}
