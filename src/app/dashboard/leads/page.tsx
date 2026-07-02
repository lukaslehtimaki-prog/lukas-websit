import { AlertTriangle, Users, Globe, ShieldCheck } from "lucide-react";
import { requireTenantContext } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import { isPlacesConfigured } from "@/lib/env";
import { SearchComposer } from "@/components/leads/search-composer";
import { LeadsTable, type LeadRow } from "@/components/leads/leads-table";

export const metadata = { title: "Lead Finder · Sitexa" };

export default async function LeadsPage() {
  await requireTenantContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select(
      "id,name,address,phone,category,website,website_status,business_id,registry_status,registry_registration_date,registry_industry_code,crm_status,place_id,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const leads = (data ?? []) as unknown as LeadRow[];
  const noWebsite = leads.filter((l) => l.website_status === "no_website").length;
  const matched = leads.filter((l) => l.registry_status === "matched").length;

  const stats = [
    { icon: Users, label: "Total leads", value: leads.length },
    { icon: Globe, label: "No website", value: noWebsite },
    { icon: ShieldCheck, label: "YTJ matched", value: matched },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Lead Finder
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            Search a niche and location to find local businesses,
            cross-referenced with the YTJ registry and flagged by website
            status.
          </p>
        </div>
        <div className="flex gap-2.5">
          {stats.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 shadow-sm"
            >
              <Icon className="h-4 w-4 text-indigo-500" />
              <div>
                <div className="text-sm font-semibold tabular-nums leading-tight text-zinc-900">
                  {value}
                </div>
                <div className="text-[11px] leading-tight text-zinc-400">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isPlacesConfigured() ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Searching is disabled until you add{" "}
            <code className="font-mono">GOOGLE_MAPS_API_KEY</code> to{" "}
            <code className="font-mono">.env.local</code> and restart. See
            README → Setup.
          </span>
        </div>
      ) : null}

      <SearchComposer />
      <LeadsTable leads={leads} />
    </div>
  );
}
